const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const { COLORS } = require("./utils/ansiColors");

// IMPORT SEPARATED MODULES
const serverManager = require("./backend/CommonJS/webSocketProcessManager.cjs");
const websocketManager = require("./backend/CommonJS/Websocket/websocketManager.cjs");

// SERVICOS ADICIONAIS
const ModelLookout = require("./backend/CommonJS/Websocket/ModelLookout.cjs");
const HTTPServer = require("./backend/CommonJS/HTTP/HTTPServer.cjs");

// SSE DOWNLOAD SERVER
const { downloadManager } = require("./backend/CommonJS/SSE/initSSEDownload.cjs");
let sseServer = null;

// INSTANCIAS DOS SERVICOS
let modelLookout = null;
let httpServerInstance = null;

// SSE SERVER MANAGEMENT
const startSSEServer = async () => {
  try {
    if (downloadManager.isInitialized()) {
      const manager = downloadManager.getManager();
      if (manager.isRunning) {
        console.log(COLORS.YELLOW + 'SSE Server ja esta rodando' + COLORS.RESET);
        return manager;
      }
    }

    console.log(COLORS.CYAN + 'Iniciando SSE Download Server...' + COLORS.RESET);
    
    const scriptPath = path.join(__dirname, "backend", "python", "SSE", "Download_SSE.py");
    const pythonPath = path.join(__dirname, "backend", "venv", "bin", "python");
    
    const fs = require('fs');
    if (!fs.existsSync(scriptPath)) {
      throw new Error(`Script Python nao encontrado: ${scriptPath}`);
    }
    
    console.log(COLORS.CYAN + `Script: ${scriptPath}` + COLORS.RESET);
    console.log(COLORS.CYAN + `Python: ${pythonPath}` + COLORS.RESET);
    
    sseServer = downloadManager.initialize({
      scriptPath: scriptPath,
      pythonPath: fs.existsSync(pythonPath) ? pythonPath : 'python3',
      port: 8080,
      logLevel: 'info',
      autoRestart: true,
      maxRestarts: 3,
      restartDelay: 5000
    });
    
    await sseServer.start();
    console.log(COLORS.GREEN + 'SSE Download Server iniciado com sucesso' + COLORS.RESET);
    return sseServer;
  } catch (error) {
    console.error(COLORS.RED + 'Falha ao iniciar SSE Download Server:' + COLORS.RESET, error);
    throw error;
  }
};

const stopSSEServer = async () => {
  try {
    if (!downloadManager.isInitialized()) {
      console.log(COLORS.YELLOW + 'SSE Server nao esta inicializado' + COLORS.RESET);
      return;
    }

    const manager = downloadManager.getManager();
    if (!manager.isRunning) {
      console.log(COLORS.YELLOW + 'SSE Server nao esta rodando' + COLORS.RESET);
      return;
    }

    console.log(COLORS.CYAN + 'Parando SSE Download Server...' + COLORS.RESET);
    await manager.stop();
    console.log(COLORS.GREEN + 'SSE Download Server parado' + COLORS.RESET);
  } catch (error) {
    console.error(COLORS.RED + 'Erro ao parar SSE Download Server:' + COLORS.RESET, error);
  }
};

// HTTP SERVER MANAGEMENT
const startHTTPServer = async () => {
  try {
    console.log(COLORS.CYAN + 'Iniciando HTTP Server...' + COLORS.RESET);
    httpServerInstance = new HTTPServer();
    await httpServerInstance.startHTTP();
    console.log(COLORS.GREEN + 'HTTP Server iniciado na porta 8001' + COLORS.RESET);
    return true;
  } catch (error) {
    console.error(COLORS.RED + 'Falha ao iniciar HTTP Server:' + COLORS.RESET, error);
    return false;
  }
};

const stopHTTPServer = () => {
  if (httpServerInstance) {
    console.log(COLORS.CYAN + 'Parando HTTP Server...' + COLORS.RESET);
    httpServerInstance.stopHTTP();
    httpServerInstance = null;
    console.log(COLORS.GREEN + 'HTTP Server parado' + COLORS.RESET);
  }
};

// ELECTRON WINDOW MANAGEMENT
let mainWindow;

const createWindow = async () => {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    frame: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, "preload.cjs"),
    },
  });

  // CONFIGURAR CALLBACK DE RECONEXAO
  serverManager.setReconnectCallback(() => {
    console.log('WebSocket reconnection triggered by server manager');
    websocketManager.connectToPythonServer(mainWindow);
  });

  const isDev = !app.isPackaged;
  try {
    if (isDev) {
      await mainWindow.loadURL("http://localhost:3000/");
      mainWindow.webContents.openDevTools();
    } else {
      await mainWindow.loadFile(path.join(__dirname, "dist", "index.html"));
    }
    console.log(COLORS.GREEN + "WINDOW LOADED SUCCESSFULLY" + COLORS.RESET);
    
    // INICIAR TODOS OS SERVICOS
    setTimeout(async () => {
      // SERVICOS PRINCIPAIS
      const serverStarted = await serverManager.startPythonServer(mainWindow);
      if (serverStarted) {
        websocketManager.connectToPythonServer(mainWindow);
        
        // MODEL LOOKOUT
        modelLookout = new ModelLookout();
        modelLookout.start();
        console.log(COLORS.GREEN + "MODEL LOOKOUT STARTED" + COLORS.RESET);
        
        // HTTP SERVER
        await startHTTPServer();
      }
    }, 1000);
    
  } catch (err) {
    console.error(COLORS.RED + "ERROR LOADING WINDOW:" + COLORS.RESET, err);
  }

  mainWindow.on("closed", () => {
    mainWindow = null;
    websocketManager.closeWebSocket();
    
    // PARAR SERVICOS AO FECHAR JANELA
    if (modelLookout) {
      modelLookout.stop();
    }
    stopHTTPServer();
  });
};


// IPC HANDLERS - WINDOW CONTROLS
ipcMain.handle("window:minimize", () => {
  if (mainWindow) mainWindow.minimize();
});

ipcMain.handle("window:maximize", () => {
  if (mainWindow) {
    mainWindow.isMaximized() ? mainWindow.unmaximize() : mainWindow.maximize();
  }
});

ipcMain.handle("window:close", () => {
  if (mainWindow) mainWindow.close();
});

// IPC HANDLERS - SERVER OPERATIONS
ipcMain.handle("server:restart", async () => {
  return await serverManager.restartPythonServer(mainWindow);
});

// IPC HANDLERS - MODEL OPERATIONS
ipcMain.handle("model:send-prompt", async (_, prompt) => {
  try {
    if (!prompt?.trim()) {
      return { success: false, error: "PROMPT CANNOT BE EMPTY" };
    }
    
    const promptId = websocketManager.sendPrompt(prompt.trim());
    if (promptId) {
      return { success: true, promptId };
    } else {
      return { success: false, error: "FAILED TO SEND PROMPT - NOT CONNECTED" };
    }
  } catch (err) {
    console.error(COLORS.RED + "IPC SEND-PROMPT ERROR:" + COLORS.RESET, err);
    return { success: false, error: err.message };
  }
});

ipcMain.handle("model:stop-prompt", async (_, promptId) => {
  try {
    if (!promptId) {
      return { success: false, error: "PROMPT ID REQUIRED" };
    }
    websocketManager.cancelPrompt(promptId);
    return { success: true };
  } catch (err) {
    console.error(COLORS.RED + "IPC STOP-PROMPT ERROR:" + COLORS.RESET, err);
    return { success: false, error: err.message };
  }
});

ipcMain.handle("model:clear-memory", async () => {
  try {
    websocketManager.clearMemory();
    return { success: true };
  } catch (err) {
    console.error(COLORS.RED + "IPC CLEAR-MEMORY ERROR:" + COLORS.RESET, err);
    return { success: false, error: err.message };
  }
});

// IPC HANDLERS - SSE DOWNLOAD SERVER
ipcMain.handle("downloadServer:getStatus", async () => {
  try {
    if (!sseServer) {
      return { 
        success: false, 
        error: "Server not initialized",
        status: { isRunning: false, healthy: false }
      };
    }
    
    const status = await sseServer.getStatus();
    return { success: true, status };
  } catch (error) {
    console.error(COLORS.RED + "IPC GET-STATUS ERROR:" + COLORS.RESET, error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle("downloadServer:start", async () => {
  try {
    if (sseServer && sseServer.isRunning) {
      console.log(COLORS.YELLOW + 'Server ja esta rodando' + COLORS.RESET);
      return { success: true, info: sseServer.getServerInfo() };
    }
    
    await startSSEServer();
    return { success: true, info: sseServer.getServerInfo() };
  } catch (error) {
    console.error(COLORS.RED + "IPC START-SERVER ERROR:" + COLORS.RESET, error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle("downloadServer:getInfo", async () => {
  try {
    if (!sseServer) {
      return { 
        success: false, 
        error: "Server not initialized",
        info: { url: null, isRunning: false }
      };
    }
    
    return { success: true, info: sseServer.getServerInfo() };
  } catch (error) {
    console.error(COLORS.RED + "IPC GET-INFO ERROR:" + COLORS.RESET, error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle("downloadServer:stop", async () => {
  try {
    await stopSSEServer();
    return { success: true };
  } catch (error) {
    console.error(COLORS.RED + "IPC STOP-SERVER ERROR:" + COLORS.RESET, error);
    return { success: false, error: error.message };
  }
});

// ELECTRON EVENT HANDLERS
app.whenReady().then(async () => {
  await createWindow();
  
  // INICIAR SSE SERVER APOS JANELA
  setTimeout(async () => {
    try {
      await startSSEServer();
    } catch (error) {
      console.error(COLORS.RED + 'SSE Server failed on startup:' + COLORS.RESET, error);
    }
  }, 2000);
});

app.on("window-all-closed", async () => {
  websocketManager.closeWebSocket();
  serverManager.stopPythonServer();
  await stopSSEServer();
  
  // PARAR TODOS OS SERVICOS
  if (modelLookout) {
    modelLookout.stop();
  }
  stopHTTPServer();
  
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("before-quit", async () => {
  console.log(COLORS.CYAN + 'Limpando recursos...' + COLORS.RESET);
  websocketManager.closeWebSocket();
  serverManager.stopPythonServer();
  await stopSSEServer();
  
  // PARAR TODOS OS SERVICOS
  if (modelLookout) {
    modelLookout.stop();
  }
  stopHTTPServer();
});

app.on("will-quit", async () => {
  serverManager.stopPythonServer();
  await stopSSEServer();
  
  // PARAR TODOS OS SERVICOS
  if (modelLookout) {
    modelLookout.stop();
  }
  stopHTTPServer();
});

module.exports = {
  connectToPythonServer: websocketManager.connectToPythonServer
};