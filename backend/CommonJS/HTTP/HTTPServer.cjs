const { spawn } = require('child_process');
const path = require('path');

class HTTPServer {
    constructor() {
        this.httpProcess = null; 
    }

    // HTTP SERVER INITIALIZATION
    async startHTTP() {
        return new Promise((resolve, reject) => {
            const pathHTTP = path.join(__dirname, '..', '..', 'python', 'HTTP', 'http_server.py');
            const pythonPath = path.join(__dirname, '..', '..', 'venv', 'bin', 'python3');
            
            console.log('Python Path:', pythonPath);
            console.log('HTTP Script Path:', pathHTTP);

            this.httpProcess = spawn(pythonPath, [
                '-c', 
                `import sys; sys.path.insert(0, '${path.join(__dirname, "..", "..", "python", "HTTP")}'); import http_server; import uvicorn; uvicorn.run(http_server.app, host="0.0.0.0", port=8001)`
            ], {
                cwd: path.join(__dirname, '..', '..'),
                stdio: ['pipe', 'pipe', 'pipe']
            });   
            
            this.httpProcess.stdout.on('data', (data) => {
                const output = data.toString().trim();
                console.log('HTTP Server:', output);
                
                // DETECTS WHEN SERVER IS READY
                if (output.includes('Uvicorn running on')) {
                    resolve(true);
                }
            });

            this.httpProcess.stderr.on('data', (data) => {
                console.error('HTTP Server ERR:', data.toString().trim());
            });

            this.httpProcess.on('error', (error) => {  // Adds error handler
                reject(error);
            });

            this.httpProcess.on('close', (code) => {
                console.log(`HTTP Server exited with code ${code}`);
            });

            // TIMEOUT DE SEGURANÇA
            setTimeout(() => {
                if (this.httpProcess) {
                    resolve(true); // Assume que iniciou
                }
            }, 5000);
        });
    }

    // STOPPING HTTP SERVER
    stopHTTP() {
        if (this.httpProcess) {
            this.httpProcess.kill('SIGTERM');  // SIGTERM first (more secure)
            this.httpProcess = null;
        }
    }

    // RESTART HTTP SERVER
    async restartHTTP() {
        console.log('Restarting HTTP Server...');
        this.stopHTTP();
        
        // Small pause to ensure complete stop
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        return await this.startHTTP();
    }
}

module.exports = HTTPServer;