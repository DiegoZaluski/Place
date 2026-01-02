const path = require('path');
const { COLORS } = require('../utils/ansiColors.cjs');
const { downloadManager } = require('../backend/rulers/ruler-sse/run-download.cjs'); // SSE DOWNLOAD SERVER
let sseServer = null;
// SSE SERVER MANAGEMENT
const startSSEServer = async () => {
  try {
    if (downloadManager.isInitialized()) {
      const manager = downloadManager.getManager();
      if (manager.isRunning) {
        console.log(COLORS.YELLOW + 'SSE Server is already running' + COLORS.RESET);
        return manager;
      }
    }

    console.log(COLORS.CYAN + 'Starting SSE Download Server...' + COLORS.RESET);
    const rootDir = path.join(__dirname, '..');
    const scriptPath = path.join(rootDir, 'backend', 'fullpy', 'scry_pkg', 'scry_sse', 'download_model.py');
    const pythonPath = path.join(rootDir, 'backend', 'fullpy', 'venv', 'bin', 'python');

    const fs = require('fs');
    if (!fs.existsSync(scriptPath)) {
      throw new Error(`Python script not found: ${scriptPath}`);
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
      restartDelay: 5000,
    });

    await sseServer.start();
    console.log(COLORS.GREEN + 'SSE Download Server started successfully' + COLORS.RESET);
    return sseServer;
  } catch (error) {
    console.error(COLORS.RED + 'Failed to start SSE Download Server:' + COLORS.RESET, error);
    throw error;
  }
};

const stopSSEServer = async () => {
  try {
    if (!downloadManager.isInitialized()) {
      console.log(COLORS.YELLOW + 'SSE Server is not initialized' + COLORS.RESET);
      return;
    }

    const manager = downloadManager.getManager();
    if (!manager.isRunning) {
      console.log(COLORS.YELLOW + 'SSE Server is not running' + COLORS.RESET);
      return;
    }

    console.log(COLORS.CYAN + 'Stopping SSE Download Server...' + COLORS.RESET);
    await manager.stop();
    console.log(COLORS.GREEN + 'SSE Download Server stopped' + COLORS.RESET);
  } catch (error) {
    console.error(COLORS.RED + 'Error stopping SSE Download Server:' + COLORS.RESET, error);
  }
};

// IPC HANDLERS - SSE DOWNLOAD SERVER
 function ipcDownloadModel ( ipcMain ) {

  ipcMain.handle('downloadServer:getStatus', async () => {
    try {
      if (!sseServer) {
        return {
          success: false,
          error: 'Server not initialized',
          status: { isRunning: false, healthy: false },
        };
      }

      const status = await sseServer.getStatus();
      return { success: true, status };
    } catch (error) {
      console.error(COLORS.RED + 'IPC GET-STATUS ERROR:' + COLORS.RESET, error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('downloadServer:start', async () => {
    try {
      if (sseServer && sseServer.isRunning) {
        console.log(COLORS.YELLOW + 'The server is already running' + COLORS.RESET);
        return { success: true, info: sseServer.getServerInfo() };
      }

      await startSSEServer();
      return { success: true, info: sseServer.getServerInfo() };
    } catch (error) {
      console.error(COLORS.RED + 'IPC START-SERVER ERROR:' + COLORS.RESET, error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('downloadServer:getInfo', async () => {
    try {
      if (!sseServer) {
        return {
          success: false,
          error: 'Server not initialized',
          info: { url: null, isRunning: false },
        };
      }

      return { success: true, info: sseServer.getServerInfo() };
    } catch (error) {
      console.error(COLORS.RED + 'IPC GET-INFO ERROR:' + COLORS.RESET, error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('downloadServer:stop', async () => {
    try {
      await stopSSEServer();
      return { success: true };
    } catch (error) {
      console.error(COLORS.RED + 'IPC STOP-SERVER ERROR:' + COLORS.RESET, error);
      return { success: false, error: error.message };
    }
  });
}


module.exports = { 
    startSSEServer,
    stopSSEServer,
    ipcDownloadModel

};