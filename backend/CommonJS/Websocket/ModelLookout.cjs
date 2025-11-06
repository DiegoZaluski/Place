const path = require('path');
const fs = require('fs');
const { restartPythonServer } = require('../managerWebSocket.cjs');
const axios = require('axios');

class ModelLookout {
    constructor() {
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
        
        this.httpClient = axios.create({
            baseURL: 'http://localhost:8001',
            timeout: 30000
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
        // Usar fs.watch que é mais eficiente
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
                console.error('Watcher error:', error.message);
                // Tentar reiniciar o watcher após 5 segundos
                setTimeout(() => this.watchConfigFile(), 5000);
            });

        } catch (error) {
            console.error('Error setting up watcher:', error.message);
            // Fallback para watchFile se watch falhar
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
            console.error('Error checking config:', error.message);
        }
    }

    generateConfigHash(config) {
        return JSON.stringify({
            model_name: config.model_name,
            status: config.status
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
            console.error('Lookout error:', error.message);
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

                // Verificar se o modelo realmente mudou
                if (newModel && newModel !== this.lastModel) {
                    console.log(`🔄 Model changed: ${this.lastModel || 'none'} -> ${newModel}`);
                    
                    const success = await this.restartWithServerManager();
                    
                    if (success) {
                        // Aguardar um pouco para o servidor estabilizar
                        await this.waitForServerReady();
                        
                        this.lastModel = newModel;
                        this.lastHash = newHash;
                        console.log('✅ Model update completed successfully');
                        await this.notifyHttpServer(operationId, true);
                        return; // Sucesso, sair do loop
                    } else {
                        console.error('❌ Model update failed');
                    }
                } else {
                    console.log('ℹ️ No actual change detected, skipping restart');
                    return;
                }
            } catch (error) {
                console.error(`❌ Attempt ${this.retryCount + 1} failed:`, error.message);
            }

            this.retryCount++;
            if (this.retryCount < this.maxRetries) {
                console.log(`🔄 Retrying in 2 seconds... (${this.retryCount}/${this.maxRetries})`);
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        }

        // Todas as tentativas falharam
        console.error('❌ All retry attempts failed');
        try {
            if (fs.existsSync(this.configPath)) {
                const config = JSON.parse(fs.readFileSync(this.configPath, 'utf8'));
                if (config.operation_id) {
                    await this.notifyHttpServer(config.operation_id, false, 'All retry attempts failed');
                }
            }
        } catch (e) {
            console.error('Error notifying HTTP server:', e.message);
        }
    }

    async waitForServerReady() {
        console.log('⏳ Waiting for servers to be ready...');
        
        // Primeiro verifica HTTP server (porta 8001)
        console.log('🔍 Checking HTTP server...');
        let httpReady = false;
        for (let i = 0; i < 60; i++) {
            try {
                const response = await this.httpClient.get('/health');
                if (response.status === 200) {
                    console.log('✅ HTTP server is ready');
                    httpReady = true;
                    break;
                }
            } catch (error) {
                // Servidor ainda não está pronto
            }
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        if (!httpReady) {
            throw new Error('HTTP server did not become ready in time');
        }

        // Para o WebSocket, verificamos apenas se a porta está ouvindo
        // sem criar uma conexão WebSocket real que possa interferir
        console.log('🔍 Checking WebSocket server (port availability)...');
        const net = require('net');
        let wsReady = false;
        
        for (let i = 0; i < 60; i++) {
            try {
                await new Promise((resolve, reject) => {
                    const socket = new net.Socket();
                    
                    socket.on('connect', () => {
                        console.log('✅ WebSocket server is ready (port listening)');
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
                
                break; // Porta está ouvindo com sucesso
                
            } catch (error) {
                // Porta ainda não está ouvindo
                if (i === 59) {
                    console.log('⚠️ WebSocket port not ready, but continuing anyway...');
                    // Não lançamos erro aqui, pois o HTTP está funcionando
                    // O WebSocket pode demorar mais para carregar o modelo
                    break;
                }
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }

        console.log('✅ Servers are ready (HTTP confirmed, WebSocket port available)');
        return true;
    }

    async restartWithServerManager() {
        try {
            console.log('🔄 Restarting server via serverManager...');
            const result = await restartPythonServer(null);
            
            if (result && result.success) {
                console.log('✅ Server restarted successfully');
                return true;
            } else {
                console.error('❌ Restart failed:', result?.error || 'Unknown error');
                return false;
            }
        } catch (error) {
            console.error('❌ Server manager error:', error.message);
            return false;
        }
    }

    async notifyHttpServer(operationId, success, message = '') {
        if (!operationId) {
            console.log('ℹ️ No operation_id, skipping notification');
            return;
        }

        try {
            await this.httpClient.post('/model-ready', {
                operation_id: operationId,
                success: success,
                message: message || (success ? 'Server restarted successfully' : 'Restart failed')
            });
            
            console.log(`📨 HTTP server notified: ${success ? 'SUCCESS' : 'FAILED'}`);
        } catch (error) {
            console.error('❌ Error notifying HTTP server:', error.message);
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
        console.log('🛑 Model Lookout stopped');
    }
}

// Singleton instance
ModelLookout.instance = null;

module.exports = ModelLookout;