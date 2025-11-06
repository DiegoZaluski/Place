const { spawn, exec } = require('child_process');
const net = require('net');
const path = require('path');
const fs = require('fs');

let pythonServerProcess = null;
let serverRestartCount = 0;
const MAX_SERVER_RESTARTS = 3;

// VARIÁVEL PARA CALLBACK DE RECONEXÃO
let reconnectCallback = null;

/**
 * Configura o callback para reconexão do WebSocket
 */
function setReconnectCallback(callback) {
  reconnectCallback = callback;
  console.log('WebSocket reconnect callback configured:', !!callback);
}

/**
 * Verifica se o servidor Python já está rodando na porta 8765
 */
async function isPythonServerRunning() {
  return new Promise((resolve) => {
    const client = new net.Socket();
    
    client.setTimeout(1000);
    
    client.on('connect', () => {
      client.destroy();
      resolve(true);
    });
    
    client.on('timeout', () => {
      client.destroy();
      resolve(false);
    });
    
    client.on('error', () => {
      resolve(false);
    });
    
    client.connect(8765, '127.0.0.1');
  });
}

/**
 * Mata qualquer processo Python relacionado ao nosso servidor
 */
async function killExistingPythonServers() {
  return new Promise((resolve) => {
    console.log('Killing existing Python servers...');
    
    const platform = process.platform;
    let command = '';
    
    if (platform === 'win32') {
      command = `tasklist | findstr python`;
    } else {
      command = `ps aux | grep -i "llama_server\\|python.*llama" | grep -v grep`;
    }
    
    exec(command, (error, stdout) => {
      if (error || !stdout) {
        console.log('No existing Python servers found');
        resolve();
        return;
      }
      
      console.log('Found existing Python processes:', stdout);
      
      if (platform === 'win32') {
        // Windows - matar processos Python
        const pids = stdout.split('\n')
          .filter(line => line.includes('python'))
          .map(line => line.split(/\s+/)[1])
          .filter(pid => pid);
        
        pids.forEach(pid => {
          try {
            console.log('Killing Python process PID:', pid);
            process.kill(parseInt(pid), 'SIGTERM');
          } catch (e) {
            console.log('Process already terminated:', pid);
          }
        });
      } else {
        // Linux/Mac - matar processos específicos
        const pids = stdout.split('\n')
          .filter(line => line.trim())
          .map(line => line.split(/\s+/)[1])
          .filter(pid => pid);
        
        pids.forEach(pid => {
          try {
            console.log('Killing Python server process PID:', pid);
            process.kill(parseInt(pid), 'SIGTERM');
          } catch (e) {
            console.log('Process already terminated:', pid);
          }
        });
      }
      
      setTimeout(resolve, 1000);
    });
  });
}

/**
 * Aguarda o servidor Python iniciar
 */
async function waitForServerStart(timeout = 15000) {
  const startTime = Date.now();
  console.log('Waiting for Python server to start...');
  
  while (Date.now() - startTime < timeout) {
    const isRunning = await isPythonServerRunning();
    if (isRunning) {
      console.log('Python server is now running');
      return true;
    }
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log('Python server failed to start within timeout');
  return false;
}

/**
 * Manipula crash do servidor com restart automático
 */
function handleServerCrash(mainWindow) {
  serverRestartCount++;
  
  if (serverRestartCount <= MAX_SERVER_RESTARTS) {
    console.log(`Restarting Python server (attempt ${serverRestartCount}/${MAX_SERVER_RESTARTS})...`);
    
    setTimeout(async () => {
      const success = await startPythonServer(mainWindow);
      if (success && reconnectCallback) {
        console.log('Triggering WebSocket reconnection...');
        reconnectCallback();
      } else if (success) {
        console.log('Server restarted but no reconnect callback configured');
      }
    }, 3000);
  } else {
    console.error(`Python server failed to start after ${MAX_SERVER_RESTARTS} attempts`);
    
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('server:critical-error', {
        message: `Python server failed to start after ${MAX_SERVER_RESTARTS} attempts. Please check the server logs.`
      });
    }
  }
}

/**
 * Encontra o caminho do Python dentro do venv
 */
function getPythonPath(workingDir) {
  const possiblePaths = [
    path.join(workingDir, 'venv', 'bin', 'python'),
    path.join(workingDir, 'venv', 'bin', 'python3'),
    path.join(workingDir, 'venv', 'Scripts', 'python.exe'),
    path.join(workingDir, 'venv', 'Scripts', 'python3.exe')
  ];
  
  for (const pythonPath of possiblePaths) {
    if (fs.existsSync(pythonPath)) {
      console.log('Python found:', pythonPath);
      return pythonPath;
    }
  }
  
  throw new Error('Python not found in virtual environment');
}

/**
 * Inicia o servidor Python de forma segura
 */
async function startPythonServer(mainWindow) {
  try {
    console.log("Starting Python server...");
    
    // Verifica se já está rodando
    const isRunning = await isPythonServerRunning();
    if (isRunning) {
      console.log("Python server is already running - killing existing process");
      await killExistingPythonServers();
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    // Mata servidores existentes
    await killExistingPythonServers();
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Caminho correto para a pasta backend
    const workingDir = path.join(__dirname, '..');
    console.log('Working directory:', workingDir);
    
    const pythonPath = getPythonPath(workingDir);
    const serverPath = path.join(workingDir, 'python', 'Websocket', 'llama_server.py');
    console.log('Server path:', serverPath);
    
    if (!fs.existsSync(serverPath)) {
      throw new Error(`Server not found: ${serverPath}`);
    }
    
    // Environment limpo
    const cleanEnv = {
      ...process.env,
      DISPLAY: ':0',
      ELECTRON_RUN_AS_NODE: '1',
      PATH: process.env.PATH
    };
    
    console.log('Using Python:', pythonPath);
    console.log('Starting server:', serverPath);
    
    // Inicia o processo
    pythonServerProcess = spawn(pythonPath, [serverPath], {
      cwd: workingDir,
      stdio: ['pipe', 'pipe', 'pipe'],
      shell: false,
      env: cleanEnv
    });
    
    // Configura handlers para o processo
    pythonServerProcess.stdout.on('data', (data) => {
      const output = data.toString().trim();
      if (output) {
        console.log('Server stdout:', output);
      }
    });
    
    pythonServerProcess.stderr.on('data', (data) => {
      const output = data.toString().trim();
      if (output) {
        console.error('Server stderr:', output);
        
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('server:error', output);
        }
      }
    });
    
    pythonServerProcess.on('close', (code) => {
      console.log(`Python server process exited with code ${code}`);
      pythonServerProcess = null;
      
      if (code !== 0 && code !== null) {
        console.log('Server crashed, handling restart...');
        handleServerCrash(mainWindow);
      }
    });
    
    pythonServerProcess.on('error', (error) => {
      console.error('Failed to start Python server:', error);
      pythonServerProcess = null;
      handleServerCrash(mainWindow);
    });
    
    // Aguarda o servidor ficar disponível
    const serverStarted = await waitForServerStart();
    if (serverStarted) {
      console.log("Python server started successfully");
      serverRestartCount = 0;
      return true;
    } else {
      // Se não iniciou, mata o processo
      if (pythonServerProcess) {
        pythonServerProcess.kill('SIGTERM');
        pythonServerProcess = null;
      }
      throw new Error('Server failed to start within timeout');
    }
    
  } catch (error) {
    console.error('Error starting Python server:', error);
    handleServerCrash(mainWindow);
    return false;
  }
}

/**
 * Para o servidor Python de forma limpa
 */
function stopPythonServer() {
  if (pythonServerProcess) {
    console.log("Stopping Python server...");
    pythonServerProcess.kill('SIGTERM');
    pythonServerProcess = null;
  }
  serverRestartCount = 0;
}

/**
 * Restarta o servidor manualmente
 */
async function restartPythonServer(mainWindow) {
  try {
    console.log("Manual server restart requested");
    console.log("Reconnect callback available:", !!reconnectCallback);
    
    serverRestartCount = 0;
    stopPythonServer();
    
    // Aguarda um pouco antes de reiniciar
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const success = await startPythonServer(mainWindow);
    
    if (success && reconnectCallback) {
      console.log('Calling reconnect callback after manual restart');
      reconnectCallback();
    }
    
    return { success };
  } catch (error) {
    console.error("Manual server restart failed:", error);
    return { success: false, error: error.message };
  }
}

module.exports = {
  startPythonServer,
  stopPythonServer,
  restartPythonServer,
  isPythonServerRunning,
  setReconnectCallback
};