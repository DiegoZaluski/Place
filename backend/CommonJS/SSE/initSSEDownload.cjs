/**
 * SSE Download Server Initializer
 * Inicializa servidor FastAPI com SSE para downloads de modelos LLM
 * @module initSSEDownload
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const net = require('net');

class ModelDownloadServerManager {
  constructor(options = {}) {
    this.options = {
      pythonPath: options.pythonPath || 'python',
      scriptPath: options.scriptPath || path.join(__dirname, '..', 'python', 'SSE', 'Download_SSE.py'),
      host: options.host || '127.0.0.1',
      port: options.port || 8000,
      timeout: options.timeout || 30000,
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
  }

  /**
   * Logger interno
   * @private
   */
  _createLogger() {
    const levels = { error: 0, warn: 1, info: 2, debug: 3 };
    const currentLevel = levels[this.options.logLevel] || 2;

    return {
      error: (...args) => currentLevel >= 0 && console.error('[SSEDownload:ERROR]', ...args),
      warn: (...args) => currentLevel >= 1 && console.warn('[SSEDownload:WARN]', ...args),
      info: (...args) => currentLevel >= 2 && console.log('[SSEDownload:INFO]', ...args),
      debug: (...args) => currentLevel >= 3 && console.log('[SSEDownload:DEBUG]', ...args)
    };
  }

  /**
   * Valida configurações e dependências
   * @private
   */
  async _validateEnvironment() {
    // Verificar se o script Python existe
    if (!fs.existsSync(this.options.scriptPath)) {
      throw new Error(`Script não encontrado: ${this.options.scriptPath}`);
    }

    // Verificar se Python está disponível
    try {
      await this._execCommand(this.options.pythonPath, ['--version']);
      this.logger.debug('Python encontrado');
    } catch (error) {
      throw new Error('Python não encontrado no PATH. Instale Python 3.8+ ou configure pythonPath');
    }

    // Verificar porta disponível
    const portAvailable = await this._isPortAvailable(this.options.port);
    if (!portAvailable) {
      throw new Error(`Porta ${this.options.port} já está em uso`);
    }

    this.logger.debug('Ambiente validado com sucesso');
  }

  /**
   * Verifica se porta está disponível
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
   * Executa comando e retorna Promise
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
          reject(new Error(stderr || `Comando falhou com código ${code}`));
        }
      });

      proc.on('error', reject);
    });
  }

  /**
   * Aguarda servidor ficar pronto
   * @private
   */
  async _waitForServer() {
    const startTime = Date.now();
    const checkInterval = 500;
    const maxAttempts = Math.floor(this.options.timeout / checkInterval);

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      if (this.isShuttingDown) {
        throw new Error('Inicialização cancelada: servidor em shutdown');
      }

      try {
        const response = await this._httpGet(`http://${this.options.host}:${this.options.port}/health`);
        
        if (response && response.status === 'ok') {
          const elapsed = Date.now() - startTime;
          this.logger.info(`Servidor pronto em ${elapsed}ms`);
          return true;
        }
      } catch (error) {
        // Servidor ainda não está pronto
      }

      await this._sleep(checkInterval);
    }

    throw new Error(`Timeout: servidor não respondeu em ${this.options.timeout}ms`);
  }

  /**
   * HTTP GET simples (sem dependências externas)
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
   * Inicia o servidor FastAPI
   * @returns {Promise<Object>} Informações do servidor
   */
  async start() {
    if (this.isRunning) {
      this.logger.warn('Servidor já está rodando');
      return this.getServerInfo();
    }

    if (this.startupPromise) {
      this.logger.debug('Aguardando inicialização em andamento');
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
   * Lógica interna de inicialização
   * @private
   */
  async _doStart() {
    try {
      this.logger.info('Iniciando servidor de downloads de modelos...');

      // Validar ambiente
      await this._validateEnvironment();

      // Comando uvicorn (extrai nome do script dinamicamente)
      const scriptName = path.basename(this.options.scriptPath, '.py');
      const args = [
        '-m', 'uvicorn',
        `${scriptName}:app`,
        '--host', this.options.host,
        '--port', this.options.port.toString(),
        '--log-level', 'warning'
      ];

      // Iniciar processo
      this.process = spawn(this.options.pythonPath, args, {
        cwd: path.dirname(this.options.scriptPath),
        stdio: ['ignore', 'pipe', 'pipe'],
        detached: false
      });

      this.lastStartTime = Date.now();

      // Handlers de eventos
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
        this.logger.warn(`Processo encerrado: código=${code} sinal=${signal}`);
        this.isRunning = false;

        if (!this.isShuttingDown && this.options.autoRestart) {
          this._handleAutoRestart();
        }
      });

      this.process.on('error', (error) => {
        this.logger.error('Erro no processo:', error);
        this.isRunning = false;
      });

      // Aguardar servidor ficar pronto
      await this._waitForServer();

      this.isRunning = true;
      this.restartCount = 0;

      // Iniciar health check
      this._startHealthCheck();

      const info = this.getServerInfo();
      this.logger.info(`✅ Servidor de downloads iniciado: ${info.url}`);

      return info;

    } catch (error) {
      this.logger.error('Falha ao iniciar servidor:', error.message);
      
      if (this.process) {
        this.process.kill();
        this.process = null;
      }

      throw error;
    }
  }

  /**
   * Auto-restart após falha
   * @private
   */
  async _handleAutoRestart() {
    if (this.restartCount >= this.options.maxRestarts) {
      this.logger.error(`Máximo de restarts atingido (${this.options.maxRestarts})`);
      return;
    }

    this.restartCount++;
    this.logger.info(`Auto-restart ${this.restartCount}/${this.options.maxRestarts} em ${this.options.restartDelay}ms`);

    await this._sleep(this.options.restartDelay);

    try {
      await this.start();
    } catch (error) {
      this.logger.error('Falha no auto-restart:', error.message);
    }
  }

  /**
   * Health check periódico
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
   * Para o servidor
   * @returns {Promise<void>}
   */
  async stop() {
    if (!this.isRunning || !this.process) {
      this.logger.debug('Servidor já está parado');
      return;
    }

    this.logger.info('Parando servidor de downloads...');
    this.isShuttingDown = true;

    // Parar health check
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }

    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        this.logger.warn('Timeout: forçando encerramento');
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
          this.logger.info('✅ Servidor de downloads parado');
          resolve();
        });

        // Tentar graceful shutdown (compatível com Windows)
        const signal = process.platform === 'win32' ? 'SIGINT' : 'SIGTERM';
        this.process.kill(signal);
      } else {
        clearTimeout(timeout);
        resolve();
      }
    });
  }

  /**
   * Reinicia o servidor
   * @returns {Promise<Object>}
   */
  async restart() {
    this.logger.info('Reiniciando servidor de downloads...');
    await this.stop();
    await this._sleep(1000);
    return this.start();
  }

  /**
   * Retorna informações do servidor
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
   * Verifica status do servidor
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

/**
 * Instância singleton (opcional)
 */
let defaultInstance = null;

/**
 * Factory function para criar/obter instância
 * @param {Object} options - Opções de configuração
 * @returns {ModelDownloadServerManager}
 */
function createModelDownloadServer(options = {}) {
  if (options.singleton !== false) {
    if (!defaultInstance) {
      defaultInstance = new ModelDownloadServerManager(options);
    }
    return defaultInstance;
  }
  return new ModelDownloadServerManager(options);
}

/**
 * Cleanup ao fechar aplicação
 */
async function cleanupModelDownloadServer() {
  if (defaultInstance) {
    await defaultInstance.stop();
    defaultInstance = null;
  }
}

// Exportar
module.exports = {
  ModelDownloadServerManager,
  createModelDownloadServer,
  cleanupModelDownloadServer
};
