const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');
const { COLORS } = require('../../../utils/ansiColors.cjs');
const { BrowserWindow } = require('electron');

// STATE VARIABLES
let wsClient = null;
let isConnecting = false;
let reconnectTimeout = null;

// BROADCAST MESSAGE TO ALL WINDOWS
function broadcast(channel, data) {
  BrowserWindow.getAllWindows().forEach((win) => {
    win.webContents.send(channel, data);
  });
}

// WEBSOCKET CONNECTION MANAGEMENT
function connectToPythonServer() {
  if (isConnecting) return;

  // CLEANUP EXISTING CONNECTION
  if (wsClient) {
    wsClient.removeAllListeners();
    if (wsClient.readyState === WebSocket.OPEN) {
      wsClient.close();
    }
  }

  isConnecting = true;
  console.log('Connecting to Python WebSocket server...');

  wsClient = new WebSocket('ws://localhost:8765');

  // HANDLE CONNECTION OPENED
  wsClient.on('open', () => {
    console.log('Connected to Python WebSocket server');
    isConnecting = false;
    broadcast('model:ready', { status: 'connected' });

    if (reconnectTimeout) {
      clearTimeout(reconnectTimeout);
      reconnectTimeout = null;
    }
  });

  // HANDLE INCOMING MESSAGES
  wsClient.on('message', (message) => {
    try {
      const data = JSON.parse(message.toString());
      console.log(`${COLORS.BLUE}Received WS message:${COLORS.RESET}`, data.type || 'unknown');

      const { promptId, token, complete, error, type, status, sessionId } = data;

      // PROCESS TOKEN MESSAGE
      if (type === 'token' && token) {
        broadcast('model:new-token', { promptId, token });
        // PROCESS COMPLETION MESSAGE
      } else if (type === 'complete' && complete) {
        broadcast('model:complete', promptId);
        // PROCESS ERROR MESSAGE
      } else if (type === 'error' && error) {
        broadcast('model:error', { promptId, error });
        // PROCESS STATUS MESSAGE
      } else if (type === 'status') {
        if (status === 'started') {
          broadcast('model:started', { promptId, sessionId });
        } else if (status === 'canceled') {
          broadcast('model:canceled', promptId);
        } else if (status === 'memory_cleared') {
          broadcast('model:memory-cleared', sessionId);
        }
      }

      // ERROR HANDLING FOR MESSAGE PARSING
    } catch (e) {
      console.error(`${COLORS.RED}Failed to parse WS message:${COLORS.RESET}`, e);
    }
  });

  // HANDLE CONNECTION CLOSED
  wsClient.on('close', (code, reason) => {
    console.log(`${COLORS.RED}WebSocket connection closed: ${code} - ${reason}${COLORS.RESET}`);
    isConnecting = false;
    broadcast('model:disconnected');

    // SCHEDULE RECONNECTION ATTEMPT
    if (!reconnectTimeout) {
      reconnectTimeout = setTimeout(() => {
        console.log(`${COLORS.YELLOW}Attempting to reconnect...${COLORS.RESET}`);
        connectToPythonServer();
      }, 3000);
    }
  });

  // HANDLE CONNECTION ERROR
  wsClient.on('error', (err) => {
    console.error(`${COLORS.RED}WebSocket error:${COLORS.RESET}`, err.message);
    isConnecting = false;
    broadcast('model:error', {
      promptId: null,
      error: `Connection error: ${err.message}`,
    });
  });
}

// SEND PROMPT TO PYTHON SERVER
function sendPrompt(userMessage) {
  if (!wsClient || wsClient.readyState !== WebSocket.OPEN) {
    console.log(`${COLORS.YELLOW}WebSocket not connected, attempting connection...${COLORS.RESET}`);
    return null;
  }

  const promptId = uuidv4();
  // PARSE AND SEND MESSAGE
  try {
    const message = JSON.parse(userMessage);
    message.promptId = promptId;
    wsClient.send(JSON.stringify(message));
    console.log(`${COLORS.BLUE}SEND PROMPT:${COLORS.RESET}`, promptId);
    return promptId;
    // ERROR HANDLING FOR SEND OPERATION
  } catch (err) {
    console.error(`${COLORS.RED}Error sending prompt:${COLORS.RESET}`, err);
    return null;
  }
}

// CANCEL PROMPT EXECUTION
function cancelPrompt(promptId) {
  if (wsClient && wsClient.readyState === WebSocket.OPEN && promptId) {
    try {
      wsClient.send(JSON.stringify({ action: 'cancel', promptId }));
      console.log(`${COLORS.MAGENTA}Sent cancel for prompt: ${promptId}${COLORS.RESET}`);
      // ERROR HANDLING FOR CANCEL OPERATION
    } catch (err) {
      console.error(`${COLORS.RED}Error canceling prompt:${COLORS.RESET}`, err);
    }
  }
}

// CLEAR MODEL MEMORY
function clearMemory() {
  if (wsClient && wsClient.readyState === WebSocket.OPEN) {
    try {
      wsClient.send(JSON.stringify({ action: 'clear_memory' }));
      console.log(`${COLORS.BLUE}Sent clear memory request${COLORS.RESET}`);
      // ERROR HANDLING FOR CLEAR MEMORY OPERATION
    } catch (err) {
      console.error(`${COLORS.RED}Error clearing memory:${COLORS.RESET}`, err);
    }
  }
}

// CLOSE WEBSOCKET CONNECTION
function closeWebSocket() {
  if (wsClient) {
    wsClient.close();
    wsClient = null;
  }
  // CLEANUP RECONNECTION TIMEOUT
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
  closeWebSocket,
};
