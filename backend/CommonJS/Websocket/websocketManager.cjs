const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');
const { COLORS } = require('../../../utils/ansiColors');
let wsClient = null;
let isConnecting = false;
let reconnectTimeout = null;

// Connects to the Python WebSocket server
function connectToPythonServer(mainWindow) {
  if (isConnecting) return;
  
  if (wsClient) {
    wsClient.removeAllListeners();
    if (wsClient.readyState === WebSocket.OPEN) {
      wsClient.close();
    }
  }

  isConnecting = true;
  console.log("Connecting to Python WebSocket server..."); //test here!

  wsClient = new WebSocket("ws://localhost:8765");

  wsClient.on("open", () => {
    console.log("Connected to Python WebSocket server");
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
      console.log(`${COLORS.BLUE}Received WS message:${COLORS.RESET}`, data.type || "unknown");
      
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
      console.error(`${COLORS.RED}Failed to parse WS message:${COLORS.RESET}`, e);
    }
  });

  wsClient.on("close", (code, reason) => {
    console.log(`${COLORS.RED}WebSocket connection closed: ${code} - ${reason}${COLORS.RESET}`);
    isConnecting = false;
    mainWindow?.webContents.send("model:disconnected");
    
    if (!reconnectTimeout) {
      reconnectTimeout = setTimeout(() => {
        console.log(`${COLORS.YELLOW}Attempting to reconnect...${COLORS.RESET}`);
        connectToPythonServer(mainWindow);
      }, 3000);
    }
  });

  wsClient.on("error", (err) => {
    console.error(`${COLORS.RED}WebSocket error:${COLORS.RESET}`, err.message);
    isConnecting = false;
    mainWindow?.webContents.send("model:error", { 
      promptId: null, 
      error: `Connection error: ${err.message}` 
    });
  });
}

// SENDS PROMPT TO THE SERVER
function sendPrompt(userMessage) {
  if (!wsClient || wsClient.readyState !== WebSocket.OPEN) {
    console.log(`${COLORS.YELLOW}WebSocket not connected, attempting connection...${COLORS.RESET}`);
    return null;
  }

  const promptId = uuidv4();
  try {
    let message = JSON.parse(userMessage);
    message.promptId = promptId;
    wsClient.send(JSON.stringify(message));
    console.log(`${COLORS.BLUE}SEND PROMPT:${COLORS.RESET}`, promptId);
    return promptId;
  } catch (err) {
    console.error(`${COLORS.RED}Error sending prompt:${COLORS.RESET}`, err);
    return null;
  }
}

// CANCELA UM PROMPT EM ANDAMENTO
function cancelPrompt(promptId) {
  if (wsClient && wsClient.readyState === WebSocket.OPEN && promptId) {
    try {
      wsClient.send(JSON.stringify({ action: "cancel", promptId }));
      console.log(`${COLORS.MAGENTA}Sent cancel for prompt: ${promptId}${COLORS.RESET}`);
    } catch (err) {
      console.error(`${COLORS.RED}Error canceling prompt:${COLORS.RESET}`, err);
    }
  }
}

// CLEARS THE MODEL'S MEMORY
function clearMemory() {
  if (wsClient && wsClient.readyState === WebSocket.OPEN) {
    try {
      wsClient.send(JSON.stringify({ action: "clear_memory" }));
      console.log(`${COLORS.BLUE}Sent clear memory request${COLORS.RESET}`);
    } catch (err) {
      console.error(`${COLORS.RED}Error clearing memory:${COLORS.RESET}`, err);
    }
  }
}

// CLOSES THE WEBSOCKET CONNECTION
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