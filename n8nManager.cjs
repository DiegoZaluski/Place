// n8nManager.cjs - CORRIGIDO
const { ipcMain, shell } = require('electron');

class N8NManager {
  constructor() {
    this.hasOpened = false; // ← Controla abertura única
    this.isRegistered = false;
  }

  registerIPCHandlers() {
    if (this.isRegistered) return;

    ipcMain.handle('n8n-window:open', () => {
      if (this.hasOpened) {
        console.log('🔴 N8N já foi aberto, ignorando duplicata...');
        return { success: true, alreadyOpen: true };
      }
      
      console.log('🔴 Abrindo N8N no navegador...');
      shell.openExternal('http://localhost:5678');
      this.hasOpened = true;
      
      return { success: true, method: 'external' };
    });

    ipcMain.handle('n8n-window:close', () => {
      console.log('🔴 N8N: close chamado (nada para fechar no navegador)');
      return { success: true };
    });

    ipcMain.handle('n8n-window:status', () => {
      return { 
        isActive: false, // Sempre false para navegador externo
        isInitialized: this.hasOpened
      };
    });

    this.isRegistered = true;
    console.log('N8N Manager: Handlers IPC registrados');
  }

  initialize() {
    this.registerIPCHandlers();
    console.log('N8N Manager: Inicializado');
  }

  shutdown() {
    console.log('N8N Manager: Finalizado');
    // Nada para destruir quando usa navegador externo
  }
}

module.exports = N8NManager;