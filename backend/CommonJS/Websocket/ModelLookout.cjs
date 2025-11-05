const path = require('path');
const fs = require('fs');
const { restartPythonServer } = require('../managerWebSocket.cjs');
const axios = require('axios');

class ModelLookout {
    constructor() {
        // Singleton simples e funcional
        if (ModelLookout.instance) {
            return ModelLookout.instance;
        }
        ModelLookout.instance = this;

        this.configPath = path.join(__dirname, '..', '..', 'config', 'current_model.json');
        this.lastModel = null;
        this.lastHash = null;
        this.isProcessing = false;
        this.changeTimeout = null;
        this.debounceDelay = 1000;
        this.isRunning = false;
        this.watcher = null;
        
        this.httpClient = axios.create({
            baseURL: 'http://localhost:8001',
            timeout: 30000
        });

        // 🔥 GARANTIR que retorna a instância singleton
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
        // Remover watcher anterior se existir
        if (this.watcher) {
            fs.unwatchFile(this.configPath, this.watcher);
        }

        // Usar arrow function para manter o contexto
        this.watcher = (curr, prev) => {
            if (curr.mtime !== prev.mtime) {
                this.debouncedHandleConfigChange();
            }
        };

        fs.watchFile(this.configPath, { interval: 1000 }, this.watcher);
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
                const config = JSON.parse(fs.readFileSync(this.configPath, 'utf8'));
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
            operation_id: config.operation_id
        });
    }

    async handleConfigChange() {
        if (this.isProcessing) {
            console.log('Processing already in progress, skipping');
            return;
        }

        this.isProcessing = true;

        try {
            if (!fs.existsSync(this.configPath)) {
                console.log('Config file not found');
                return;
            }

            const config = JSON.parse(fs.readFileSync(this.configPath, 'utf8'));
            const newModel = config.model_name;
            const operationId = config.operation_id;
            const newHash = this.generateConfigHash(config);

            // Verificar se o modelo realmente mudou
            if (newModel && newModel !== this.lastModel) {
                console.log(`Model changed: ${this.lastModel || 'none'} -> ${newModel}`);
                
                const success = await this.restartWithServerManager();
                
                if (success) {
                    this.lastModel = newModel;
                    this.lastHash = newHash;
                    console.log('Model update completed successfully');
                } else {
                    console.error('Model update failed');
                }
                
                await this.notifyHttpServer(operationId, success);
            } else {
                console.log('No actual change detected, skipping restart');
            }

        } catch (error) {
            console.error('Lookout error:', error.message);
            
            // Tentar notificar erro
            try {
                if (fs.existsSync(this.configPath)) {
                    const config = JSON.parse(fs.readFileSync(this.configPath, 'utf8'));
                    if (config.operation_id) {
                        await this.notifyHttpServer(config.operation_id, false, error.message);
                    }
                }
            } catch (e) {
                console.error('Error notifying HTTP server:', e.message);
            }
        } finally {
            this.isProcessing = false;
        }
    }

    async restartWithServerManager() {
        try {
            console.log('Restarting server via serverManager...');
            const result = await restartPythonServer(null);
            
            if (result.success) {
                console.log('Server restarted successfully');
                return true;
            } else {
                console.error('Restart failed:', result.error);
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
                message: message || (success ? 'Server restarted' : 'Restart failed')
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
            fs.unwatchFile(this.configPath, this.watcher);
            this.watcher = null;
        }
        
        this.isRunning = false;
        console.log('Model Lookout stopped');
    }
}

// Singleton instance
ModelLookout.instance = null;

module.exports = ModelLookout;