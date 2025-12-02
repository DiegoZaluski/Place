/**
 * SSE Download Server Initializer
 * Initializes FastAPI server for model downloads with SSE
 * @module initSSEDownload
 */
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const net = require('net');
const { COLORS } = require('../../../utils/ansiColors');

class ModelDownloadServerManager {
  constructor(options = {}) {
    this.options = {
      pythonPath: options.pythonPath || 'ScryPy',
      scriptPath: options.scriptPath || path.join(__dirname, '..', 'ScryPy', 'SSE', 'Download_SSE.py'),
      host: options.host || '127.0.0.1',
      port: options.port || 8080,
      timeout: options.timeout || 90000,
      autoRestart: options.autoRestart ?? true,
      maxRestarts: options.maxRestarts || 3,
      restartDelay: options.restartDelay || 5000,
      logLevel: options.logLevel || 'info',
      ...options
    };

    this.process = null;
    this.isRunning = false;
    this.isShuttingDown = false;
    this.restartCount = 0;
    this.lastStartTime = null;
    this.healthCheckInterval = null;
    this.startupPromise = null;
    this.logger = this._createLogger();
    this._startCalled = false;
    this._initializationLock = null;
  }

  /**
   * Internal logger
   * @private
   */
  _createLogger() {
    const levels = { error: 0, warn: 1, info: 2, debug: 3 };
    const currentLevel = levels[this.options.logLevel] || 2;

    return {
      error: (...args) => currentLevel >= 0 && console.error(`${COLORS.RED}[SSEDownload:ERROR]${COLORS.RESET}`, ...args),
      warn: (...args) => currentLevel >= 1 && console.warn(`${COLORS.YELLOW}[SSEDownload:WARN]${COLORS.RESET}`, ...args),
      info: (...args) => currentLevel >= 2 && console.log(`${COLORS.GREEN}[SSEDownload:INFO]${COLORS.RESET}`, ...args),
      debug: (...args) => currentLevel >= 3 && console.log(`${COLORS.CYAN}[SSEDownload:DEBUG]${COLORS.RESET}`, ...args)
    };
  }

  /**
   * Validates environment and dependencies
   * @private
   */
  async _validateEnvironment() {
    // Check if the Python script exists
    if (!fs.existsSync(this.options.scriptPath)) {
      throw new Error(`${COLORS.RED}Script not found: ${this.options.scriptPath}${COLORS.RESET}`);
    }

    // Check if Python is available
    try {
      await this._execCommand(this.options.pythonPath, ['--version']);
      this.logger.debug('Python found');
    } catch (error) {
      throw new Error(`${COLORS.RED}Python not found in PATH. Install Python 3.8+ or configure pythonPath${COLORS.RESET}`);
    }

    // Check if the port is available
    const portAvailable = await this._isPortAvailable(this.options.port);
    if (!portAvailable) {
      throw new Error(`${COLORS.RED}Port ${this.options.port} is already in use${COLORS.RESET}`);
    }

    this.logger.debug('Environment validated successfully');
  }

  /**
   * Checks if the port is available
   * @private
   */
  _isPortAvailable(port) {
    return new Promise((resolve) => {
      const server = net.createServer();
      
      server.once('error', (err) => {
        if (err.code === 'EADDRINUSE') {
          resolve(false);
        } else {
          resolve(false);
        }
      });

      server.once('listening', () => {
        server.close();
        resolve(true);
      });

      server.listen(port, '127.0.0.1');
    });
  }

  /**
   * Executes a command and returns a Promise
   * @private
   */
  _execCommand(command, args) {
    return new Promise((resolve, reject) => {
      const proc = spawn(command, args, { stdio: 'pipe' });
      
      let stdout = '';
      let stderr = '';

      proc.stdout.on('data', (data) => stdout += data.toString());
      proc.stderr.on('data', (data) => stderr += data.toString());

      proc.on('close', (code) => {
        if (code === 0) {
          resolve(stdout);
        } else {
          // Command failed with exit code
          reject(new Error(stderr || `Command failed with exit code ${code}`));
        }
      });

      proc.on('error', reject);
    });
  }

  /**
   * Waits for server to be ready
   * @private
   */
  async _waitForServer() {
    const startTime = Date.now();
    const checkInterval = 500;
    const maxAttempts = Math.floor(this.options.timeout / checkInterval);

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      if (this.isShuttingDown) {
        // Server initialization canceled: server is shutting down
        throw new Error(`${COLORS.RED}Initialization canceled: server is shutting down${COLORS.RESET}`);
      }

      try {
        const response = await this._httpGet(`http://${this.options.host}:${this.options.port}/health`);
        
        if (response && response.status === 'ok') {
          const elapsed = Date.now() - startTime;
          this.logger.info(`Server ready in ${elapsed}ms`);
          return true;
        }
      } catch (error) {
        // Server not ready yet
      }

      await this._sleep(checkInterval);
    }

    throw new Error(`Timeout: server did not respond in ${this.options.timeout}ms`);
  }

  /**
   * Simple HTTP GET (no external dependencies)
   * @private
   */
  _httpGet(url) {
    return new Promise((resolve, reject) => {
      const urlObj = new URL(url);
      const http = require('http');
      
      const request = http.get({
        hostname: urlObj.hostname,
        port: urlObj.port,
        path: urlObj.pathname,
        timeout: 5000
      }, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch {
            resolve({ status: 'ok' });
          }
        });
      });

      request.on('error', reject);
      request.on('timeout', () => {
        request.destroy();
        reject(new Error('Request timeout'));
      });
    });
  }

  /**
   * Sleep helper
   * @private
   */
  _sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Starts the FastAPI server
   * @returns {Promise<Object>} Server information
   */
  async start() {
    if (this.isRunning) {
      this.logger.warn('Server is already running');
      return this.getServerInfo();
    }

    if (this.startupPromise) {
      this.logger.debug('Waiting for startup in progress');
      return this.startupPromise;
    }

    this.startupPromise = this._doStart();

    try {
      const result = await this.startupPromise;
      return result;
    } finally {
      this.startupPromise = null;
    }
  }

  /**
   * Internal initialization logic
   * @private
   */
  async _doStart() {
    try {
      this.logger.info('Starting model download server...');

      // VALIDATE ENVIRONMENT
      await this._validateEnvironment();

      // UVICORN COMMAND (DYNAMICALLY EXTRACTS SCRIPT NAME)
      const scriptName = path.basename(this.options.scriptPath, '.py');
      const args = [
        '-m', 'uvicorn',
        `${scriptName}:app`,
        '--host', this.options.host,
        '--port', this.options.port.toString(),
        '--log-level', 'warning'
      ];

      // START PROCESS
      this.process = spawn(this.options.pythonPath, args, {
        cwd: path.dirname(this.options.scriptPath),
        stdio: ['pipe', 'pipe', 'pipe'],

        detached: false
      });

      this.lastStartTime = Date.now();

      // EVENT HANDLERS
      this.process.stdout.on('data', (data) => {
        this.logger.debug(`STDOUT: ${data.toString().trim()}`);
      });

      this.process.stderr.on('data', (data) => {
        const msg = data.toString().trim();
        if (msg && !msg.includes('WARNING') && !msg.includes('INFO')) {
          this.logger.error(`STDERR: ${msg}`);
        }
      });

      this.process.on('exit', (code, signal) => {
        this.logger.warn(`Process terminated: code=${code} signal=${signal}`);
        this.isRunning = false;

        if (!this.isShuttingDown && this.options.autoRestart) {
          this._handleAutoRestart();
        }
      });

      this.process.on('error', (error) => {
        this.logger.error('Process error:', error);
        this.isRunning = false;
      });

      // WAIT FOR SERVER TO BE READY
      await this._waitForServer();

      this.isRunning = true;
      this.restartCount = 0;

      // START HEALTH CHECK
      this._startHealthCheck();

      const info = this.getServerInfo();
      this.logger.info(`Download server started: ${info.url}`);

      return info;

    } catch (error) {
      this.logger.error('Failed to start server:', error.message);
      
      if (this.process) {
        this.process.kill();
        this.process = null;
      }

      throw error;
    }
  }

  /**
   * AUTO-RESTART AFTER FAILURE
   * @private
   */
  async _handleAutoRestart() {
    if (this.restartCount >= this.options.maxRestarts) {
      this.logger.error(`Maximum restarts reached (${this.options.maxRestarts})`);
      return;
    }

    this.restartCount++;
    this.logger.info(`Auto-restart ${this.restartCount}/${this.options.maxRestarts} in ${this.options.restartDelay}ms`);

    await this._sleep(this.options.restartDelay);

    try {
      await this.start();
    } catch (error) {
      this.logger.error('Auto-restart failed:', error.message);
    }
  }

  /**
   * START HEALTH CHECK PERIODICALLY
   * @private
   */
  _startHealthCheck() {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }

    this.healthCheckInterval = setInterval(async () => {
      if (!this.isRunning) return;

      try {
        await this._httpGet(`http://${this.options.host}:${this.options.port}/health`);
      } catch (error) {
        this.logger.warn('Health check falhou');
      }
    }, 30000); // 30s
  }

  /**
   * STOP THE SERVER
   * @returns {Promise<void>}
   */
  async stop() {
    if (!this.isRunning || !this.process) {
      this.logger.debug('Server is already stopped');
      return;
    }

    this.logger.info('Stopping model download server...');
    this.isShuttingDown = true;

    // STOP HEALTH CHECK
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }

    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        this.logger.warn('Timeout: forcing shutdown');
        if (this.process) {
          this.process.kill('SIGKILL');
        }
        resolve();
      }, 10000);

      if (this.process) {
        this.process.once('exit', () => {
          clearTimeout(timeout);
          this.process = null;
          this.isRunning = false;
          this.isShuttingDown = false;
          this.logger.info('Server stopped');
          resolve();
        });

        // Tente desligamento suave (compatível com Windows)
        const signal = process.platform === 'win32' ? 'SIGINT' : 'SIGTERM';
        this.process.kill(signal);
      } else {
        clearTimeout(timeout);
        resolve();
      }
    });
  }

  /**
   * RESTART THE SERVER
   * @returns {Promise<Object>}
   */
  async restart() {
    this.logger.info('Restarting model download server...');
    await this.stop();
    await this._sleep(1000);
    return this.start();
  }

  /**
   * Returns server information
   * @returns {Object}
   */
  getServerInfo() {
    return {
      isRunning: this.isRunning,
      url: `http://${this.options.host}:${this.options.port}`,
      host: this.options.host,
      port: this.options.port,
      pid: this.process ? this.process.pid : null,
      uptime: this.lastStartTime ? Date.now() - this.lastStartTime : 0,
      restartCount: this.restartCount
    };
  }

  /**
   * CHECKS THE SERVER STATUS
   * @returns {Promise<Object>}
   */
  async getStatus() {
    const info = this.getServerInfo();

    if (!this.isRunning) {
      return { ...info, healthy: false };
    }

    try {
      const response = await this._httpGet(`http://${this.options.host}:${this.options.port}/health`);
      return {
        ...info,
        healthy: true,
        activeDownloads: response.active_downloads || 0
      };
    } catch (error) {
      return { ...info, healthy: false };
    }
  }
}

// STRONG SINGLETON - Only one instance allowed
class ModelDownloadServerSingleton {
  constructor() {
    if (ModelDownloadServerSingleton.instance) {
      return ModelDownloadServerSingleton.instance;
    }
    
    this._manager = null;
    this._options = null;
    ModelDownloadServerSingleton.instance = this;
  }

// INITIALIZES THE SINGLETON WITH OPTIONS (ONLY ONCE)
  initialize(options = {}) {
    if (this._manager) {
      console.warn('[Singleton] Manager already initialized. Ignoring new options.');
      return this._manager;
    }

    this._options = options;
    this._manager = new ModelDownloadServerManager(options);
    return this._manager;
  }

// GETS THE MANAGER INSTANCE
  getManager() {
    if (!this._manager) {
      throw new Error('[Singleton] Manager not initialized. Call initialize() first.');
    }
    return this._manager;
  }

// CHECKS IF IT IS INITIALIZED
  isInitialized() {
    return !!this._manager;
  }

// Destroys the instance (only for tests)
  destroy() {
    if (this._manager) {
      this._manager.stop().catch(console.error);
    }
    this._manager = null;
    this._options = null;
    ModelDownloadServerSingleton.instance = null;
  }
}

// Global unique instance
const downloadServerSingleton = new ModelDownloadServerSingleton();

// FACTORY FUNCTION
function createModelDownloadServer(options = {}) {
  return downloadServerSingleton.initialize(options);
}

// CLEANUP ON APP CLOSE
async function cleanupModelDownloadServer() {
  downloadServerSingleton.destroy();
}
module.exports = {
  // MAIN SINGLETON - ALWAYS USE THIS
  downloadManager: downloadServerSingleton,
  // FACTORY - For compatibility
  createModelDownloadServer,
  // CLEANUP
  cleanupModelDownloadServer,
  // ORIGINAL CLASS (only for advanced testing)
  ModelDownloadServerManager
};