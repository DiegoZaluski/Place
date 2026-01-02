const path = require('path');
const { app, BrowserWindow, ipcMain } = require('electron');
const { COLORS } = require('./utils/ansiColors.cjs');
const { initLog } = require('./initLog.cjs');
const serverManager = require('./backend/rulers/ruler-ws/process-ws.cjs');
const websocketManager = require('./backend/rulers/ruler-ws/manager-ws.cjs');
const ModelLookout = require('./backend/rulers/ruler-ws/vigilant.cjs');
const HTTPRun = require('./backend/rulers/ruler-http/run-http.cjs');
const { startSSEServer, stopSSEServer, ipcDownloadModel } = require('./ipc/ipc-download-model.cjs');
const ctrlCallModel = require('./ipc/ipc-call-model.cjs');
const { createControlWindow, closeControlWindow, getControlWindow, } = require('./backend/second-window/control-window.cjs');
  
let modelLookout = null;//INSTANCES
let httpServerInstance = null;  

initLog(COLORS);

const startHTTPServer = async () => {
  try {
    console.log(COLORS.CYAN + 'Starting HTTP Server...' + COLORS.RESET);
    httpServerInstance = new HTTPRun();
    await httpServerInstance.startHTTP();
    console.log(COLORS.GREEN + 'HTTP Server started on port 8001' + COLORS.RESET);
    return true;
  } catch (error) {
    console.error(COLORS.RED + 'Failed to start HTTP Server:' + COLORS.RESET, error);
    return false;
  }
};

const stopHTTPServer = () => {
  if (httpServerInstance) {
    console.log(COLORS.CYAN + 'Stopping HTTP Server...' + COLORS.RESET);
    httpServerInstance.stopHTTP();
    httpServerInstance = null;
    console.log(COLORS.GREEN + 'HTTP Server stopped' + COLORS.RESET);
  }
};

/* -------------------------------- // 
      ELECTRON WINDOW MANAGEMENT
/ -------------------------------- */ 
let mainWindow;

const createWindow = async () => {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    frame: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.cjs'),
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
      await mainWindow.loadURL('http://localhost:3000/');
      mainWindow.webContents.openDevTools();
    } else {
      await mainWindow.loadFile(path.join(__dirname, 'dist', 'index.html'));
    }
    console.log(COLORS.GREEN + 'WINDOW LOADED SUCCESSFULLY' + COLORS.RESET);

    // START ALL SERVICES
    setTimeout(async () => {
      const serverStarted = await serverManager.startPythonServer(mainWindow); // MAIN SERVICES
      if (serverStarted) {
        websocketManager.connectToPythonServer(mainWindow);

        modelLookout = new ModelLookout();
        modelLookout.start();
        console.log(COLORS.GREEN + 'MODEL LOOKOUT STARTED' + COLORS.RESET);

        await startHTTPServer(); // HTTP SERVER
      }
    }, 1000);
  } catch (err) {
    console.error(COLORS.RED + 'ERROR LOADING WINDOW:' + COLORS.RESET, err);
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
    websocketManager.closeWebSocket();
    if (modelLookout) {
      modelLookout.stop();// STOP 
    }
    stopHTTPServer();
  });
};


// IPC HANDLERS - WINDOW CONTROLS
ipcMain.handle('window:minimize', () => {
  if (mainWindow) mainWindow.minimize();
});

ipcMain.handle('window:maximize', () => {
  if (mainWindow) {
    mainWindow.isMaximized() ? mainWindow.unmaximize() : mainWindow.maximize();
  }
});

ipcMain.handle('window:close', () => {
  if (mainWindow) mainWindow.close();
});

/* -------------------------------- // 
          SECOND WINDOW
/ -------------------------------- */ 
ipcMain.handle('control-content-size', (_event, width, height) => {
  const cWindow = getControlWindow(websocketManager);
  if (cWindow) {
    cWindow.setSize(Math.ceil(width), Math.ceil(height));
  }
  return { success: true };
});

// -------------------------------- // 

ctrlCallModel(websocketManager, serverManager, mainWindow, ipcMain);
ipcDownloadModel( ipcMain );

// -------------------------------- // 

app.whenReady().then(async () => {
  await createWindow();

  // CREATE CONTROL WINDOW
  createControlWindow(mainWindow);

  // START SSE SERVER AFTER WINDOW
  setTimeout(async () => {
    try {
      await startSSEServer();
    } catch (error) {
      console.error(COLORS.RED + 'SSE Server failed on startup:' + COLORS.RESET, error);
    }
  }, 2000);
});

app.on('window-all-closed', async () => {
  closeControlWindow();
  websocketManager.closeWebSocket();
  serverManager.stopPythonServer();
  await stopSSEServer();

  // STOP ALL SERVICES
  if (modelLookout) {
    modelLookout.stop();
  }
  stopHTTPServer();

  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', async () => {
  console.log(COLORS.CYAN + 'Limpando recursos...' + COLORS.RESET);
  websocketManager.closeWebSocket();
  serverManager.stopPythonServer();
  await stopSSEServer();

  // STOP ALL SERVICES
  if (modelLookout) {
    modelLookout.stop();
  }
  stopHTTPServer();
});

app.on('will-quit', async () => {
  serverManager.stopPythonServer();
  await stopSSEServer();

  // STOP ALL SERVICES
  if (modelLookout) {
    modelLookout.stop();
  }
  stopHTTPServer();
});
module.exports = {
  connectToPythonServer: websocketManager.connectToPythonServer,
};
