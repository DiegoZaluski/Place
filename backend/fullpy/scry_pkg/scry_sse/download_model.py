import os
import re
import time
import json
import asyncio
from pathlib import Path
from urllib.parse import urlparse
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException
from typing import AsyncGenerator
from fastapi.responses import StreamingResponse
from scry_pkg.config.paths import possible_paths
from fastapi.middleware.cors import CORSMiddleware
from scry_pkg.scry_sse import logger, FALLBACK_PORTS_SSE

# SECURITY VALIDATION
class SecurityValidator:
    
    @staticmethod
    def validate_model_id(model_id: str) -> bool:
        # PERMISSIVE VALIDATION - ACCEPTS REAL IDs
        if not model_id or len(model_id) > 100:
            logger.debug(f"[VALIDATION] Empty or ID too long: {model_id}")
            return False
        
        # Allows: letters (uppercase/lowercase), numbers, hyphens, dots, underscores
        if not re.match(r'^[a-zA-Z0-9\-\._]+$', model_id): #########################
            logger.debug(f"[VALIDATION] ID contains invalid characters: {model_id}")
            return False
        
        logger.debug(f"[VALIDATION] ID VALID: {model_id}")
        return True 
    
    ####################################################################################                                         SECURITY VALIDATION
    @staticmethod
    def validate_url(url: str, allowed_domains: list[str]) -> bool:
        try:
            parsed = urlparse(url) #####
            if parsed.scheme != 'https':
                logger.warning(f"URL does not use HTTPS: {url}")
                return False
            
            domain = parsed.netloc.lower()
            logger.debug(f"Domain extracted: {domain}")
            return any(domain.endswith(d) for d in allowed_domains)
        except Exception as e:
            logger.error(f"Error validating URL {url}: {str(e)}")
            return False
        
    ###################################################################################
    @staticmethod
    def validate_filename(filename: str) -> bool:
        if '..' in filename or '/' in filename or '\\' in filename:
            logger.warning(f"Invalid filename (contains prohibited characters): {filename}")
            return False
        is_valid = filename.endswith('.gguf') and len(filename) < 100
        if not is_valid:
            logger.warning(f"Invalid file format or name too long: {filename}")
        return is_valid
    
#####################################################################################################
class CommandBuilder:   
    COMMANDS = {
        "wget": ["wget", "-c", "--progress=dot:giga", "-O"],
        "curl": ["curl", "-L", "-C", "-", "--progress-bar", "-o"]
    }
    
    @classmethod
    def build(cls, method: str, url: str, output_file: str) -> list[str]:#                                                 COMMAND BUILDER: mount the command                             
        if method not in cls.COMMANDS:
            raise ValueError(f"Method {method} not supported")
        
        if ';' in url or '&' in url or '|' in url or '`' in url:
            raise ValueError("URL contains prohibited characters")
        
        cmd = cls.COMMANDS[method].copy()
        cmd.append(output_file)
        cmd.append(url)
        
        return cmd
#####################################################################################################
class DownloadManager:
    def __init__(self):
        self.config = {}#                                                                               obj json go here
        self.models = {}
        self.active_downloads = {} #                                                                    states
    
    def load_config(self) -> None:
        try:
            logger.warning("load configuration...")
            # TEST MULTIPLE PATHS  - test remove fallback   
            config_path = None
            for path in possible_paths: # imported - possible_paths
                if os.path.exists(path):
                    config_path = path
                    logger.info(f"File found at: {path}")
                    break
                else:
                    logger.warning(f"File Not found: {path}")
            #####################################################################  ^^^ finds path in dir/files ^^^ (config_path ex: ./config/models.json")

            if config_path is None:
                logger.error("Error: models.json not found in any known location!")
                logger.error(f"Current directory: {os.getcwd()}")
                logger.error(f"Directory contents: {os.listdir('.')}")
                raise FileNotFoundError("models.json not found in any known location")
            
            logger.info(f" Reading file: {config_path}")
            with open(config_path, 'r', encoding='utf-8') as f:#                                                            # DOWNLOAD MANAGER: is the main class
                content = f.read()
                # logger.debug(f" File content (first 500 chars): {content[:500]}...")

                self.config = json.loads(content)#                                                                          
                self.models = {m['id']: m for m in self.config['models']}# ex: "Llama-3.2-3B-Instruct-Q4_K_M.gguf": {"id."."name"..} 

            ##################################################################### borny cofig == full json in models.json

            for dir_key in ['download_path', 'temp_path', 'log_path']:
                if not dir_key in self.config:#                                                                                 
                    raise FileNotFoundError("""
                    File not find in models.json,
                    line ..121...""")
                if not os.path.exists(self.config[dir_key]):
                    raise FileNotFoundError("""
                    file code: download_model.py, 
                    line ... 120 ... 
                    """)#                                                                                                    file verification and JSON
            
            logger.info(f" IDs available: {list(self.models.keys())}")
        
        except json.JSONDecodeError as e:
            logger.error(f"ERROR: Failed to decode JSON file: {e}")
            raise ValueError(f"Invalid configuration file: {e}")
        except Exception as e:
            logger.error(f"CRITICAL ERROR loading configuration: {e}")
            raise
    #####################################################################
    def get_models(self) -> list[dict]:
        result = []
        download_path = Path(self.config['download_path'])
        
        for model_id, model in self.models.items():
            file_path = download_path / model['filename'] # duplicate in json: id == filename
            result.append({
                "id": model_id,
                "name": model['name'],
                "filename": model['filename'],
                "size_gb": model['size_gb'], # improve in the future
                "is_downloaded": file_path.exists(),
                "is_downloading": model_id in self.active_downloads
            })
        
        return result
    
    ##################################################################### 

    def get_model_status(self, model_id: str) -> dict:
        if model_id not in self.models:
            raise ValueError(f"Model: {model_id} not found")
        
        model = self.models[model_id]
        file_path = Path(self.config['download_path']) / model['filename']
        
        # ADD PROGRESS INFO IF DOWNLOADING
        progress = 0
        if model_id in self.active_downloads:
            # Try to get progress from internal state (if available)
            progress = getattr(self.active_downloads[model_id], 'progress', 0)#                                 received an instance of a class
        
        return {
            "id": model_id,
            "name": model['name'],
            "is_downloaded": file_path.exists(),
            "is_downloading": model_id in self.active_downloads,
            "progress": progress,
            "file_path": str(file_path) if file_path.exists() else None
        }
    
    ##################################################################### 
    
    async def download(self, model_id: str) -> AsyncGenerator[dict, None]:
        # VALIDATION
        if not SecurityValidator.validate_model_id(model_id):
            yield {"type": "error", "message": "Invalid ID"}
            return
        
        if model_id not in self.models:
            yield {"type": "error", "message": "Model not found"}
            return
#                                                                                                              ( main download )   
        if model_id in self.active_downloads:
            yield {"type": "error", "message": "Download already in progress"}
            return
        
        model = self.models[model_id]
        download_path = Path(self.config['download_path'])
        temp_path = Path(self.config['temp_path'])
        
        final_file = download_path / model['filename'] # ex: "../../../../llama.cpp/models/Llama-3.2-3B-Instruct-Q4_K_M.gguf"
         
        #Add functionality to check if the file is corrupted here.
        if final_file.exists():
            yield {"type": "completed", "progress": 100, "message": "Already downloaded"}
            return
        
        ##################################################################### 

        # CREATE STATE OBJECT TO STORE PROGRESS
        class DownloadState:
            def __init__(self):
                self.cancel_event = asyncio.Event()
                self.progress = 0
        
        state = DownloadState()
        self.active_downloads[model_id] = state#                                                         intacy active_downloads
        
        try:
            yield {"type": "started", "model_id": model_id, "model_name": model['name']}
            
            for idx, method_config in enumerate(model['methods'], 1):
                method_type = method_config['type']
                url = method_config['url']
                
                yield {
                    "type": "info", 
                    "message": f"method {idx}/{len(model['methods'])}: {method_type}"
                }
                
                if not SecurityValidator.validate_url(url, self.config['allowed_domains']):
                    yield {"type": "warning", "message": f"URL não permitida: {method_type}"}
                    continue
                
                if not SecurityValidator.validate_filename(model['filename']):
                    yield {"type": "error", "message": "Filename inválido"}
                    return
                
                temp_file = temp_path / f"{model['filename']}.tmp"
                
                max_retries = 2
                for retry in range(max_retries):
                    if retry > 0:
                        yield {
                            "type": "info", 
                            "message": f"Tentativa {retry + 1}/{max_retries}"
                        }
                        await asyncio.sleep(2)
                    
                    try:
                        async for event in self._execute_download(
                            method_type,
                            url,
                            temp_file,
                            model['size_gb'],
                            state
                        ):
                            yield event #####
                            
                            if event.get("type") == "completed":
                                temp_file.replace(final_file)
                                logger.info(f"Download completo: {model_id} via {method_type}")
                                return
                        
                        raise RuntimeError("Download não completou")
                    
                    except Exception as e:
                        logger.warning(f"Falha em {method_type} (tentativa {retry + 1}): {e}")
                        
                        if temp_file.exists():
                            temp_file.unlink()
                        
                        if retry < max_retries - 1:
                            continue
                        else:
                            yield {"type": "warning", "message": f"Failed after {max_retries} attempts"}
                            break
            
            yield {"type": "error", "message": "All methods failed"}
        
        finally:
            self.active_downloads.pop(model_id, None)
    
    async def _execute_download(
        self,
        method: str,
        url: str,
        output_file: Path,
        size_gb: float,
        state  # DownloadState object
    ) -> AsyncGenerator[dict, None]:
        
        cmd = CommandBuilder.build(method, url, str(output_file))
        logger.info(f"Executing: {' '.join(cmd)}")
        
        process = await asyncio.create_subprocess_exec(
            *cmd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE
        )
        
        last_progress = 0
        start_time = time.time()
        
        try:
            while True:
                if state.cancel_event.is_set():
                    process.kill()
                    await process.wait()
                    yield {"type": "cancelled", "message": "Cancelled by user"}
                    return
                
                try:
                    line = await asyncio.wait_for(
                        process.stderr.readline(),
                        timeout=0.5
                    )
                except asyncio.TimeoutError:
                    if process.returncode is not None:
                        break
                    continue
                
                if not line:
                    break
                
                line_str = line.decode('utf-8', errors='ignore').strip()
                
                percent_match = re.search(r'(\d+(?:\.\d+)?)%', line_str)
                if percent_match:
                    progress = int(float(percent_match.group(1)))
                    
                    if abs(progress - last_progress) >= 1:
                        state.progress = progress  
                        elapsed = time.time() - start_time
                        
                        downloaded_gb = (progress / 100) * size_gb
                        downloaded_mb = downloaded_gb * 1024
                        
                        speed_mbps = downloaded_mb / elapsed if elapsed > 0 else 0
                        
                        if speed_mbps > 0:
                            remaining_mb = (size_gb * 1024) - downloaded_mb
                            eta_seconds = int(remaining_mb / speed_mbps)
                        else:
                            eta_seconds = 0
                        
                        yield {
                            "type": "progress",
                            "progress": progress,
                            "speed_mbps": round(speed_mbps, 2),
                            "eta_seconds": eta_seconds,
                            "method": method
                        }
                        
                        last_progress = progress
            
            await process.wait()
            
            if process.returncode == 0 and not state.cancel_event.is_set():
                yield {"type": "completed", "progress": 100, "method": method}
            elif not state.cancel_event.is_set():
                raise RuntimeError(f"Command failed with code {process.returncode}")
        
        finally:
            if process.returncode is None:
                process.kill()
                await process.wait()
    
    async def cancel(self, model_id: str) -> bool:
        if model_id not in self.active_downloads:
            return False
        
        state = self.active_downloads[model_id]
        state.cancel_event.set()
        
        await asyncio.sleep(1)
        
        temp_path = Path(self.config['temp_path'])
        for tmp_file in temp_path.glob("*.tmp"):
            try:
                tmp_file.unlink()
            except:
                pass
        
        logger.info(f"Download cancelled: {model_id}")
        return True

# INITIALIZE MANAGER
manager = DownloadManager()

@asynccontextmanager
async def lifespan(app:FastAPI):
    manager.load_config()
    yield

# CREATE APP
app = FastAPI(title="Model Download API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ROUTES
@app.get("/api/models")
async def list_models():
    """ LIST ALL MODELS """
    try:
        models = manager.get_models()
        return {"success": True, "models": models}
    except Exception as e:
        logger.error(f"Erro ao listar: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/models/{model_id}/status")
async def model_status(model_id: str):
    """ MODEL STATUS """
    try:
        logger.info(f"[PYTHON] STATUS REQUEST - ID received: '{model_id}")
        logger.info(f"[PYTHON] IDs available in system: {list(manager.models.keys())}")
        logger.info(f"[PYTHON] Total of models: {len(manager.models)}")
        
        if not SecurityValidator.validate_model_id(model_id):
            logger.error(f"[PYTHON] VALIDATION FAILED: {model_id}")
            raise HTTPException(
                status_code=400, 
                detail=f"Invalid ID: {model_id}. Use only lowercase letters, numbers, and hyphens."
            )
        
        if model_id not in manager.models:
            logger.error(f"[PYTHON] ID NOT FOUND: {model_id}")
            logger.error(f"[PYTHON] IDs available: {list(manager.models.keys())}")
            raise HTTPException(
                status_code=404, 
                detail=f"Model '{model_id}' not found. Available models: {', '.join(manager.models.keys())}"
            )
            
        logger.info(f"[PYTHON] ID VALID: {model_id}")
        status = manager.get_model_status(model_id)
        return {"success": True, **status}
    
    except HTTPException:
        # Re-raise HTTP exceptions as they are already properly formatted
        raise
    except ValueError as e:
        logger.error(f"[PYTHON] VALUE ERROR: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"[PYTHON] ERROR in model_status: {e}")
        logger.error(f"[PYTHON] Stack trace: {traceback.format_exc()}")
        raise HTTPException(
            status_code=500, 
            detail=f"Erro interno ao processar a requisição: {str(e)}"
        )

# IMPORTANT: CHANGE TO GET (compatible with EventSource)
@app.get("/api/models/{model_id}/download")
async def download_model(model_id: str):
    """# DOWNLOAD MODEL VIA SSE (EventSource uses GET)"""
    try:
        if not SecurityValidator.validate_model_id(model_id):
            raise HTTPException(status_code=400, detail="ID inválido")
        
        async def event_stream():
            async for event in manager.download(model_id):
                yield f"data: {json.dumps(event)}\n\n"
        
        return StreamingResponse(
            event_stream(),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "X-Accel-Buffering": "no"
            }
        )
    
    except Exception as e:
        logger.error(f"[PYTHON] ERROR in download_model: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/models/{model_id}/download")
async def cancel_download(model_id: str):
    """# CANCEL DOWNLOAD"""
    try:
        if not SecurityValidator.validate_model_id(model_id):
            raise HTTPException(status_code=400, detail="ID inválido")
        
        success = await manager.cancel(model_id)
        
        return {
            "success": success,
            "message": "Cancelled" if success else "No active download"
        }
    
    except Exception as e:
        logger.error(f"[PYTHON] ERROR in cancel_download: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health():
    """# HEALTH CHECK"""
    return {
        "status": "ok",
        "active_downloads": len(manager.active_downloads)
    }
def main() -> None:
    import uvicorn
    import socket
    SUCCESSFUL_SSE = False
    for port in FALLBACK_PORTS_SSE:
        try:
            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                s.bind(('0.0.0.0', port))
            
            logger.info(f"[PYTHON] Starting server on port {port}")
            uvicorn.run(
                app,
                host="0.0.0.0",
                port=port,
                reload=True
                )
            SUCCESSFUL_SSE = True
            break
            
        except OSError:
            logger.warning(f"[PYTHON] Port {port} busy, trying next...")
            continue
    if not SUCCESSFUL_SSE:
        logger.error("[PYTHON] Server failed to start.")

if __name__ == "__main__":
    main()   