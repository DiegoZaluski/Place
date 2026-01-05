import os
import re
import time
import json
import psutil
import asyncio
from pathlib import Path
from urllib.parse import urlparse
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException
from typing import AsyncGenerator, Optional
from fastapi.responses import StreamingResponse
from scry_pkg.config.paths import possible_paths
from fastapi.middleware.cors import CORSMiddleware
from scry_pkg.scry_sse import logger, FALLBACK_PORTS_SSE


class SecurityValidator:
    @staticmethod
    def validate_model_id(model_id: str) -> bool:
        return bool(model_id and len(model_id) <= 150 and re.match(r'^[a-zA-Z0-9\-\._]+$', model_id))
    
    @staticmethod
    def validate_url(url: str, allowed_domains: list) -> bool:
        try:
            parsed = urlparse(url)
            return parsed.scheme == 'https' and any(parsed.netloc.lower().endswith(d) for d in allowed_domains)
        except:
            return False


class ProgressMonitor:
    __slots__ = ('last_progress', 'last_update', 'stall_timeout', 'cancel_event')
    
    def __init__(self, stall_timeout: int = 120):
        self.last_progress = 0
        self.last_update = time.time()
        self.stall_timeout = stall_timeout
        self.cancel_event = asyncio.Event()
    
    def update(self, progress: int):
        if progress != self.last_progress:
            self.last_progress = progress
            self.last_update = time.time()
    
    def is_stalled(self) -> bool:
        return (time.time() - self.last_update) > self.stall_timeout


class RAMDownloader:
    @staticmethod
    def get_available_ram_gb() -> float:
        return psutil.virtual_memory().available / (1024**3)
    
    @staticmethod
    def can_use_ram(size_gb: float, threshold_gb: float) -> bool:
        return RAMDownloader.get_available_ram_gb() >= ((size_gb * 2) + threshold_gb)
    
    @staticmethod
    async def download_to_ram(url: str) -> Optional[bytes]:
        try:
            import aiohttp
            async with aiohttp.ClientSession() as session:
                async with session.get(url, timeout=aiohttp.ClientTimeout(total=3600)) as response:
                    return await response.read() if response.status == 200 else None
        except Exception as e:
            logger.error(f"RAM download error: {e}")
            return None


class DownloadManager:
    def __init__(self):
        self.config = {}
        self.models = {}
        self.active_downloads = {}
    
    def load_config(self):
        config_path = next((p for p in possible_paths if os.path.exists(p)), None)
        if not config_path:
            raise FileNotFoundError("models.json not found")
        
        with open(config_path, 'r', encoding='utf-8') as f:
            self.config = json.load(f)
            self.models = {m['id']: m for m in self.config['models']}
        
        for key in ['download_path', 'temp_path', 'log_path']:
            Path(self.config[key]).mkdir(parents=True, exist_ok=True)
        
        logger.info(f"Models loaded: {len(self.models)}")
    
    def get_models(self) -> list:
        download_path = Path(self.config['download_path'])
        return [{
            "id": mid,
            "name": m['name'],
            "filename": m['filename'],
            "size_gb": m['size_gb'],
            "is_downloaded": (download_path / m['filename']).exists(),
            "is_downloading": mid in self.active_downloads,
            "file_path": str(download_path / m['filename']) if (download_path / m['filename']).exists() else None
        } for mid, m in self.models.items()]
    
    def get_model_status(self, model_id: str) -> dict:
        if model_id not in self.models:
            raise ValueError(f"Model not found: {model_id}")
        
        m = self.models[model_id]
        fp = Path(self.config['download_path']) / m['filename']
        
        return {
            "id": model_id,
            "name": m['name'],
            "filename": m['filename'],
            "size_gb": m['size_gb'],
            "is_downloaded": fp.exists(),
            "is_downloading": model_id in self.active_downloads,
            "progress": self.active_downloads[model_id].last_progress if model_id in self.active_downloads else 0,
            "file_path": str(fp) if fp.exists() else None
        }
    
    async def download(self, model_id: str) -> AsyncGenerator[dict, None]:
        if not SecurityValidator.validate_model_id(model_id):
            yield {"type": "error", "message": "Invalid ID"}
            return
        
        if model_id not in self.models:
            yield {"type": "error", "message": "Model not found"}
            return
        
        if model_id in self.active_downloads:
            yield {"type": "error", "message": "Download in progress"}
            return
        
        model = self.models[model_id]
        download_path = Path(self.config['download_path'])
        temp_path = Path(self.config['temp_path'])
        final_file = download_path / model['filename']
        
        if final_file.exists():
            yield {"type": "completed", "progress": 100, "message": "Already downloaded"}
            return
        
        monitor = ProgressMonitor(self.config.get('stall_timeout', 120))
        self.active_downloads[model_id] = monitor
        
        try:
            yield {"type": "started", "model_id": model_id, "model_name": model['name']}
            
            if RAMDownloader.can_use_ram(model['size_gb'], self.config.get('ram_download_threshold_gb', 2.5)):
                yield {"type": "info", "message": "RAM download"}
                
                for url in model['urls']:
                    if not SecurityValidator.validate_url(url, self.config['allowed_domains']):
                        continue
                    
                    data = await RAMDownloader.download_to_ram(url)
                    if data:
                        temp_file = temp_path / f"{model['filename']}.tmp"
                        temp_file.write_bytes(data)
                        temp_file.replace(final_file)
                        yield {"type": "completed", "progress": 100}
                        return
            
            yield {"type": "info", "message": "Traditional download"}
            
            wget_cmd = ["wget", "-4", "-c", "--progress=dot:mega", "--timeout=30", "--tries=3", "--read-timeout=60"]
            curl_cmd = ["curl", "-4", "-L", "-C", "-", "--connect-timeout", "30", "--max-time", "7200", "--speed-time", "60", "--speed-limit", "1024", "--retry", "3"]
            
            for url in model['urls']:
                if not SecurityValidator.validate_url(url, self.config['allowed_domains']):
                    continue
                
                temp_file = temp_path / f"{model['filename']}.tmp"
                
                for method_name, base_cmd in [("wget", wget_cmd), ("curl", curl_cmd)]:
                    cmd = base_cmd + (["-O", str(temp_file), url] if method_name == "wget" else ["-o", str(temp_file), url])
                    
                    try:
                        async for event in self._execute_download(method_name, cmd, model['size_gb'], monitor):
                            yield event
                            if event.get("type") == "completed":
                                temp_file.replace(final_file)
                                return
                    except Exception as e:
                        logger.warning(f"{method_name} failed: {e}")
                        temp_file.unlink(missing_ok=True)
                        yield {"type": "warning", "message": f"{method_name} failed"}
            
            yield {"type": "error", "message": "All methods failed"}
        finally:
            self.active_downloads.pop(model_id, None)
    
    async def _execute_download(self, method: str, cmd: list, size_gb: float, monitor: ProgressMonitor) -> AsyncGenerator[dict, None]:
        process = await asyncio.create_subprocess_exec(*cmd, stdout=asyncio.subprocess.PIPE, stderr=asyncio.subprocess.PIPE)
        start = time.time()
        last_prog = -1
        
        try:
            while True:
                if monitor.cancel_event.is_set():
                    process.kill()
                    await process.wait()
                    yield {"type": "cancelled"}
                    return
                
                if monitor.is_stalled():
                    process.kill()
                    await process.wait()
                    raise RuntimeError("Stalled")
                
                try:
                    line = await asyncio.wait_for(process.stderr.readline(), timeout=0.5)
                except asyncio.TimeoutError:
                    if process.returncode is not None:
                        break
                    continue
                
                if not line:
                    break
                
                line_str = line.decode('utf-8', errors='ignore')
                
                match = re.search(r'(\d{1,3})%', line_str)
                if match:
                    prog = int(match.group(1))
                    if 0 <= prog <= 100 and prog != last_prog:
                        monitor.update(prog)
                        elapsed = time.time() - start
                        
                        if elapsed >= 0.5:
                            speed = (prog / 100 * size_gb * 1024) / elapsed
                            eta = int(((100 - prog) / 100 * size_gb * 1024) / speed) if speed > 0 else 0
                            
                            yield {
                                "type": "progress",
                                "progress": prog,
                                "speed_mbps": round(speed, 2),
                                "eta_seconds": eta,
                                "method": method
                            }
                            last_prog = prog
            
            await process.wait()
            
            if process.returncode == 0:
                yield {"type": "completed", "progress": 100, "method": method}
            else:
                raise RuntimeError(f"Exit code {process.returncode}")
        finally:
            if process.returncode is None:
                process.kill()
                await process.wait()
    
    async def cancel(self, model_id: str) -> bool:
        if model_id not in self.active_downloads:
            return False
        
        self.active_downloads[model_id].cancel_event.set()
        await asyncio.sleep(0.5)
        
        for tmp in Path(self.config['temp_path']).glob("*.tmp"):
            tmp.unlink(missing_ok=True)
        
        return True


manager = DownloadManager()


@asynccontextmanager
async def lifespan(app: FastAPI):
    manager.load_config()
    yield


app = FastAPI(title="Model Download API", lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])


@app.get("/api/models")
async def list_models():
    try:
        return {"success": True, "models": manager.get_models()}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/models/{model_id}/status")
async def model_status(model_id: str):
    try:
        if not SecurityValidator.validate_model_id(model_id):
            raise HTTPException(status_code=400, detail="Invalid ID")
        return {"success": True, **manager.get_model_status(model_id)}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/models/{model_id}/download")
async def download_model(model_id: str):
    if not SecurityValidator.validate_model_id(model_id):
        raise HTTPException(status_code=400, detail="Invalid ID")
    
    async def event_stream():
        async for event in manager.download(model_id):
            yield f"data: {json.dumps(event)}\n\n"
    
    return StreamingResponse(event_stream(), media_type="text/event-stream", 
                           headers={"Cache-Control": "no-cache", "Connection": "keep-alive", "X-Accel-Buffering": "no"})


@app.delete("/api/models/{model_id}/download")
async def cancel_download(model_id: str):
    if not SecurityValidator.validate_model_id(model_id):
        raise HTTPException(status_code=400, detail="Invalid ID")
    
    success = await manager.cancel(model_id)
    return {"success": success, "message": "Cancelled" if success else "No active download"}


@app.get("/health")
async def health():
    return {"status": "ok", "active_downloads": len(manager.active_downloads), "available_ram_gb": round(RAMDownloader.get_available_ram_gb(), 2)}


def main():
    import uvicorn, socket
    
    for port in FALLBACK_PORTS_SSE:
        try:
            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                s.bind(('0.0.0.0', port))
            uvicorn.run(app, host="0.0.0.0", port=port, reload=False)
            break
        except OSError:
            continue


if __name__ == "__main__":
    main()