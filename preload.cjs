const { contextBridge, ipcRenderer } = require('electron');

if (typeof window !== 'undefined') {
  
  // MODEL API
  contextBridge.exposeInMainWorld('api', {
    
    // --- Prompt Operations ---
    sendPrompt: (prompt) => {
      if (!prompt || typeof prompt !== 'string') {
        return Promise.reject(new Error('Prompt must be a non-empty string'));
      }
      return ipcRenderer.invoke('model:send-prompt', prompt);
    },
    
    stopPrompt: (promptId) => {
      if (!promptId || typeof promptId !== 'string') {
        return Promise.reject(new Error('Prompt ID must be a non-empty string'));
      }
      return ipcRenderer.invoke('model:stop-prompt', promptId);
    },
    
    clearMemory: () => {
      return ipcRenderer.invoke('model:clear-memory');
    },
    
    // --- Model Event Listeners ---
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
    },
    
    // --- N8N Window --- 
    openN8NWindow: () => ipcRenderer.invoke('n8n-window:open'),
    closeN8NWindow: () => ipcRenderer.invoke('n8n-window:close'),
    getN8NStatus: () => ipcRenderer.invoke('n8n-window:status'),
    
    // DOWNLOAD SERVER (SSE) API:
    downloadServer: {
      /**
       * Retrieves the status of the SSE server
       * @returns {Promise<{success: boolean, status?: object, error?: string}>}
       */
      getStatus: () => {
        return ipcRenderer.invoke('downloadServer:getStatus');
      },
      
      /**
       * Init: the SSE server
       * @returns {Promise<{success: boolean, info?: object, error?: string}>}
       */
      start: () => {
        return ipcRenderer.invoke('downloadServer:start');
      },
      
      /**
       * Obtém informações do servidor
       * @returns {Promise<{success: boolean, info?: {url: string, isRunning: boolean}, error?: string}>}
       */
      getInfo: () => {
        return ipcRenderer.invoke('downloadServer:getInfo');
      },
      
      /**
       * Para o servidor SSE
       * @returns {Promise<{success: boolean, error?: string}>}
       */
      stop: () => {
        return ipcRenderer.invoke('downloadServer:stop');
      }
    },
    // TEST
    sendContentSize: (width, height) => 
      ipcRenderer.invoke('control-content-size', width, height)
  });

  // WINDOW CONTROL (do not remove)
  contextBridge.exposeInMainWorld('electron', {
    invoke: (channel, data) => ipcRenderer.invoke(channel, data)
  });

  console.log('✓ Preload script executed successfully');
}