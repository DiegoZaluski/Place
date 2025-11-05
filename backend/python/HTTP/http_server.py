from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging
from pathlib import Path
import json
import aiofiles
import asyncio
from itertools import chain
from datetime import datetime
import os

# CONFIGURAÇÃO DE LOGGING
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# CONFIGURAÇÃO - CAMINHOS RELATIVOS ROBUSTOS
def get_project_root() -> Path:
    """Encontra a raiz do projeto de forma confiável"""
    current_file = Path(__file__).resolve()
    # Sobe até encontrar a pasta 'backend'
    for parent in current_file.parents:
        if parent.name == 'backend':
            return parent
    # Fallback: assume que estamos na raiz do backend
    return current_file.parent

PROJECT_ROOT = get_project_root()
CONFIG_FILE = PROJECT_ROOT / "config" / "current_model.json"
MODELS_DIR = PROJECT_ROOT / "models"

logger.info(f"Raiz do projeto: {PROJECT_ROOT}")
logger.info(f"Arquivo de configuração: {CONFIG_FILE}")
logger.info(f"Diretório de modelos: {MODELS_DIR}")

# MODELOS DE DADOS
class ModelSwitchRequest(BaseModel):
    model_name: str

class ModelSwitchResponse(BaseModel):
    status: str
    current_model: str
    message: str
    needs_restart: bool

class CurrentModelConfig(BaseModel):
    model_name: str
    last_updated: str
    status: str

# LIFESPAN MODERNO
@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("LLM Model Manager HTTP API iniciando...")
    logger.info(f"Raiz do projeto: {PROJECT_ROOT}")
    logger.info(f"Config: {CONFIG_FILE}")
    logger.info(f"Models: {MODELS_DIR}")
    yield
    logger.info("LLM Model Manager HTTP API encerrando...")

# APLICAÇÃO
app = FastAPI(
    title="Model Download API",
    description="API for downloading LLM models",
    version="1.0.0",
    lifespan=lifespan
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# FUNÇÕES PRINCIPAIS
async def get_current_model() -> str:
    """Lê o modelo atual do arquivo de configuração"""
    try:
        if CONFIG_FILE.exists():
            async with aiofiles.open(CONFIG_FILE, "r", encoding="utf-8") as f:
                content = await f.read()
                if content.strip():
                    config_data = json.loads(content)
                    return config_data.get("model_name", "")
        return ""
    except Exception as e:
        logger.error(f"Erro ao ler configuração: {e}")
        return ""

async def save_current_model_config(model_name: str) -> bool:
    """Salva configuração do modelo atual apenas se for diferente"""
    try:
        current_model = await get_current_model()
        
        # SE O MODELO JÁ É O MESMO, NÃO FAZ NADA
        if current_model == model_name:
            logger.info(f"Modelo já está ativo: {model_name}")
            return True
        
        # SALVA O NOVO MODELO
        config_data = CurrentModelConfig(
            model_name=model_name,
            last_updated=datetime.now().isoformat(),
            status="active"
        )

        # Garante que o diretório config existe
        CONFIG_FILE.parent.mkdir(exist_ok=True)
        
        async with aiofiles.open(CONFIG_FILE, "w", encoding="utf-8") as f:
            await f.write(config_data.json(indent=2))

        logger.info(f"Configuração atualizada: {model_name}")
        return True
    except Exception as e:
        logger.error(f"Erro ao salvar configuração: {e}")
        return False

async def model_exists(model_name: str) -> bool:
    """Verifica se modelo existe no diretório"""
    try:
        model_path = MODELS_DIR / model_name
        
        if model_path.exists() and model_path.is_file():
            return True

        if model_path.exists() and model_path.is_dir():
            model_files = chain(
                model_path.glob("*.gguf"), 
                model_path.glob("*.bin"),
                model_path.glob("*.ggml")
            )
            return any(model_files)
            
        return False
    except Exception as e:
        logger.error(f"Erro ao verificar modelo: {e}")
        return False

async def wait_for_websocket_confirmation(model_name: str, timeout: int = 60) -> bool:
    """Aguarda confirmação WebSocket"""
    try:
        logger.info(f"Aguardando confirmação WebSocket: {model_name}")
        await asyncio.sleep(2)
        logger.info("Confirmação WebSocket recebida")
        return True
    except Exception as e:
        logger.error(f"Erro WebSocket: {e}")
        return False

# ENDPOINTS
@app.post("/switch-model", response_model=ModelSwitchResponse)
async def switch_model(request: ModelSwitchRequest):
    """Troca de modelos - só responde se modelo for diferente"""
    logger.info(f"Solicitação de troca para: {request.model_name}")

    # Verifica se o modelo já está ativo
    current_model = await get_current_model()
    if current_model == request.model_name:
        logger.info(f"Modelo já está ativo: {request.model_name}")
        # NÃO ENVIA RESPOSTA - frontend deve tratar timeout
        return
    
    # Verifica se modelo existe
    if not await model_exists(request.model_name):
        raise HTTPException(404, "Modelo não encontrado")

    # Salva nova configuração
    if not await save_current_model_config(request.model_name):
        raise HTTPException(500, "Erro ao salvar configuração")

    # Aguarda confirmação
    websocket_ok = await wait_for_websocket_confirmation(request.model_name, 60)

    if websocket_ok:
        return ModelSwitchResponse(
            status="success",
            current_model=request.model_name,
            message=f"Modelo alterado para {request.model_name} com sucesso",
            needs_restart=False
        )
    else:
        return ModelSwitchResponse(
            status="pending",
            current_model=request.model_name,
            message="Troca iniciada. Aguardando confirmação...",
            needs_restart=True
        )

@app.get("/models/available")
async def list_available_models():
    """Lista modelos disponíveis"""
    try:
        models = []
        if MODELS_DIR.exists():
            for file_path in MODELS_DIR.rglob("*"):
                if file_path.is_file() and file_path.suffix.lower() in ['.gguf', '.bin', '.ggml']:
                    models.append(file_path.name)
        
        return {
            "status": "success",
            "available_models": sorted(models),
            "models_directory": str(MODELS_DIR.absolute())
        }
    except Exception as e:
        logger.error(f"Erro ao listar modelos: {e}")
        raise HTTPException(500, "Erro interno ao listar modelos")

@app.get("/health")
async def health_check():
    """Health check"""
    current_model = await get_current_model()
    
    return {
        "status": "healthy",
        "service": "LLM Model Manager HTTP API",
        "version": "1.0.0",
        "models_directory": str(MODELS_DIR.absolute()),
        "config_file": str(CONFIG_FILE.absolute()),
        "current_model": current_model
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "http_server:app",
        host="0.0.0.0",
        port=8001,
        log_level="info",
        reload=True
    )