const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');

let wsClient = null;
let isConnecting = false;
let reconnectTimeout = null;

/**
 * Conecta ao servidor Python WebSocket
 */
function connectToPythonServer(mainWindow) {
  if (isConnecting) return;
  
  if (wsClient) {
    wsClient.removeAllListeners();
    if (wsClient.readyState === WebSocket.OPEN) {
      wsClient.close();
    }
  }

  isConnecting = true;
  console.log("🔗 Connecting to Python WebSocket server...");

  wsClient = new WebSocket("ws://localhost:8765");

  wsClient.on("open", () => {
    console.log("✅ Connected to Python WebSocket server");
    isConnecting = false;
    mainWindow?.webContents.send("model:ready", { status: "connected" });
    
    if (reconnectTimeout) {
      clearTimeout(reconnectTimeout);
      reconnectTimeout = null;
    }
  });

  wsClient.on("message", (message) => {
    try {
      const data = JSON.parse(message.toString());
      console.log("📨 Received WS message:", data.type || "unknown");
      
      const { promptId, token, complete, error, type, status, sessionId } = data;

      if (type === "token" && token) {
        mainWindow?.webContents.send("model:new-token", { promptId, token });
      } else if (type === "complete" && complete) {
        mainWindow?.webContents.send("model:complete", promptId);
      } else if (type === "error" && error) {
        mainWindow?.webContents.send("model:error", { promptId, error });
      } else if (type === "status") {
        if (status === "started") {
          mainWindow?.webContents.send("model:started", { promptId, sessionId });
        } else if (status === "canceled") {
          mainWindow?.webContents.send("model:canceled", promptId);
        } else if (status === "memory_cleared") {
          mainWindow?.webContents.send("model:memory-cleared", sessionId);
        }
      }

    } catch (e) {
      console.error("❌ Failed to parse WS message:", e);
    }
  });

  wsClient.on("close", (code, reason) => {
    console.log(`🔌 WebSocket connection closed: ${code} - ${reason}`);
    isConnecting = false;
    mainWindow?.webContents.send("model:disconnected");
    
    if (!reconnectTimeout) {
      reconnectTimeout = setTimeout(() => {
        console.log("🔄 Attempting to reconnect...");
        connectToPythonServer(mainWindow);
      }, 3000);
    }
  });

  wsClient.on("error", (err) => {
    console.error("❌ WebSocket error:", err.message);
    isConnecting = false;
    mainWindow?.webContents.send("model:error", { 
      promptId: null, 
      error: `Connection error: ${err.message}` 
    });
  });
}

/**
 * Envia prompt para o servidor
 */
function sendPrompt(userMessage) {
  if (!wsClient || wsClient.readyState !== WebSocket.OPEN) {
    console.log("⚠️ WebSocket not connected, attempting connection...");
    return null;
  }

  const promptId = uuidv4();
  try {
    const message = JSON.stringify({ 
      action: "prompt", 
      prompt: userMessage, 
      promptId 
    });
    wsClient.send(message);
    console.log("📤 Sent prompt:", promptId);
    return promptId;
  } catch (err) {
    console.error("❌ Error sending prompt:", err);
    return null;
  }
}

/**
 * Cancela um prompt em andamento
 */
function cancelPrompt(promptId) {
  if (wsClient && wsClient.readyState === WebSocket.OPEN && promptId) {
    try {
      wsClient.send(JSON.stringify({ action: "cancel", promptId }));
      console.log("🛑 Sent cancel for prompt:", promptId);
    } catch (err) {
      console.error("❌ Error canceling prompt:", err);
    }
  }
}

/**
 * Limpa a memória do modelo
 */
function clearMemory() {
  if (wsClient && wsClient.readyState === WebSocket.OPEN) {
    try {
      wsClient.send(JSON.stringify({ action: "clear_memory" }));
      console.log("🧹 Sent clear memory request");
    } catch (err) {
      console.error("❌ Error clearing memory:", err);
    }
  }
}

/**
 * Fecha a conexão WebSocket
 */
function closeWebSocket() {
  if (wsClient) {
    wsClient.close();
    wsClient = null;
  }
  if (reconnectTimeout) {
    clearTimeout(reconnectTimeout);
    reconnectTimeout = null;
  }
}

module.exports = {
  connectToPythonServer,
  sendPrompt,
  cancelPrompt,
  clearMemory,
  closeWebSocket
};