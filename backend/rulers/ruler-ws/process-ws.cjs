const { spawn, exec } = require('child_process');
const net = require('net');
const path = require('path');
const fs = require('fs');
const {COLORS} = require('../../../utils/ansiColors'); //Working directory

let pythonServerProcess = null;
let serverRestartCount = 0;
const MAX_SERVER_RESTARTS = 3;

// VARIABLE FOR RECONNECTION CALLBACK
let reconnectCallback = null;

// SET THE CALLBACK FOR WEBSOCKET RECONNECTION
const setReconnectCallback = (callback) => {
  reconnectCallback = callback;
};

// CHECKS IF PYTHON SERVER IS ALREADY RUNNING ON PORT 8765
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

// KILLS ANY PYTHON PROCESSES RELATED TO OUR SERVER
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
        // WINDOWS - kill Python processes
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
        // LINUX/MAC - kill specific processes
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

// WAITS FOR PYTHON SERVER TO START
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
  
  console.log(`${COLORS.RED}Python server failed to start within timeout${COLORS.RESET}`);
  return false;
}

// HANDLES SERVER CRASH WITH AUTOMATIC RESTART
function handleServerCrash(mainWindow) {
  serverRestartCount++;
  
  if (serverRestartCount <= MAX_SERVER_RESTARTS) {
    console.log(`${COLORS.YELLOW}Restarting Python server (attempt ${serverRestartCount}/${MAX_SERVER_RESTARTS})...${COLORS.RESET}`);
    
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
    console.error(`${COLORS.RED}Python server failed to start after ${MAX_SERVER_RESTARTS} attempts${COLORS.RESET}`);
    
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('server:critical-error', {
        message: `Python server failed to start after ${MAX_SERVER_RESTARTS} attempts. Please check the server logs.`
      });
    }
  }
}

// FINDS THE PYTHON PATH INSIDE THE VENV
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
  
  throw new Error(`${COLORS.RED}Python not found in virtual environment${COLORS.RESET}`);
}

// STARTS THE PYTHON SERVER SAFELY
async function startPythonServer(mainWindow) {
  try {
    console.log("Starting Python server...");
    
    // CHECK IF IT'S ALREADY RUNNING
    const isRunning = await isPythonServerRunning();
    if (isRunning) {
      console.log("Python server is already running - killing existing process");
      await killExistingPythonServers();
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    // KILL EXISTING SERVERS
    await killExistingPythonServers();
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // CORRECT PATH TO BACKEND FOLDER
    const workingDir = path.join(__dirname, '..', '..');
    console.log('Working directory:', workingDir);
    
    const pythonPath = getPythonPath(workingDir);
    const serverPath = path.join(workingDir, 'ScryPy', 'scry_ws', 'llama_server.py');
    console.log('Server path:', serverPath);
    
    if (!fs.existsSync(serverPath)) {
      throw new Error(`${COLORS.RED}Server not found: ${serverPath}${COLORS.RESET}`);
    }
    
    // CLEAN ENVIRONMENT
    const cleanEnv = {
      ...process.env,
      DISPLAY: ':0',
      ELECTRON_RUN_AS_NODE: '1',
      PATH: process.env.PATH
    };
    
    console.log('Using Python:', pythonPath);
    console.log('Starting server:', serverPath);
    
    // START THE PROCESS
    pythonServerProcess = spawn(pythonPath, [serverPath], {
      cwd: workingDir,
      stdio: ['pipe', 'pipe', 'pipe'],
      shell: false,
      env: cleanEnv
    });
    
    // CONFIGURE PROCESS HANDLERS
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
      console.log(`${COLORS.YELLOW}Python server process exited with code ${code}${COLORS.RESET}`);
      pythonServerProcess = null;
      
      if (code !== 0 && code !== null) {
        console.log(`${COLORS.YELLOW}Server crashed, handling restart...${COLORS.RESET}`);
        handleServerCrash(mainWindow);
      }
    });
    
    pythonServerProcess.on('error', (error) => {
      console.error(`${COLORS.RED}Failed to start Python server:${COLORS.RESET}`, error);
      pythonServerProcess = null;
      handleServerCrash(mainWindow);
    });
    
    // WAIT FOR SERVER TO BECOME AVAILABLE
    const serverStarted = await waitForServerStart();
    if (serverStarted) {
      console.log(`${COLORS.GREEN}Python server started successfully${COLORS.RESET}`);
      serverRestartCount = 0;
      return true;
    } else {
      // If it didn't start, kill the process
      if (pythonServerProcess) {
        pythonServerProcess.kill('SIGTERM');
        pythonServerProcess = null;
      }
      throw new Error('Server failed to start within timeout');
    }
    
  } catch (error) {
    console.error(`${COLORS.RED}Error starting Python server:${COLORS.RESET}`, error);
    handleServerCrash(mainWindow);
    return false;
  }
}

// STOPS THE PYTHON SERVER CLEANLY
function stopPythonServer() {
  if (pythonServerProcess) {
    console.log("Stopping Python server...");
    pythonServerProcess.kill('SIGTERM');
    pythonServerProcess = null;
  }
  serverRestartCount = 0;
}

// MANUALLY RESTARTS THE SERVER
async function restartPythonServer(mainWindow) {
  try {
    console.log("Manual server restart requested");
    console.log("Reconnect callback available:", !!reconnectCallback);
    
    serverRestartCount = 0;
    stopPythonServer();
    
    // WAIT A BIT BEFORE RESTARTING
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const success = await startPythonServer(mainWindow);
    
    if (success && reconnectCallback) {
      console.log('Calling reconnect callback after manual restart');
      reconnectCallback();
    }
    
    return { success };
  } catch (error) {
    console.error(`${COLORS.RED}Manual server restart failed:${COLORS.RESET}`, error);
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