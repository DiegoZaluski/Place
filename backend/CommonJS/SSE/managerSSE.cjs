// backend/CommonJS/SSE/managerSSE.cjs
const { ipcMain, app } = require('electron');
const { createModelDownloadServer } = require('./initSSEDownload.cjs');
const path = require('path');
const { COLORS } = require('../../utils/ansiColors');
/**
 * 🚀 Professional SSE Server Manager
 * Gerencia múltiplos servidores SSE de forma elegante e escalável
 */
class SSEServerManager {
  constructor() {
    this.servers = new Map();
    this.isInitialized = false;
    this.defaultConfig = {
      port: 8000,
      pythonPath: path.join(__dirname, "..", "venv", "bin", "python"),
      logLevel: 'info',
      autoRestart: true,
      maxRetries: 3,
      retryDelay: 5000
    };
  }

  /**
   * Inicializa o gerenciador e configura handlers IPC
   */
  async initialize() {
    if (this.isInitialized) {
      console.log(COLORS.YELLOW + '⚠️ SSEServerManager já está inicializado' + COLORS.RESET);
      return true;
    }

    try {
      this.setupIpcHandlers();
      this.setupAppLifecycleHandlers();
      this.isInitialized = true;
      
      console.log(COLORS.GREEN + '✅ SSEServerManager inicializado com sucesso' + COLORS.RESET);
      return true;
    } catch (error) {
      console.error(COLORS.RED + '❌ Falha na inicialização do SSEServerManager:' + COLORS.RESET, error);
      throw error;
    }
  }

  /**
   * Cria e inicia um servidor SSE
   */
  async createServer(serverId, config = {}) {
    if (this.servers.has(serverId)) {
      console.log(COLORS.YELLOW + `⚠️ Servidor ${serverId} já existe` + COLORS.RESET);
      return this.getServerInfo(serverId);
    }

    try {
      const serverConfig = { ...this.defaultConfig, ...config, serverId };
      
      console.log(COLORS.CYAN + `🚀 Iniciando servidor SSE: ${serverId}` + COLORS.RESET);
      
      const server = createModelDownloadServer(serverConfig);
      await server.start();

      const serverInfo = {
        id: serverId,
        instance: server,
        config: serverConfig,
        status: 'running',
        startTime: new Date(),
        retryCount: 0
      };

      this.servers.set(serverId, serverInfo);
      
      // Configurar event listeners para o servidor
      this.setupServerEventListeners(serverId, server);
      
      console.log(COLORS.GREEN + `✅ Servidor SSE ${serverId} iniciado na porta ${serverConfig.port}` + COLORS.RESET);
      
      return serverInfo;
    } catch (error) {
      console.error(COLORS.RED + `❌ Falha ao iniciar servidor ${serverId}:` + COLORS.RESET, error);
      
      // Tentativa de retry automático se configurado
      if (config.autoRestart && (!config.maxRetries || this.servers.get(serverId)?.retryCount < config.maxRetries)) {
        return this.handleServerRestart(serverId, config, error);
      }
      
      throw error;
    }
  }

  /**
   * Para e remove um servidor SSE
   */
  async stopServer(serverId) {
    if (!this.servers.has(serverId)) {
      console.log(COLORS.YELLOW + `⚠️ Servidor ${serverId} não encontrado` + COLORS.RESET);
      return false;
    }

    try {
      const serverInfo = this.servers.get(serverId);
      console.log(COLORS.CYAN + `🛑 Parando servidor SSE: ${serverId}` + COLORS.RESET);
      
      await serverInfo.instance.stop();
      this.servers.delete(serverId);
      
      console.log(COLORS.GREEN + `✅ Servidor SSE ${serverId} parado com sucesso` + COLORS.RESET);
      return true;
    } catch (error) {
      console.error(COLORS.RED + `❌ Erro ao parar servidor ${serverId}:` + COLORS.RESET, error);
      throw error;
    }
  }

  /**
   * Reinicia um servidor SSE
   */
  async restartServer(serverId) {
    if (!this.servers.has(serverId)) {
      throw new Error(`Servidor ${serverId} não encontrado`);
    }

    try {
      const serverInfo = this.servers.get(serverId);
      console.log(COLORS.CYAN + `🔄 Reiniciando servidor SSE: ${serverId}` + COLORS.RESET);
      
      await serverInfo.instance.stop();
      await new Promise(resolve => setTimeout(resolve, 1000)); // Delay para limpeza
      await serverInfo.instance.start();
      
      serverInfo.status = 'running';
      serverInfo.startTime = new Date();
      
      console.log(COLORS.GREEN + `✅ Servidor SSE ${serverId} reiniciado com sucesso` + COLORS.RESET);
      return serverInfo;
    } catch (error) {
      console.error(COLORS.RED + `❌ Erro ao reiniciar servidor ${serverId}:` + COLORS.RESET, error);
      serverInfo.status = 'error';
      throw error;
    }
  }

  /**
   * Obtém informações de um servidor específico
   */
  getServerInfo(serverId) {
    if (!this.servers.has(serverId)) {
      return null;
    }

    const serverInfo = this.servers.get(serverId);
    const uptime = Date.now() - serverInfo.startTime.getTime();
    
    return {
      id: serverInfo.id,
      status: serverInfo.status,
      config: serverInfo.config,
      uptime: Math.floor(uptime / 1000), // em segundos
      startTime: serverInfo.startTime,
      retryCount: serverInfo.retryCount
    };
  }

  /**
   * Lista todos os servidores gerenciados
   */
  getAllServers() {
    const servers = [];
    for (const [serverId, serverInfo] of this.servers) {
      servers.push(this.getServerInfo(serverId));
    }
    return servers;
  }

  /**
   * Para todos os servidores gerenciados
   */
  async stopAllServers() {
    console.log(COLORS.CYAN + '🛑 Parando todos os servidores SSE...' + COLORS.RESET);
    
    const stopPromises = [];
    for (const [serverId] of this.servers) {
      stopPromises.push(this.stopServer(serverId).catch(error => {
        console.error(COLORS.RED + `❌ Erro ao parar ${serverId}:` + COLORS.RESET, error);
      }));
    }

    await Promise.allSettled(stopPromises);
    console.log(COLORS.GREEN + '✅ Todos os servidores SSE foram parados' + COLORS.RESET);
  }

  /**
   * Configura handlers IPC para comunicação com o frontend
   */
  setupIpcHandlers() {
    // Obter status de todos os servidores
    ipcMain.handle('sse:get-all-servers', () => {
      return this.getAllServers();
    });

    // Obter informações de um servidor específico
    ipcMain.handle('sse:get-server-info', (_, serverId) => {
      return this.getServerInfo(serverId);
    });

    // Criar novo servidor
    ipcMain.handle('sse:create-server', async (_, serverId, config = {}) => {
      try {
        const serverInfo = await this.createServer(serverId, config);
        return { success: true, server: serverInfo };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });

    // Parar servidor
    ipcMain.handle('sse:stop-server', async (_, serverId) => {
      try {
        await this.stopServer(serverId);
        return { success: true };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });

    // Reiniciar servidor
    ipcMain.handle('sse:restart-server', async (_, serverId) => {
      try {
        const serverInfo = await this.restartServer(serverId);
        return { success: true, server: serverInfo };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });

    console.log(COLORS.GREEN + '✅ Handlers IPC configurados para SSEServerManager' + COLORS.RESET);
  }

  /**
   * Configura event listeners para o ciclo de vida do app
   */
  setupAppLifecycleHandlers() {
    app.on('before-quit', async () => {
      console.log(COLORS.CYAN + '📱 App está fechando, parando servidores SSE...' + COLORS.RESET);
      await this.stopAllServers();
    });

    process.on('SIGINT', async () => {
      console.log(COLORS.CYAN + '🔄 Recebido SIGINT, parando servidores SSE...' + COLORS.RESET);
      await this.stopAllServers();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      console.log(COLORS.CYAN + '🔄 Recebido SIGTERM, parando servidores SSE...' + COLORS.RESET);
      await this.stopAllServers();
      process.exit(0);
    });
  }

  /**
   * Configura event listeners específicos para cada servidor
   */
  setupServerEventListeners(serverId, serverInstance) {
    // Aqui você pode adicionar listeners específicos para eventos do servidor
    // Por exemplo: logs, eventos de erro, mudanças de status, etc.
    
    serverInstance.on('error', (error) => {
      console.error(COLORS.RED + `❌ Erro no servidor ${serverId}:` + COLORS.RESET, error);
      
      const serverInfo = this.servers.get(serverId);
      if (serverInfo) {
        serverInfo.status = 'error';
        
        // Auto-restart se configurado
        if (serverInfo.config.autoRestart) {
          this.handleServerRestart(serverId, serverInfo.config, error);
        }
      }
    });

    serverInstance.on('started', () => {
      console.log(COLORS.GREEN + `✅ Servidor ${serverId} iniciado com sucesso` + COLORS.RESET);
      
      const serverInfo = this.servers.get(serverId);
      if (serverInfo) {
        serverInfo.status = 'running';
        serverInfo.startTime = new Date();
      }
    });

    serverInstance.on('stopped', () => {
      console.log(COLORS.YELLOW + `⚠️ Servidor ${serverId} parado` + COLORS.RESET);
      
      const serverInfo = this.servers.get(serverId);
      if (serverInfo) {
        serverInfo.status = 'stopped';
      }
    });
  }

  /**
   * Manipula o restart automático de servidores com backoff
   */
  async handleServerRestart(serverId, config, originalError) {
    const serverInfo = this.servers.get(serverId);
    if (!serverInfo) return;

    serverInfo.retryCount++;
    
    if (serverInfo.retryCount > (config.maxRetries || this.defaultConfig.maxRetries)) {
      console.error(COLORS.RED + `❌ Número máximo de tentativas excedido para ${serverId}` + COLORS.RESET);
      serverInfo.status = 'failed';
      return;
    }

    const retryDelay = (config.retryDelay || this.defaultConfig.retryDelay) * serverInfo.retryCount;
    
    console.log(COLORS.YELLOW + `🔄 Tentativa ${serverInfo.retryCount} para servidor ${serverId} em ${retryDelay}ms` + COLORS.RESET);
    
    setTimeout(async () => {
      try {
        await this.restartServer(serverId);
        serverInfo.retryCount = 0; // Reset no contador após sucesso
      } catch (error) {
        console.error(COLORS.RED + `❌ Falha na tentativa ${serverInfo.retryCount} para ${serverId}:` + COLORS.RESET, error);
      }
    }, retryDelay);
  }

  /**
   * Verifica a saúde de todos os servidores
   */
  async healthCheck() {
    const health = {
      timestamp: new Date(),
      servers: [],
      healthy: true
    };

    for (const [serverId, serverInfo] of this.servers) {
      const serverHealth = {
        id: serverId,
        status: serverInfo.status,
        uptime: Date.now() - serverInfo.startTime.getTime(),
        retryCount: serverInfo.retryCount,
        healthy: serverInfo.status === 'running'
      };

      health.servers.push(serverHealth);
      
      if (!serverHealth.healthy) {
        health.healthy = false;
      }
    }

    return health;
  }
}

// Singleton pattern para garantir uma única instância global
const sseManager = new SSEServerManager();

module.exports = sseManager;