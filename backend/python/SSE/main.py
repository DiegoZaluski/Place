from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from contextlib import asynccontextmanager
import json
import asyncio
import re
from pathlib import Path
from typing import AsyncGenerator, Dict, List
from urllib.parse import urlparse
import subprocess
import time
import logging
from logging.handlers import RotatingFileHandler

# CONFIGURAÇÃO DE LOGGING
def setup_logging():
    Path("./logs").mkdir(exist_ok=True)
    
    logger = logging.getLogger("download_system")
    logger.setLevel(logging.INFO)
    
    handler = RotatingFileHandler(
        "./logs/download.log",
        maxBytes=10*1024*1024,
        backupCount=30
    )
    handler.setFormatter(
        logging.Formatter('%(asctime)s - %(levelname)s - %(message)s')
    )
    
    logger.addHandler(handler)
    logger.addHandler(logging.StreamHandler())
    
    return logger

logger = setup_logging()

# VALIDAÇÃO DE SEGURANÇA
class SecurityValidator:
    
    @staticmethod
    def validate_model_id(model_id: str) -> bool:
        # APENAS LETRAS, NÚMEROS, HÍFEN
        return bool(re.match(r'^[a-z0-9\-]+$', model_id)) and len(model_id) < 50
    
    @staticmethod
    def validate_url(url: str, allowed_domains: List[str]) -> bool:
        # APENAS HTTPS E DOMÍNIOS PERMITIDOS
        try:
            parsed = urlparse(url)
            if parsed.scheme != 'https':
                return False
            
            domain = parsed.netloc.lower()
            return any(domain.endswith(d) for d in allowed_domains)
        except:
            return False
    
    @staticmethod
    def validate_filename(filename: str) -> bool:
        # SEM PATH TRAVERSAL, APENAS .gguf
        if '..' in filename or '/' in filename or '\\' in filename:
            return False
        return filename.endswith('.gguf') and len(filename) < 100

# CONSTRUTOR DE COMANDOS
class CommandBuilder:
    
    COMMANDS = {
        "wget": ["wget", "-c", "--progress=dot:giga", "-O"],
        "curl": ["curl", "-L", "-C", "-", "--progress-bar", "-o"]
    }
    
    @classmethod
    def build(cls, method: str, url: str, output_file: str) -> List[str]:
        # CONSTRUIR COMANDO SEGURO
        if method not in cls.COMMANDS:
            raise ValueError(f"Método {method} não suportado")
        
        # SANITIZAR URL
        if ';' in url or '&' in url or '|' in url or '`' in url:
            raise ValueError("URL contém caracteres proibidos")
        
        cmd = cls.COMMANDS[method].copy()
        cmd.append(output_file)
        cmd.append(url)
        
        return cmd

# GERENCIADOR DE DOWNLOADS
class DownloadManager:
    
    def __init__(self):
        self.config = {}
        self.models = {}
        self.active_downloads = {}
    
    def load_config(self):
        # CARREGAR JSON
        with open("./config/models.json", 'r', encoding='utf-8') as f:
            self.config = json.load(f)
            self.models = {m['id']: m for m in self.config['models']}
        
        # CRIAR DIRETÓRIOS
        Path(self.config['download_path']).mkdir(parents=True, exist_ok=True)
        Path(self.config['temp_path']).mkdir(parents=True, exist_ok=True)
        Path(self.config['log_path']).mkdir(parents=True, exist_ok=True)
        
        logger.info(f"✅ {len(self.models)} modelos carregados")
    
    def get_models(self) -> List[Dict]:
        # LISTAR MODELOS COM STATUS
        result = []
        download_path = Path(self.config['download_path'])
        
        for model_id, model in self.models.items():
            file_path = download_path / model['filename']
            
            result.append({
                "id": model_id,
                "name": model['name'],
                "filename": model['filename'],
                "size_gb": model['size_gb'],
                "is_downloaded": file_path.exists(),
                "is_downloading": model_id in self.active_downloads
            })
        
        return result
    
    def get_model_status(self, model_id: str) -> Dict:
        # STATUS DE UM MODELO
        if model_id not in self.models:
            raise ValueError(f"Modelo {model_id} não encontrado")
        
        model = self.models[model_id]
        file_path = Path(self.config['download_path']) / model['filename']
        
        return {
            "id": model_id,
            "name": model['name'],
            "is_downloaded": file_path.exists(),
            "is_downloading": model_id in self.active_downloads,
            "file_path": str(file_path) if file_path.exists() else None
        }
    
    async def download(self, model_id: str) -> AsyncGenerator[Dict, None]:
        # DOWNLOAD COM FALLBACK
        
        # VALIDAÇÃO
        if not SecurityValidator.validate_model_id(model_id):
            yield {"type": "error", "message": "ID inválido"}
            return
        
        if model_id not in self.models:
            yield {"type": "error", "message": "Modelo não encontrado"}
            return
        
        if model_id in self.active_downloads:
            yield {"type": "error", "message": "Download já em andamento"}
            return
        
        model = self.models[model_id]
        download_path = Path(self.config['download_path'])
        temp_path = Path(self.config['temp_path'])
        
        # VERIFICAR SE JÁ EXISTE
        final_file = download_path / model['filename']
        if final_file.exists():
            yield {"type": "completed", "progress": 100, "message": "Já baixado"}
            return
        
        # MARCAR COMO ATIVO
        cancel_event = asyncio.Event()
        self.active_downloads[model_id] = cancel_event
        
        try:
            yield {"type": "started", "model_id": model_id, "model_name": model['name']}
            
            # TENTAR CADA MÉTODO
            for idx, method_config in enumerate(model['methods'], 1):
                method_type = method_config['type']
                url = method_config['url']
                
                yield {
                    "type": "info", 
                    "message": f"Método {idx}/{len(model['methods'])}: {method_type}"
                }
                
                # VALIDAR URL
                if not SecurityValidator.validate_url(url, self.config['allowed_domains']):
                    yield {"type": "warning", "message": f"URL não permitida: {method_type}"}
                    continue
                
                # VALIDAR FILENAME
                if not SecurityValidator.validate_filename(model['filename']):
                    yield {"type": "error", "message": "Filename inválido"}
                    return
                
                temp_file = temp_path / f"{model['filename']}.tmp"
                
                # RETRY ATÉ 2 VEZES POR MÉTODO
                max_retries = 2
                for retry in range(max_retries):
                    if retry > 0:
                        yield {
                            "type": "info", 
                            "message": f"Tentativa {retry + 1}/{max_retries}"
                        }
                        await asyncio.sleep(2)  # AGUARDAR 2s ENTRE RETRIES
                    
                    try:
                        # EXECUTAR DOWNLOAD
                        async for event in self._execute_download(
                            method_type,
                            url,
                            temp_file,
                            model['size_gb'],
                            cancel_event
                        ):
                            yield event
                            
                            # SE COMPLETOU, MOVER ARQUIVO
                            if event.get("type") == "completed":
                                temp_file.replace(final_file)
                                logger.info(f"✅ Download completo: {model_id} via {method_type}")
                                return
                        
                        # SE CHEGOU AQUI SEM COMPLETED, FALHOU
                        raise RuntimeError("Download não completou")
                    
                    except Exception as e:
                        logger.warning(f"Falha em {method_type} (tentativa {retry + 1}): {e}")
                        
                        # LIMPAR ARQUIVO TEMPORÁRIO
                        if temp_file.exists():
                            temp_file.unlink()
                        
                        # SE NÃO É ÚLTIMA TENTATIVA, CONTINUA
                        if retry < max_retries - 1:
                            continue
                        else:
                            yield {"type": "warning", "message": f"Falha após {max_retries} tentativas"}
                            break
            
            # TODOS FALHARAM
            yield {"type": "error", "message": "Todos os métodos falharam"}
        
        finally:
            # REMOVER DE ATIVOS
            self.active_downloads.pop(model_id, None)
    
    async def _execute_download(
        self,
        method: str,
        url: str,
        output_file: Path,
        size_gb: float,
        cancel_event: asyncio.Event
    ) -> AsyncGenerator[Dict, None]:
        # EXECUTAR COMANDO DE DOWNLOAD
        
        # CONSTRUIR COMANDO
        cmd = CommandBuilder.build(method, url, str(output_file))
        
        logger.info(f"Executando: {' '.join(cmd)}")
        
        # INICIAR PROCESSO
        process = await asyncio.create_subprocess_exec(
            *cmd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE
        )
        
        last_progress = 0
        start_time = time.time()
        last_bytes = 0
        
        try:
            # LER STDERR EM TEMPO REAL (ONDE WGET/CURL ESCREVEM PROGRESSO)
            while True:
                # VERIFICAR CANCELAMENTO
                if cancel_event.is_set():
                    process.kill()
                    await process.wait()
                    yield {"type": "cancelled", "message": "Cancelado pelo usuário"}
                    return
                
                # LER LINHA COM TIMEOUT
                try:
                    line = await asyncio.wait_for(
                        process.stderr.readline(),
                        timeout=0.5
                    )
                except asyncio.TimeoutError:
                    # VERIFICAR SE PROCESSO AINDA ESTÁ VIVO
                    if process.returncode is not None:
                        break
                    continue
                
                if not line:
                    break
                
                line_str = line.decode('utf-8', errors='ignore').strip()
                
                # EXTRAIR PROGRESSO
                # wget: "... 45% ..."
                # curl: "######## 45.2%"
                percent_match = re.search(r'(\d+(?:\.\d+)?)%', line_str)
                if percent_match:
                    progress = int(float(percent_match.group(1)))
                    
                    # ENVIAR APENAS SE MUDOU SIGNIFICATIVAMENTE
                    if abs(progress - last_progress) >= 1:
                        elapsed = time.time() - start_time
                        
                        # CALCULAR VELOCIDADE (MB/s)
                        downloaded_gb = (progress / 100) * size_gb
                        downloaded_mb = downloaded_gb * 1024
                        
                        if elapsed > 0:
                            speed_mbps = downloaded_mb / elapsed
                        else:
                            speed_mbps = 0
                        
                        # CALCULAR ETA
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
            
            # AGUARDAR CONCLUSÃO DO PROCESSO
            await process.wait()
            
            # VERIFICAR RESULTADO
            if process.returncode == 0 and not cancel_event.is_set():
                yield {"type": "completed", "progress": 100, "method": method}
            elif not cancel_event.is_set():
                raise RuntimeError(f"Comando falhou com código {process.returncode}")
        
        finally:
            # GARANTIR QUE PROCESSO FOI TERMINADO
            if process.returncode is None:
                process.kill()
                await process.wait()
    
    async def cancel(self, model_id: str) -> bool:
        # CANCELAR DOWNLOAD
        if model_id not in self.active_downloads:
            return False
        
        cancel_event = self.active_downloads[model_id]
        cancel_event.set()
        
        # AGUARDAR LIMPEZA
        await asyncio.sleep(1)
        
        # LIMPAR ARQUIVOS .tmp
        temp_path = Path(self.config['temp_path'])
        for tmp_file in temp_path.glob("*.tmp"):
            try:
                tmp_file.unlink()
            except:
                pass
        
        logger.info(f"Download cancelado: {model_id}")
        return True

# INICIALIZAR MANAGER
manager = DownloadManager()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # STARTUP
    manager.load_config()
    yield
    # SHUTDOWN
    pass

# CRIAR APP
app = FastAPI(title="Model Download API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ROTAS
@app.get("/api/models")
async def list_models():
    """LISTA TODOS OS MODELOS"""
    try:
        models = manager.get_models()
        return {"success": True, "models": models}
    except Exception as e:
        logger.error(f"Erro ao listar: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/models/{model_id}/status")
async def model_status(model_id: str):
    """STATUS DE UM MODELO"""
    try:
        if not SecurityValidator.validate_model_id(model_id):
            raise HTTPException(status_code=400, detail="ID inválido")
        
        status = manager.get_model_status(model_id)
        return {"success": True, **status}
    
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Erro: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/models/{model_id}/download")
async def download_model(model_id: str):
    """BAIXAR MODELO VIA SSE"""
    try:
        if not SecurityValidator.validate_model_id(model_id):
            raise HTTPException(status_code=400, detail="ID inválido")
        
        async def event_stream():
            async for event in manager.download(model_id):
                # FORMATO SSE
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
        logger.error(f"Erro: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/models/{model_id}/download")
async def cancel_download(model_id: str):
    """CANCELAR DOWNLOAD"""
    try:
        if not SecurityValidator.validate_model_id(model_id):
            raise HTTPException(status_code=400, detail="ID inválido")
        
        success = await manager.cancel(model_id)
        
        return {
            "success": success,
            "message": "Cancelado" if success else "Nenhum download ativo"
        }
    
    except Exception as e:
        logger.error(f"Erro: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health():
    """HEALTH CHECK"""
    return {
        "status": "ok",
        "active_downloads": len(manager.active_downloads)
    }

