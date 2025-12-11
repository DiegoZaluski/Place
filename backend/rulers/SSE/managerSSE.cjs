// backend/CommonJS/SSE/managerSSE.cjs
const { ipcMain, app } = require('electron');
const { createModelDownloadServer } = require('./initSSEDownload.cjs');
const path = require('path');
const colors = require('../../../utils/ansiColors');

/**
 * SSE Server Manager
 * Manages multiple SSE servers elegantly and scalably
 */
class SSEServerManager {
  constructor() {
    this.servers = new Map();
    this.isInitialized = false;
    this.defaultConfig = {
      // port: 8000,
      pythonPath: path.join(__dirname, "..", "venv", "bin", "ScryPy"), // modify-here
      logLevel: 'info',
      autoRestart: true,
      maxRetries: 3,
      retryDelay: 5000
    };
  }

  //Initializes the manager and configures IPC handlers
  async initialize() {
    if (this.isInitialized) {
      console.log(colors.COLORS.YELLOW + 'SSEServerManager is already initialized' + colors.COLORS.RESET);
      return true;
    }

    try {
      this.setupIpcHandlers();
      this.setupAppLifecycleHandlers();
      this.isInitialized = true;
      
      console.log(colors.COLORS.GREEN + 'SSEServerManager initialized successfully' + colors.COLORS.RESET);
      return true;
    } catch (error) {
      console.error(colors.COLORS.RED + 'Failed to initialize SSEServerManager:' + colors.COLORS.RESET, error);
      throw error;
    }
  }

  //Creates and starts an SSE server
  async createServer(serverId, config = {}) {
    if (this.servers.has(serverId)) {
      console.log(colors.COLORS.YELLOW + `Server ${serverId} already exists` + colors.COLORS.RESET);
      return this.getServerInfo(serverId);
    }

    try {
      const serverConfig = { ...this.defaultConfig, ...config, serverId };
      
      console.log(colors.COLORS.CYAN + `Starting SSE server: ${serverId}` + colors.COLORS.RESET);
      
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
      
      console.log(colors.COLORS.GREEN + `SSE server ${serverId}` + colors.COLORS.RESET);
      
      return serverInfo;
    } catch (error) {
      console.error(colors.COLORS.RED + `Failed to start server ${serverId}:` + colors.COLORS.RESET, error);
      
      // Tentativa de retry automático se configurado
      if (config.autoRestart && (!config.maxRetries || this.servers.get(serverId)?.retryCount < config.maxRetries)) {
        return this.handleServerRestart(serverId, config, error);
      }
      
      throw error;
    }
  }

//Stops and removes an SSE server
  async stopServer(serverId) {
    if (!this.servers.has(serverId)) {
      console.log(colors.COLORS.YELLOW + `Server ${serverId} not found` + colors.COLORS.RESET);
      return false;
    }

    try {
      const serverInfo = this.servers.get(serverId);
      console.log(colors.COLORS.CYAN + `Stopping SSE server: ${serverId}` + colors.COLORS.RESET);
      
      await serverInfo.instance.stop();
      this.servers.delete(serverId);
      
      console.log(colors.COLORS.GREEN + `SSE server ${serverId} stopped successfully` + colors.COLORS.RESET);
      return true;
    } catch (error) {
      console.error(colors.COLORS.RED + `Error stopping server ${serverId}:` + colors.COLORS.RESET, error);
      throw error;
    }
  }

  //Restarts an SSE server
  async restartServer(serverId) {
    if (!this.servers.has(serverId)) {
      throw new Error(`Server ${serverId} not found`);
    }

    try {
      const serverInfo = this.servers.get(serverId);
      console.log(colors.COLORS.CYAN + `Restarting SSE server: ${serverId}` + colors.COLORS.RESET);
      
      await serverInfo.instance.stop();
      await new Promise(resolve => setTimeout(resolve, 1000)); // Delay para limpeza
      await serverInfo.instance.start();
      
      serverInfo.status = 'running';
      serverInfo.startTime = new Date();
      
      console.log(colors.COLORS.GREEN + `SSE server ${serverId} restarted successfully` + colors.COLORS.RESET);
      return serverInfo;
    } catch (error) {
      console.error(colors.COLORS.RED + `Error restarting server ${serverId}:` + colors.COLORS.RESET, error);
      serverInfo.status = 'error';
      throw error;
    }
  }

// GETS INFORMATION ABOUT A SPECIFIC SERVER
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
      uptime: Math.floor(uptime / 1000),
      startTime: serverInfo.startTime,
      retryCount: serverInfo.retryCount
    };
  }

// LISTS ALL MANAGED SERVERS
  getAllServers() {
    const servers = [];
    for (const [serverId, serverInfo] of this.servers) {
      servers.push(this.getServerInfo(serverId));
    }
    return servers;
  }

// STOPS ALL MANAGED SERVERS
  async stopAllServers() {
    console.log(colors.COLORS.CYAN + 'Stopping all SSE servers...' + colors.COLORS.RESET);
    
    const stopPromises = [];
    for (const [serverId] of this.servers) {
      stopPromises.push(this.stopServer(serverId).catch(error => {
        console.error(colors.COLORS.RED + `Erro ao parar ${serverId}:` + colors.COLORS.RESET, error);
      }));
    }

    await Promise.allSettled(stopPromises);
    console.log(colors.COLORS.GREEN + 'All SSE servers have been stopped' + colors.COLORS.RESET);
  }

// SETS UP IPC HANDLERS FOR FRONTEND COMMUNICATION
  setupIpcHandlers() {
    // Gets status of all servers
    ipcMain.handle('sse:get-all-servers', () => {
      return this.getAllServers();
    });

    // Gets information of a specific server
    ipcMain.handle('sse:get-server-info', (_, serverId) => {
      return this.getServerInfo(serverId);
    });

    // Creates a new server
    ipcMain.handle('sse:create-server', async (_, serverId, config = {}) => {
      try {
        const serverInfo = await this.createServer(serverId, config);
        return { success: true, server: serverInfo };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });

    // Stops a server
    ipcMain.handle('sse:stop-server', async (_, serverId) => {
      try {
        await this.stopServer(serverId);
        return { success: true };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });

    // Restarts a server
    ipcMain.handle('sse:restart-server', async (_, serverId) => {
      try {
        const serverInfo = await this.restartServer(serverId);
        return { success: true, server: serverInfo };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });

    console.log(colors.COLORS.GREEN + 'IPC handlers configured for SSEServerManager' + colors.COLORS.RESET);
  }

// SETS UP EVENT LISTENERS FOR APP LIFECYCLE
  setupAppLifecycleHandlers() {
    app.on('before-quit', async () => {
      console.log(colors.COLORS.CYAN + 'App is closing, stopping SSE servers...' + colors.COLORS.RESET);
      await this.stopAllServers();
    });

    process.on('SIGINT', async () => {
      console.log(colors.COLORS.CYAN + 'Received SIGINT, stopping SSE servers...' + colors.COLORS.RESET);
      await this.stopAllServers();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      console.log(colors.COLORS.CYAN + 'Received SIGTERM, stopping SSE servers...' + colors.COLORS.RESET);
      await this.stopAllServers();
      process.exit(0);
    });
  }

// Configures event listeners for each server
  setupServerEventListeners(serverId, serverInstance) {
    // Here you can add specific listeners for server events
    // For example: logs, error events, status changes, etc.
    
    serverInstance.on('error', (error) => {
      console.error(colors.COLORS.RED + `Error in server ${serverId}:` + colors.COLORS.RESET, error);
      
      const serverInfo = this.servers.get(serverId);
      if (serverInfo) {
        serverInfo.status = 'error';
        
        // Auto-restart if configured
        if (serverInfo.config.autoRestart) {
          this.handleServerRestart(serverId, serverInfo.config, error);
        }
      }
    });

    serverInstance.on('started', () => {
      console.log(colors.COLORS.GREEN + `Servidor ${serverId} iniciado com sucesso` + colors.COLORS.RESET);
      
      const serverInfo = this.servers.get(serverId);
      if (serverInfo) {
        serverInfo.status = 'running';
        serverInfo.startTime = new Date();
      }
    });

    serverInstance.on('stopped', () => {
      console.log(colors.COLORS.YELLOW + `Servidor ${serverId} parado` + colors.COLORS.RESET);
      
      const serverInfo = this.servers.get(serverId);
      if (serverInfo) {
        serverInfo.status = 'stopped';
      }
    });
  }

// HANDLES AUTOMATIC SERVER RESTART WITH BACKOFF
  async handleServerRestart(serverId, config, originalError) {
    const serverInfo = this.servers.get(serverId);
    if (!serverInfo) return;

    serverInfo.retryCount++;
    
    if (serverInfo.retryCount > (config.maxRetries || this.defaultConfig.maxRetries)) {
      console.error(colors.COLORS.RED + `Maximum number of attempts exceeded for ${serverId}` + colors.COLORS.RESET);
      serverInfo.status = 'failed';
      return;
    }

    const retryDelay = (config.retryDelay || this.defaultConfig.retryDelay) * serverInfo.retryCount;
    
    console.log(colors.COLORS.YELLOW + `Attempt ${serverInfo.retryCount} for server ${serverId} in ${retryDelay}ms` + colors.COLORS.RESET);
    
    setTimeout(async () => {
      try {
        await this.restartServer(serverId);
        serverInfo.retryCount = 0; 
      } catch (error) {
        console.error(colors.COLORS.RED + `Failure in attempt ${serverInfo.retryCount} for ${serverId}:` + colors.COLORS.RESET, error);
      }
    }, retryDelay);
  }

// CHECKS HEALTH OF ALL SERVERS
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

const sseManager = new SSEServerManager();
module.exports = sseManager;