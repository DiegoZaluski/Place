const path = require('path');
const fs = require('fs');
const { COLORS } = require('../../../utils/ansiColors.cjs');
const { restartPythonServer } = require('./process-ws.cjs');
const axios = require('axios');

class ModelLookout {
  constructor(mainWindow) {
    // RECEIVES mainWindow IN CONSTRUCTOR
    if (ModelLookout.instance) {
      return ModelLookout.instance;
    }
    ModelLookout.instance = this;

    this.configPath = path.join(__dirname, '..', '..', 'config', 'current_model.json');
    this.lastModel = null;
    this.lastHash = null;
    this.isProcessing = false;
    this.changeTimeout = null;
    this.debounceDelay = 5000;
    this.isRunning = false;
    this.watcher = null;
    this.retryCount = 0;
    this.maxRetries = 3;
    this.mainWindow = mainWindow; // STORES mainWindow

    this.httpClient = axios.create({
      baseURL: 'http://localhost:8001',
      timeout: 30000,
    });

    return this;
  }

  start() {
    if (this.isRunning) {
      console.log('Model Lookout is already running');
      return;
    }

    console.log('Model Lookout started');
    this.isRunning = true;
    this.watchConfigFile();
    this.checkCurrentConfig();
  }

  watchConfigFile() {
    try {
      if (this.watcher) {
        this.watcher.close();
      }

      this.watcher = fs.watch(this.configPath, (eventType) => {
        if (eventType === 'change') {
          this.debouncedHandleConfigChange();
        }
      });

      this.watcher.on('error', (error) => {
        console.error(`${COLORS.RED}Watcher error:${COLORS.RESET}`, error.message);
        setTimeout(() => this.watchConfigFile(), 5000);
      });
    } catch (error) {
      console.error(`${COLORS.RED}Error setting up watcher:${COLORS.RESET}`, error.message);
      this.watcher = fs.watchFile(this.configPath, { interval: 1000 }, () => {
        this.debouncedHandleConfigChange();
      });
    }
  }

  debouncedHandleConfigChange() {
    if (this.changeTimeout) {
      clearTimeout(this.changeTimeout);
    }

    this.changeTimeout = setTimeout(() => {
      this.handleConfigChange();
    }, this.debounceDelay);
  }

  async checkCurrentConfig() {
    try {
      if (fs.existsSync(this.configPath)) {
        const content = fs.readFileSync(this.configPath, 'utf8').trim();
        if (!content) {
          console.log('Config file is empty');
          return;
        }

        const config = JSON.parse(content);
        this.lastModel = config.model_name;
        this.lastHash = this.generateConfigHash(config);
        console.log(`Current model: ${this.lastModel || 'None'}`);
      }
    } catch (error) {
      console.error(`${COLORS.RED}Error checking config:${COLORS.RESET}`, error.message);
    }
  }

  generateConfigHash(config) {
    return JSON.stringify({
      model_name: config.model_name,
      status: config.status,
    });
  }

  async handleConfigChange() {
    if (this.isProcessing) {
      console.log('Processing already in progress, skipping');
      return;
    }

    this.isProcessing = true;
    this.retryCount = 0;

    try {
      await this.attemptConfigUpdate();
    } catch (error) {
      console.error(`${COLORS.RED}Lookout error:${COLORS.RESET}`, error.message);
    } finally {
      this.isProcessing = false;
    }
  }

  async attemptConfigUpdate() {
    while (this.retryCount < this.maxRetries) {
      try {
        if (!fs.existsSync(this.configPath)) {
          console.log('Config file not found');
          return;
        }

        const content = fs.readFileSync(this.configPath, 'utf8').trim();
        if (!content) {
          console.log('Config file is empty');
          return;
        }

        const config = JSON.parse(content);
        const newModel = config.model_name;
        const operationId = config.operation_id;
        const newHash = this.generateConfigHash(config);

        if (newModel && newModel !== this.lastModel) {
          console.log(`Model changed: ${this.lastModel || 'none'} -> ${newModel}`);

          const success = await this.restartWithServerManager();

          if (success) {
            await this.waitForServerReady();

            this.lastModel = newModel;
            this.lastHash = newHash;
            console.log('Model update completed successfully');
            await this.notifyHttpServer(operationId, true);
            return;
          } else {
            console.error('Model update failed');
          }
        } else {
          console.log('No actual change detected, skipping restart');
          return;
        }
      } catch (error) {
        console.error(
          `${COLORS.RED}Attempt ${this.retryCount + 1} failed:${COLORS.RESET}`,
          error.message,
        );
      }

      this.retryCount++;
      if (this.retryCount < this.maxRetries) {
        console.log(`Retrying in 2 seconds... (${this.retryCount}/${this.maxRetries})`);
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    }

    console.error(`${COLORS.RED}All retry attempts failed${COLORS.RESET}`);
    try {
      if (fs.existsSync(this.configPath)) {
        const config = JSON.parse(fs.readFileSync(this.configPath, 'utf8'));
        if (config.operation_id) {
          await this.notifyHttpServer(config.operation_id, false, 'All retry attempts failed');
        }
      }
    } catch (e) {
      console.error(`${COLORS.RED}Error notifying HTTP server:${COLORS.RESET}`, e.message);
    }
  }

  async waitForServerReady() {
    console.log('Waiting for servers to be ready...');

    console.log('Checking HTTP server...');
    let httpReady = false;
    for (let i = 0; i < 60; i++) {
      try {
        const response = await this.httpClient.get('/health');
        if (response.status === 200) {
          console.log('HTTP server is ready');
          httpReady = true;
          break;
        }
      } catch (error) {
        // Server is not ready yet
      }
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    if (!httpReady) {
      throw new Error('HTTP server did not become ready in time');
    }

    console.log('Checking WebSocket server (port availability)...');
    const net = require('net');
    let wsReady = false;

    for (let i = 0; i < 60; i++) {
      try {
        await new Promise((resolve, reject) => {
          const socket = new net.Socket();

          socket.on('connect', () => {
            console.log('WebSocket server is ready (port listening)');
            socket.destroy();
            wsReady = true;
            resolve();
          });

          socket.on('error', () => {
            reject(new Error('Port not listening'));
          });

          socket.on('timeout', () => {
            reject(new Error('Timeout'));
          });

          socket.setTimeout(2000);
          socket.connect(8765, 'localhost');
        });

        break;
      } catch (error) {
        if (i === 59) {
          console.log('WebSocket port not ready, but continuing anyway...');
          break;
        }
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    console.log('Servers are ready (HTTP confirmed, WebSocket port available)');
    return true;
  }

  async restartWithServerManager() {
    try {
      console.log('Restarting server via serverManager...');
      // NOW PASS mainWindow CORRECTLY
      const result = await restartPythonServer(this.mainWindow);

      if (result && result.success) {
        console.log('Server restarted successfully');
        return true;
      } else {
        console.error('Restart failed:', result?.error || 'Unknown error');
        return false;
      }
    } catch (error) {
      console.error('Server manager error:', error.message);
      return false;
    }
  }

  async notifyHttpServer(operationId, success, message = '') {
    if (!operationId) {
      console.log('No operation_id, skipping notification');
      return;
    }

    try {
      await this.httpClient.post('/model-ready', {
        operation_id: operationId,
        success: success,
        message: message || (success ? 'Server restarted successfully' : 'Restart failed'),
      });

      console.log(`HTTP server notified: ${success ? 'SUCCESS' : 'FAILED'}`);
    } catch (error) {
      console.error('Error notifying HTTP server:', error.message);
    }
  }

  stop() {
    if (!this.isRunning) {
      return;
    }

    if (this.changeTimeout) {
      clearTimeout(this.changeTimeout);
      this.changeTimeout = null;
    }

    if (this.watcher) {
      if (typeof this.watcher.close === 'function') {
        this.watcher.close();
      } else {
        fs.unwatchFile(this.configPath);
      }
      this.watcher = null;
    }

    this.isRunning = false;
    console.log('Model Lookout stopped');
  }
}

ModelLookout.instance = null;
module.exports = ModelLookout;
