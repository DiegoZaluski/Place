const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const colors = require("./utils/ansiColors");

// IMPORT SEPARATED MODULES
const serverManager = require("./backend/CommonJS/webSocketProcessManager.cjs");
const websocketManager = require("./backend/CommonJS/Websocket/websocketManager.cjs");

// ADDITIONAL SERVICES
const ModelLookout = require("./backend/CommonJS/Websocket/ModelLookout.cjs");
const HTTPServer = require("./backend/CommonJS/HTTP/HTTPServer.cjs");

// SSE DOWNLOAD SERVER
const { downloadManager } = require("./backend/CommonJS/SSE/initSSEDownload.cjs");
let sseServer = null;

// SERVICE INSTANCES
let modelLookout = null;
let httpServerInstance = null;

// SSE SERVER MANAGEMENT
const startSSEServer = async () => {
  try {
    if (downloadManager.isInitialized()) {
      const manager = downloadManager.getManager();
      if (manager.isRunning) {
        console.log(colors.COLORS.YELLOW + 'SSE Server is already running' + colors.COLORS.RESET);
        return manager;
      }
    }

    console.log(colors.COLORS.CYAN + 'Starting SSE Download Server...' + colors.COLORS.RESET);
    
    const scriptPath = path.join(__dirname, "backend", "python", "SSE", "Download_SSE.py");
    const pythonPath = path.join(__dirname, "backend", "venv", "bin", "python");
    
    const fs = require('fs');
    if (!fs.existsSync(scriptPath)) {
      throw new Error(`Python script not found: ${scriptPath}`);
    }
    
    console.log(colors.COLORS.CYAN + `Script: ${scriptPath}` + colors.COLORS.RESET);
    console.log(colors.COLORS.CYAN + `Python: ${pythonPath}` + colors.COLORS.RESET);
    
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
    console.log(colors.COLORS.GREEN + 'SSE Download Server started successfully' + colors.COLORS.RESET);
    return sseServer;
  } catch (error) {
    console.error(colors.COLORS.RED + 'Failed to start SSE Download Server:' + colors.COLORS.RESET, error);
    throw error;
  }
};

const stopSSEServer = async () => {
  try {
    if (!downloadManager.isInitialized()) {
      console.log(colors.COLORS.YELLOW + 'SSE Server is not initialized' + colors.COLORS.RESET);
      return;
    }

    const manager = downloadManager.getManager();
    if (!manager.isRunning) {
      console.log(colors.COLORS.YELLOW + 'SSE Server is not running' + colors.COLORS.RESET);
      return;
    }

    console.log(colors.COLORS.CYAN + 'Stopping SSE Download Server...' + colors.COLORS.RESET);
    await manager.stop();
    console.log(colors.COLORS.GREEN + 'SSE Download Server stopped' + colors.COLORS.RESET);
  } catch (error) {
    console.error(colors.COLORS.RED + 'Error stopping SSE Download Server:' + colors.COLORS.RESET, error);
  }
};

// HTTP SERVER MANAGEMENT
const startHTTPServer = async () => {
  try {
    console.log(colors.COLORS.CYAN + 'Starting HTTP Server...' + colors.COLORS.RESET);
    httpServerInstance = new HTTPServer();
    await httpServerInstance.startHTTP();
    console.log(colors.COLORS.GREEN + 'HTTP Server started on port 8001' + colors.COLORS.RESET);
    return true;
  } catch (error) {
    console.error(colors.COLORS.RED + 'Failed to start HTTP Server:' + colors.COLORS.RESET, error);
    return false;
  }
};

const stopHTTPServer = () => {
  if (httpServerInstance) {
    console.log(colors.COLORS.CYAN + 'Stopping HTTP Server...' + colors.COLORS.RESET);
    httpServerInstance.stopHTTP();
    httpServerInstance = null;
    console.log(colors.COLORS.GREEN + 'HTTP Server stopped' + colors.COLORS.RESET);
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

  // CONFIGURE RECONNECTION CALLBACK
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
    console.log(colors.COLORS.GREEN + "WINDOW LOADED SUCCESSFULLY" + colors.COLORS.RESET);
    
    // START ALL SERVICES
    setTimeout(async () => {
      // MAIN SERVICES
      const serverStarted = await serverManager.startPythonServer(mainWindow);
      if (serverStarted) {
        websocketManager.connectToPythonServer(mainWindow);
        
        // MODEL LOOKOUT
        modelLookout = new ModelLookout();
        modelLookout.start();
        console.log(colors.COLORS.GREEN + "MODEL LOOKOUT STARTED" + colors.COLORS.RESET);
        
        // HTTP SERVER
        await startHTTPServer();
      }
    }, 1000);
    
  } catch (err) {
    console.error(colors.COLORS.RED + "ERROR LOADING WINDOW:" + colors.COLORS.RESET, err);
  }

  mainWindow.on("closed", () => {
    mainWindow = null;
    websocketManager.closeWebSocket();
        // STOP SERVICES WHEN WINDOW CLOSES
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
    console.error(colors.COLORS.RED + "IPC SEND-PROMPT ERROR:" + colors.COLORS.RESET, err);
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
    console.error(colors.COLORS.RED + "IPC STOP-PROMPT ERROR:" + colors.COLORS.RESET, err);
    return { success: false, error: err.message };
  }
});

ipcMain.handle("model:clear-memory", async () => {
  try {
    websocketManager.clearMemory();
    return { success: true };
  } catch (err) {
    console.error(colors.COLORS.RED + "IPC CLEAR-MEMORY ERROR:" + colors.COLORS.RESET, err);
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
    console.error(colors.COLORS.RED + "IPC GET-STATUS ERROR:" + colors.COLORS.RESET, error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle("downloadServer:start", async () => {
  try {
    if (sseServer && sseServer.isRunning) {
      console.log(colors.COLORS.YELLOW + 'Server ja esta rodando' + colors.COLORS.RESET);
      return { success: true, info: sseServer.getServerInfo() };
    }
    
    await startSSEServer();
    return { success: true, info: sseServer.getServerInfo() };
  } catch (error) {
    console.error(colors.COLORS.RED + "IPC START-SERVER ERROR:" + colors.COLORS.RESET, error);
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
    console.error(colors.COLORS.RED + "IPC GET-INFO ERROR:" + colors.COLORS.RESET, error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle("downloadServer:stop", async () => {
  try {
    await stopSSEServer();
    return { success: true };
  } catch (error) {
    console.error(colors.COLORS.RED + "IPC STOP-SERVER ERROR:" + colors.COLORS.RESET, error);
    return { success: false, error: error.message };
  }
});

// ELECTRON EVENT HANDLERS
app.whenReady().then(async () => {
  await createWindow();
  
  // START SSE SERVER AFTER WINDOW
  setTimeout(async () => {
    try {
      await startSSEServer();
    } catch (error) {
      console.error(colors.COLORS.RED + 'SSE Server failed on startup:' + colors.COLORS.RESET, error);
    }
  }, 2000);
});

app.on("window-all-closed", async () => {
  websocketManager.closeWebSocket();
  serverManager.stopPythonServer();
  await stopSSEServer();
  
  // STOP ALL SERVICES
  if (modelLookout) {
    modelLookout.stop();
  }
  stopHTTPServer();
  
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("before-quit", async () => {
  console.log(colors.COLORS.CYAN + 'Limpando recursos...' + colors.COLORS.RESET);
  websocketManager.closeWebSocket();
  serverManager.stopPythonServer();
  await stopSSEServer();
  
  // STOP ALL SERVICES
  if (modelLookout) {
    modelLookout.stop();
  }
  stopHTTPServer();
});

app.on("will-quit", async () => {
  serverManager.stopPythonServer();
  await stopSSEServer();
  
  // STOP ALL SERVICES
  if (modelLookout) {
    modelLookout.stop();
  }
  stopHTTPServer();
});

module.exports = {
  connectToPythonServer: websocketManager.connectToPythonServer
};