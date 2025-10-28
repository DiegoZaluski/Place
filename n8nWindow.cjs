// n8nWindow.cjs - ABORDAGEM ALTERNATIVA
const { ipcMain, shell } = require('electron');

class N8NWindow {
  show(mainWindow) {
    console.log('🔴 N8NWindow: Abrindo N8N na janela principal');
    
    // Envia mensagem para o React mostrar o N8N
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('navigate-to-n8n');
      return { success: true, method: 'in-app' };
    } else {
      // Fallback: abre no navegador
      shell.openExternal('http://localhost:5678');
      return { success: true, method: 'external' };
    }
  }

  destroy() {
    console.log('🔴 N8NWindow: Destroy (nada para fazer)');
    return { success: true };
  }

  isActive() {
    return false;
  }
}

module.exports = N8NWindow;