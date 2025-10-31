const { spawn, exec } = require('child_process');
const net = require('net');
const path = require('path');
const fs = require('fs');

let pythonServerProcess = null;
let serverRestartCount = 0;
const MAX_SERVER_RESTARTS = 3;

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
    const platform = process.platform;
    let command = '';
    
    if (platform === 'win32') {
      command = `netstat -ano | findstr :8765 | findstr LISTENING`;
    } else {
      command = `lsof -ti:8765`;
    }
    
    exec(command, (error, stdout) => {
      if (error || !stdout) {
        resolve();
        return;
      }
      
      if (platform === 'win32') {
        const pids = stdout.split('\n')
          .filter(line => line.trim())
          .map(line => line.split(/\s+/).pop())
          .filter(pid => pid);
        
        pids.forEach(pid => {
          try {
            process.kill(parseInt(pid));
          } catch (e) {
            // Processo já finalizado
          }
        });
      } else {
        const pids = stdout.trim().split('\n');
        pids.forEach(pid => {
          try {
            process.kill(parseInt(pid));
          } catch (e) {
            // Processo já finalizado
          }
        });
      }
      
      setTimeout(resolve, 500);
    });
  });
}

/**
 * Aguarda o servidor Python iniciar
 */
async function waitForServerStart(timeout = 10000) {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeout) {
    const isRunning = await isPythonServerRunning();
    if (isRunning) {
      return true;
    }
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  return false;
}

/**
 * Manipula crash do servidor com restart automático
 */
function handleServerCrash(mainWindow, connectToPythonServer) {
  serverRestartCount++;
  
  if (serverRestartCount <= MAX_SERVER_RESTARTS) {
    console.log(`🔄 Restarting Python server (attempt ${serverRestartCount}/${MAX_SERVER_RESTARTS})...`);
    
    setTimeout(async () => {
      const success = await startPythonServer(mainWindow);
      if (success) {
        connectToPythonServer();
      }
    }, 2000);
  } else {
    console.error(`💥 Python server failed to start after ${MAX_SERVER_RESTARTS} attempts`);
    
    // Notifica a UI sobre o erro crítico
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
      console.log(`✅ Python encontrado: ${pythonPath}`);
      return pythonPath;
    }
  }
  
  throw new Error('Python não encontrado no virtual environment');
}

/**
 * Inicia o servidor Python de forma segura
 */
async function startPythonServer(mainWindow) {
  try {
    console.log("🚀 Starting Python server...");
    
    // Verifica se já está rodando
    const isRunning = await isPythonServerRunning();
    if (isRunning) {
      console.log("✅ Python server is already running");
      return true;
    }
    
    // Mata servidores existentes que possam estar em estado zumbi
    await killExistingPythonServers();
    
    // Caminho correto para a pasta backend
    const workingDir = path.join(__dirname, '..');  // Volta um nível para a pasta backend
    console.log(`📁 Working directory: ${workingDir}`);
    
   
    const pythonPath = getPythonPath(workingDir);
    const serverPath = path.join(workingDir, 'python', 'Websocket', 'llama_server.py');
    console.log(`🔍 Procurando servidor em: ${serverPath}`);
    
    if (!fs.existsSync(path.dirname(serverPath))) {
      throw new Error(`Servidor Python não encontrado em: ${path.dirname(serverPath)}`);
    }
    
    // Environment limpo para evitar erro GTK
    const cleanEnv = {
      ...process.env,
      DISPLAY: ':0',
      ELECTRON_RUN_AS_NODE: '1',
      // Mantém o PATH original para encontrar dependências
      PATH: process.env.PATH
    };
    
    console.log(`🎯 Usando Python: ${pythonPath}`);
    console.log(`🎯 Servidor: ${serverPath}`);
    
    // ✅ CORREÇÃO: Usa o caminho absoluto do Python do venv
    pythonServerProcess = spawn(pythonPath, [serverPath], {
      cwd: workingDir, // Define o diretório de trabalho
      stdio: ['pipe', 'pipe', 'pipe'],
      shell: false,
      env: cleanEnv
    });
    
    // Configura handlers para o processo
    pythonServerProcess.stdout.on('data', (data) => {
      const output = data.toString().trim();
      if (output) {
        console.log(`🐍 Server: ${output}`);
      }
    });
    
    pythonServerProcess.stderr.on('data', (data) => {
      const output = data.toString().trim();
      if (output) {
        console.error(`🐍 Server Error: ${output}`);
        
        // Envia erros para a UI se a janela estiver pronta
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('server:error', output);
        }
      }
    });
    
    pythonServerProcess.on('close', (code) => {
      console.log(`🐍 Python server process exited with code ${code}`);
      pythonServerProcess = null;
      
      if (code !== 0 && code !== null) {
        handleServerCrash(mainWindow, require('./main').connectToPythonServer);
      }
    });
    
    pythonServerProcess.on('error', (error) => {
      console.error('❌ Failed to start Python server:', error);
      pythonServerProcess = null;
      handleServerCrash(mainWindow, require('./main').connectToPythonServer);
    });
    
    // Aguarda o servidor ficar disponível
    const serverStarted = await waitForServerStart();
    if (serverStarted) {
      console.log("✅ Python server started successfully");
      serverRestartCount = 0;
      return true;
    } else {
      throw new Error('Server failed to start within timeout');
    }
    
  } catch (error) {
    console.error('❌ Error starting Python server:', error);
    handleServerCrash(mainWindow, require('./main').connectToPythonServer);
    return false;
  }
}

/**
 * Para o servidor Python de forma limpa
 */
function stopPythonServer() {
  if (pythonServerProcess) {
    console.log("🛑 Stopping Python server...");
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
    console.log("🔄 Manual server restart requested");
    serverRestartCount = 0;
    stopPythonServer();
    
    const success = await startPythonServer(mainWindow);
    return { success };
  } catch (error) {
    console.error("❌ Manual server restart failed:", error);
    return { success: false, error: error.message };
  }
}

module.exports = {
  startPythonServer,
  stopPythonServer,
  restartPythonServer,
  isPythonServerRunning
};