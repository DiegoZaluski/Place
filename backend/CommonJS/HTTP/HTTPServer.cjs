// HTTPServer.cjs

const { spawn } = require('child_process');
const path = require('path');

class HTTPServer {
    constructor() {
        this.httpProcess = null; 
    }

    // INICIALIZAÇÃO DO SERVIDOR HTTP
    async startHTTP() {
        return new Promise((resolve, reject) => {
            const pathHTTP = path.join(__dirname, '..', '..', 'python', 'HTTP', 'http_server.py');
            const pythonPath = path.join(__dirname, '..', '..', 'venv', 'bin', 'python3');
            
            console.log('🐍 Python Path:', pythonPath);
            console.log('📁 HTTP Script Path:', pathHTTP);

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
                
                // DETECTA QUANDO ESTÁ PRONTO
                if (output.includes('Uvicorn running on')) {
                    resolve(true);
                }
            });

            this.httpProcess.stderr.on('data', (data) => {
                console.error('❌ HTTP Server ERR:', data.toString().trim());
            });

            this.httpProcess.on('error', (error) => {  // ADICIONA handler de erro
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

    // PARADA DO SERVIDOR HTTP
    stopHTTP() {
        if (this.httpProcess) {
            this.httpProcess.kill('SIGTERM');  // SIGTERM primeiro (mais seguro)
            this.httpProcess = null;
        }
    }

    // MÉTODO DE REINICIALIZAÇÃO (FUTURO)
    async restartHTTP() {
        console.log(' Reiniciando HTTP Server...');
        this.stopHTTP();
        
        // Pequena pausa para garantir parada completa
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        return await this.startHTTP();
    }
}

module.exports = HTTPServer;