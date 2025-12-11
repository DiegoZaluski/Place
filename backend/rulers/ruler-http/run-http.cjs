const { spawn } = require('child_process');
const path = require('path');

class HTTPRun {
  constructor() { 
    this.httpProcess = null; 
  }

  startHTTP() {
    return new Promise((resolve, reject) => {
      // PATH CONFIG: Locate Python virtual environment
      const pythonPath = path.join(__dirname, '..', '..', 'venv', 'bin', 'python3');
      const cwd = path.join(__dirname, '..', '..', 'ScryPy', 'scry_http');

      // PROCESS SPAWN: Start Uvicorn server with specific configuration
      this.httpProcess = spawn(pythonPath, [
        '-m', 'uvicorn',
        'main:app',
        '--host', '0.0.0.0',
        '--port', '8001'
      ], { cwd, stdio: ['ignore', 'pipe', 'pipe'] });

      let ready = false;
      
      // STDOUT HANDLER: Monitor for server readiness signals
      this.httpProcess.stdout.on('data', d => {
        const t = d.toString();
        console.log('HTTP:', t.trim());
        if (!ready && (/Uvicorn running/.test(t) || /Application startup complete/.test(t))) {
          ready = true;
          resolve(true);
        }
      });

      // STDERR HANDLER: Log errors without blocking startup
      this.httpProcess.stderr.on('data', d => {
        const t = d.toString();
        console.error('HTTP ERR:', t.trim());
      });

      this.httpProcess.on('error', reject);
      
      // EXIT HANDLER: Clean up on process termination
      this.httpProcess.on('close', code => {
        console.log('HTTP exited:', code);
      });

      // TIMEOUT SAFETY: Prevent hanging if ready signal never arrives
      setTimeout(() => {
        if (!ready) {
          console.warn('HTTP server did not show ready message — resolving as false');
          resolve(false);
        }
      }, 5000);
    });
  }

  stopHTTP() {
    // PROCESS TERMINATION: Gracefully shutdown HTTP server
    if (this.httpProcess) {
      this.httpProcess.kill('SIGTERM');
      this.httpProcess = null;
    }
  }

  async restartHTTP() {
    // RESTART SEQUENCE: Stop, wait, then start again
    this.stopHTTP();
    await new Promise(r => setTimeout(r, 800));
    return this.startHTTP();
  }
}

module.exports = HTTPRun;
