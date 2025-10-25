const { contextBridge, ipcRenderer } = require('electron');

if (typeof window !== 'undefined') {
  // API existente para o modelo
  contextBridge.exposeInMainWorld('api', {
    // Send prompt to model
    sendPrompt: (prompt) => {
      if (!prompt || typeof prompt !== 'string') {
        return Promise.reject(new Error('Prompt must be a non-empty string'));
      }
      return ipcRenderer.invoke('model:send-prompt', prompt);
    },
    // Stop specific prompt
    stopPrompt: (promptId) => {
      if (!promptId || typeof promptId !== 'string') {
        return Promise.reject(new Error('Prompt ID must be a non-empty string'));
      }
      return ipcRenderer.invoke('model:stop-prompt', promptId);
    },
    // Clear conversation memory
    clearMemory: () => {
      return ipcRenderer.invoke('model:clear-memory');
    },
    // Event listeners
    onNewToken: (callback) => {
      const listener = (event, data) => {
        if (data && typeof data.promptId === 'string' && typeof data.token === 'string') {
          callback(data.promptId, data.token);
        }
      };
      ipcRenderer.on('model:new-token', listener);
      return () => ipcRenderer.removeListener('model:new-token', listener);
    },
    onComplete: (callback) => {
      const listener = (event, promptId) => {
        if (typeof promptId === 'string') {
          callback(promptId);
        }
      };
      ipcRenderer.on('model:complete', listener);
      return () => ipcRenderer.removeListener('model:complete', listener);
    },
    onError: (callback) => {
      const listener = (event, data) => {
        if (data && typeof data.promptId !== 'undefined') {
          callback(data.promptId, data.error);
        }
      };
      ipcRenderer.on('model:error', listener);
      return () => ipcRenderer.removeListener('model:error', listener);
    },
    onReady: (callback) => {
      const listener = (event, data) => {
        callback(data);
      };
      ipcRenderer.on('model:ready', listener);
      return () => ipcRenderer.removeListener('model:ready', listener);
    },
    onDisconnected: (callback) => {
      const listener = () => {
        callback();
      };
      ipcRenderer.on('model:disconnected', listener);
      return () => ipcRenderer.removeListener('model:disconnected', listener);
    },
    onStarted: (callback) => {
      const listener = (event, data) => {
        if (data && typeof data.promptId === 'string') {
          callback(data.promptId, data.sessionId);
        }
      };
      ipcRenderer.on('model:started', listener);
      return () => ipcRenderer.removeListener('model:started', listener);
    },
    onMemoryCleared: (callback) => {
      const listener = (event, sessionId) => {
        if (typeof sessionId === 'string') {
          callback(sessionId);
        }
      };
      ipcRenderer.on('model:memory-cleared', listener);
      return () => ipcRenderer.removeListener('model:memory-cleared', listener);
    }
  });

  // ADICIONE ESTA PARTE - API para controles da janela
  contextBridge.exposeInMainWorld('electron', {
    invoke: (channel, data) => ipcRenderer.invoke(channel, data)
  });

  console.log('✅ Preload script executed successfully');
}