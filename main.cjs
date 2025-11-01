const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const { COLORS } = require("./utils/ansiColors");

// IMPORT SEPARATED MODULES
const serverManager = require("./backend/CommonJS/managerWebSocket.cjs");
const websocketManager = require("./backend/CommonJS/Websocket/websocket-manager.cjs");

// NEW COD -----------------------------------------------------------------
// SSE Download Server (Apenas para testes - pode ser removido facilmente)
const { createModelDownloadServer } = require("./backend/CommonJS/SSE/initSSEDownload.cjs");
let sseServer = null;

const startSSEServer = async () => {
  try {
    sseServer = createModelDownloadServer({
      pythonPath: path.join(__dirname, "backend", "venv", "bin", "python"),
      port: 8000,
      logLevel: 'info',
      autoRestart: true
    });
    
    await sseServer.start();
    console.log(COLORS.CYAN + '✅ SSE Download Server started' + COLORS.RESET);
  } catch (error) {
    console.error(COLORS.RED + '❌ Failed to start SSE Download Server:' + COLORS.RESET, error);
  }
};

const stopSSEServer = async () => {
  if (sseServer) {
    try {
      await sseServer.stop();
      console.log(COLORS.CYAN + '🛑 SSE Download Server stopped' + COLORS.RESET);
    } catch (error) {
      console.error(COLORS.RED + '❌ Error stopping SSE Download Server:' + COLORS.RESET, error);
    }
  }
};
// END NEW COD -------------------------------------------------------------

let mainWindow;

// CREATES THE MAIN ELECTRON WINDOW
async function createWindow() {
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

  const isDev = !app.isPackaged;
  try {
    if (isDev) {
      await mainWindow.loadURL("http://localhost:3000/");
      mainWindow.webContents.openDevTools();
    } else {
      await mainWindow.loadFile(path.join(__dirname, "dist", "index.html"));
    }
    console.log(COLORS.GREEN + "WINDOW LOADED SUCCESSFULLY" + COLORS.RESET);
    
    // START PYTHON SERVER AND THEN CONNECT
    setTimeout(async () => {
      const serverStarted = await serverManager.startPythonServer(mainWindow);
      if (serverStarted) {
        websocketManager.connectToPythonServer(mainWindow);
      }
    }, 1000);
    
  } catch (err) {
    console.error(COLORS.RED + "ERROR LOADING WINDOW:" + COLORS.RESET, err);
  }

  mainWindow.on("closed", () => {
    mainWindow = null;
    websocketManager.closeWebSocket();
  });
}

// IPC HANDLERS FOR WINDOW CONTROLS
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

// IPC HANDLERS FOR SERVER OPERATIONS
ipcMain.handle("server:restart", async () => {
  return await serverManager.restartPythonServer(mainWindow);
});

// IPC HANDLERS FOR MODEL OPERATIONS
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

// ELECTRON EVENT HANDLERS
app.whenReady().then(() => {
  createWindow();
});

app.on("window-all-closed", () => {
  websocketManager.closeWebSocket();
  serverManager.stopPythonServer();
  if (process.platform !== "darwin") app.quit();
});

app.on("before-quit", () => {
  websocketManager.closeWebSocket();
  serverManager.stopPythonServer();
});

app.on("will-quit", () => {
  serverManager.stopPythonServer();
});

module.exports = {
  connectToPythonServer: websocketManager.connectToPythonServer
};

