const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");

// Import dos módulos separados
const serverManager = require("./server-manager.cjs");
const websocketManager = require("./websocket-manager.cjs");

let mainWindow;

/**
 * Cria a janela principal do Electron
 */
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
    console.log("✅ Window loaded successfully");
    
    // Inicia o servidor Python e depois conecta
    setTimeout(async () => {
      const serverStarted = await serverManager.startPythonServer(mainWindow);
      if (serverStarted) {
        websocketManager.connectToPythonServer(mainWindow);
      }
    }, 1000);
    
  } catch (err) {
    console.error("❌ Error loading window:", err);
  }

  mainWindow.on("closed", () => {
    mainWindow = null;
    websocketManager.closeWebSocket();
  });
}

// IPC handlers para controles da janela
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

// IPC handlers do servidor
ipcMain.handle("server:restart", async () => {
  return await serverManager.restartPythonServer(mainWindow);
});

// IPC handlers do modelo
ipcMain.handle("model:send-prompt", async (_, prompt) => {
  try {
    if (!prompt?.trim()) {
      return { success: false, error: "Prompt cannot be empty" };
    }
    
    const promptId = websocketManager.sendPrompt(prompt.trim());
    if (promptId) {
      return { success: true, promptId };
    } else {
      return { success: false, error: "Failed to send prompt - not connected" };
    }
  } catch (err) {
    console.error("❌ IPC send-prompt error:", err);
    return { success: false, error: err.message };
  }
});

ipcMain.handle("model:stop-prompt", async (_, promptId) => {
  try {
    if (!promptId) {
      return { success: false, error: "Prompt ID required" };
    }
    websocketManager.cancelPrompt(promptId);
    return { success: true };
  } catch (err) {
    console.error("❌ IPC stop-prompt error:", err);
    return { success: false, error: err.message };
  }
});

ipcMain.handle("model:clear-memory", async () => {
  try {
    websocketManager.clearMemory();
    return { success: true };
  } catch (err) {
    console.error("❌ IPC clear-memory error:", err);
    return { success: false, error: err.message };
  }
});

// Event handlers do Electron
app.whenReady().then(createWindow);

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

// Export para uso em outros módulos
module.exports = {
  connectToPythonServer: websocketManager.connectToPythonServer
};