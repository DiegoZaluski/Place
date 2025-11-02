const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const { COLORS } = require("./utils/ansiColors");

// IMPORT SEPARATED MODULES
const serverManager = require("./backend/CommonJS/managerWebSocket.cjs");
const websocketManager = require("./backend/CommonJS/Websocket/websocket-manager.cjs");

// ============================================
// SSE DOWNLOAD SERVER
// ============================================
const { downloadManager } = require("./backend/CommonJS/SSE/initSSEDownload.cjs");
let sseServer = null;

/**
 * Inicia o servidor SSE para downloads de modelos
 */
const startSSEServer = async () => {
  try {
    // ⭐ VERIFICA SE JÁ ESTÁ INICIALIZADO
    if (downloadManager.isInitialized()) {
      const manager = downloadManager.getManager();
      if (manager.isRunning) {
        console.log(COLORS.YELLOW + '⚠️  SSE Server já está rodando' + COLORS.RESET);
        return manager;
      }
    }

    console.log(COLORS.CYAN + '🚀 Iniciando SSE Download Server...' + COLORS.RESET);
    
    const scriptPath = path.join(__dirname, "backend", "python", "SSE", "Download_SSE.py");
    const pythonPath = path.join(__dirname, "backend", "venv", "bin", "python");
    
    // VERIFICAR SE ARQUIVOS EXISTEM
    const fs = require('fs');
    if (!fs.existsSync(scriptPath)) {
      throw new Error(`Script Python não encontrado: ${scriptPath}`);
    }
    
    console.log(COLORS.CYAN + `📄 Script: ${scriptPath}` + COLORS.RESET);
    console.log(COLORS.CYAN + `🐍 Python: ${pythonPath}` + COLORS.RESET);
    
    // ⭐ USA O SINGLETON - INICIALIZA UMA ÚNICA VEZ
    sseServer = downloadManager.initialize({
      scriptPath: scriptPath,
      pythonPath: fs.existsSync(pythonPath) ? pythonPath : 'python3',
      port: 8000,
      logLevel: 'info',
      autoRestart: true,
      maxRestarts: 3,
      restartDelay: 5000
    });
    
    await sseServer.start();
    console.log(COLORS.GREEN + '✅ SSE Download Server iniciado com sucesso' + COLORS.RESET);
    return sseServer;
  } catch (error) {
    console.error(COLORS.RED + '❌ Falha ao iniciar SSE Download Server:' + COLORS.RESET, error);
    throw error;
  }
};

/**
 * Para o servidor SSE
 */
const stopSSEServer = async () => {
  try {
    // ⭐ USA O SINGLETON PARA VERIFICAR
    if (!downloadManager.isInitialized()) {
      console.log(COLORS.YELLOW + '⚠️  SSE Server não está inicializado' + COLORS.RESET);
      return;
    }

    const manager = downloadManager.getManager();
    if (!manager.isRunning) {
      console.log(COLORS.YELLOW + '⚠️  SSE Server não está rodando' + COLORS.RESET);
      return;
    }

    console.log(COLORS.CYAN + '🛑 Parando SSE Download Server...' + COLORS.RESET);
    await manager.stop();
    console.log(COLORS.GREEN + '✅ SSE Download Server parado' + COLORS.RESET);
  } catch (error) {
    console.error(COLORS.RED + '❌ Erro ao parar SSE Download Server:' + COLORS.RESET, error);
  }
};

// ============================================
// ELECTRON WINDOW
// ============================================
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
    console.log(COLORS.GREEN + "✅ WINDOW LOADED SUCCESSFULLY" + COLORS.RESET);
    
    // INICIAR PYTHON SERVER (WebSocket para modelo LLM)
    setTimeout(async () => {
      const serverStarted = await serverManager.startPythonServer(mainWindow);
      if (serverStarted) {
        websocketManager.connectToPythonServer(mainWindow);
      }
    }, 1000);
    
  } catch (err) {
    console.error(COLORS.RED + "❌ ERROR LOADING WINDOW:" + COLORS.RESET, err);
  }

  mainWindow.on("closed", () => {
    mainWindow = null;
    websocketManager.closeWebSocket();
  });
}

// ============================================
// IPC HANDLERS - WINDOW CONTROLS
// ============================================
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

// ============================================
// IPC HANDLERS - SERVER OPERATIONS
// ============================================
ipcMain.handle("server:restart", async () => {
  return await serverManager.restartPythonServer(mainWindow);
});

// ============================================
// IPC HANDLERS - MODEL OPERATIONS
// ============================================
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
    console.error(COLORS.RED + "❌ IPC SEND-PROMPT ERROR:" + COLORS.RESET, err);
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
    console.error(COLORS.RED + "❌ IPC STOP-PROMPT ERROR:" + COLORS.RESET, err);
    return { success: false, error: err.message };
  }
});

ipcMain.handle("model:clear-memory", async () => {
  try {
    websocketManager.clearMemory();
    return { success: true };
  } catch (err) {
    console.error(COLORS.RED + "❌ IPC CLEAR-MEMORY ERROR:" + COLORS.RESET, err);
    return { success: false, error: err.message };
  }
});

// ============================================
// IPC HANDLERS - SSE DOWNLOAD SERVER
// ============================================

/**
 * Obtém status detalhado do servidor SSE
 */
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
    console.error(COLORS.RED + "❌ IPC GET-STATUS ERROR:" + COLORS.RESET, error);
    return { success: false, error: error.message };
  }
});

/**
 * Inicia o servidor SSE
 */
ipcMain.handle("downloadServer:start", async () => {
  try {
    if (sseServer && sseServer.isRunning) {
      console.log(COLORS.YELLOW + '⚠️  Server já está rodando' + COLORS.RESET);
      return { success: true, info: sseServer.getServerInfo() };
    }
    
    await startSSEServer();
    return { success: true, info: sseServer.getServerInfo() };
  } catch (error) {
    console.error(COLORS.RED + "❌ IPC START-SERVER ERROR:" + COLORS.RESET, error);
    return { success: false, error: error.message };
  }
});

/**
 * Obtém informações do servidor (URL, porta, etc)
 */
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
    console.error(COLORS.RED + "❌ IPC GET-INFO ERROR:" + COLORS.RESET, error);
    return { success: false, error: error.message };
  }
});

/**
 * Para o servidor SSE
 */
ipcMain.handle("downloadServer:stop", async () => {
  try {
    await stopSSEServer();
    return { success: true };
  } catch (error) {
    console.error(COLORS.RED + "❌ IPC STOP-SERVER ERROR:" + COLORS.RESET, error);
    return { success: false, error: error.message };
  }
});

// ============================================
// ELECTRON EVENT HANDLERS
// ============================================

/**
 * Inicialização do app
 */
app.whenReady().then(async () => {
  await createWindow();
  
  // INICIAR SSE SERVER APÓS JANELA (não bloqueia)
  setTimeout(async () => {
    try {
      await startSSEServer();
    } catch (error) {
      console.error(COLORS.RED + '❌ SSE Server failed on startup:' + COLORS.RESET, error);
      // App continua funcionando mesmo se SSE falhar
    }
  }, 2000); // 2s para garantir estabilidade
});

/**
 * Fechar todas as janelas
 */
app.on("window-all-closed", async () => {
  websocketManager.closeWebSocket();
  serverManager.stopPythonServer();
  await stopSSEServer();
  
  if (process.platform !== "darwin") {
    app.quit();
  }
});

/**
 * Antes de quit
 */
app.on("before-quit", async () => {
  console.log(COLORS.CYAN + '🧹 Limpando recursos...' + COLORS.RESET);
  websocketManager.closeWebSocket();
  serverManager.stopPythonServer();
  await stopSSEServer();
});

/**
 * Will quit
 */
app.on("will-quit", async () => {
  serverManager.stopPythonServer();
  await stopSSEServer();
});

// ============================================
// EXPORTS
// ============================================
module.exports = {
  connectToPythonServer: websocketManager.connectToPythonServer
};