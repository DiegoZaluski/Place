const { COLORS } = require('../utils/ansiColors.cjs');

function ctrlCallModel(websocketManager, serverManager, mainWindow, ipcMain){
    // IPC HANDLERS - SERVER OPERATIONS
  ipcMain.handle('server:restart', async () => {
    return await serverManager.restartPythonServer(mainWindow);
  });

  // IPC HANDLERS - MODEL OPERATIONS
  ipcMain.handle('model:send-prompt', async (_, prompt) => {
    try {
      if (!prompt?.trim()) {
        return { success: false, error: 'PROMPT CANNOT BE EMPTY' };
      }

      const promptId = websocketManager.sendPrompt(prompt.trim());
      if (promptId) {
        return { success: true, promptId };
      } else {
        return { success: false, error: 'FAILED TO SEND PROMPT - NOT CONNECTED' };
      }
    } catch (err) {
      console.error(COLORS.RED + 'IPC SEND-PROMPT ERROR:' + COLORS.RESET, err);
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('model:stop-prompt', async (_, promptId) => {
    try {
      if (!promptId) {
        return { success: false, error: 'PROMPT ID REQUIRED' };
      }
      websocketManager.cancelPrompt(promptId);
      return { success: true };
    } catch (err) {
      console.error(COLORS.RED + 'IPC STOP-PROMPT ERROR:' + COLORS.RESET, err);
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('model:clear-memory', async () => {
    try {
      websocketManager.clearMemory();
      return { success: true };
    } catch (err) {
      console.error(COLORS.RED + 'IPC CLEAR-MEMORY ERROR:' + COLORS.RESET, err);
      return { success: false, error: err.message };
    }
  });
}


module.exports = ctrlCallModel; 