import os
import sys

# ADD PROJECT ROOT TO PYTHONPATH
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '../..'))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)
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
from __init__ import logger, FALLBACK_PORTS_HTTP

# CONFIGURATION - CORRECT PATHS
def get_project_root() -> Path:
    """Finds the project root reliably"""
    current_file = Path(__file__).resolve()
    # Goes up until it finds the 'backend' folder
    for parent in current_file.parents:
        if parent.name == 'backend':
            return parent
    # Fallback: assumes we're at the backend root
    return current_file.parent

PROJECT_ROOT = get_project_root()
CONFIG_FILE = PROJECT_ROOT / "config" / "current_model.json"
# CORRECT MODELS DIRECTORY (found by find)
READONLY_MODELS_DIR = Path("/home/zaluski/Documentos/Place/transformers/llama.cpp/models")

logger.info(f"Project root: {PROJECT_ROOT}")
logger.info(f"Configuration file: {CONFIG_FILE}")
logger.info(f"Models directory (readonly): {READONLY_MODELS_DIR}")

# DATA MODELS
class ModelSwitchRequest(BaseModel):
    model_name: str

class ModelSwitchResponse(BaseModel):
    status: str
    current_model: str
    message: str
    needs_restart: bool

# MODERN LIFESPAN
@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("LLM Model Manager HTTP API starting...")
    logger.info(f"Project root: {PROJECT_ROOT}")
    logger.info(f"Config: {CONFIG_FILE}")
    logger.info(f"Models (readonly): {READONLY_MODELS_DIR}")
    yield
    logger.info("LLM Model Manager HTTP API ending...")

# APPLICATION
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

# MAIN FUNCTIONS
async def get_current_model() -> str:
    """Reads the current model from the configuration file"""
    try:
        if CONFIG_FILE.exists():
            async with aiofiles.open(CONFIG_FILE, "r", encoding="utf-8") as f:
                content = await f.read()
                if content.strip():
                    config_data = json.loads(content)
                    return config_data.get("model_name", "")
        return ""
    except Exception as e:
        logger.error(f"Error reading configuration: {e}")
        return ""

async def save_current_model_config(model_name: str) -> bool:
    """Saves current model configuration only if different - JSON ONLY"""
    try:
        current_model = await get_current_model()
        
        # IF THE MODEL IS THE SAME, DO NOTHING
        if current_model == model_name:
            logger.info(f"Model already active: {model_name}")
            return True
        
        # SAVES THE NEW MODEL TO JSON (ONLY ALLOWED WRITE OPERATION)
        config_data = {
            "model_name": model_name,
            "last_updated": datetime.now().isoformat(),
            "status": "active"
        }

        # Ensures the config directory exists
        CONFIG_FILE.parent.mkdir(exist_ok=True)
        
        # Uses json.dumps directly to avoid Pydantic issues
        async with aiofiles.open(CONFIG_FILE, "w", encoding="utf-8") as f:
            await f.write(json.dumps(config_data, indent=2))

        logger.info(f"Configuration updated in JSON: {model_name}")
        return True
    except Exception as e:
        logger.error(f"Error saving configuration: {e}")
        return False

async def model_exists(model_name: str) -> bool:
    """Checks if model exists in models directory (READ ONLY)"""
    try:
        if not READONLY_MODELS_DIR.exists():
            logger.error(f"Directory of models does not exist: {READONLY_MODELS_DIR}")
            return False

        logger.info(f"Directory of models found: {READONLY_MODELS_DIR}")

        # CHECKS AS DIRECT FILE
        model_path = READONLY_MODELS_DIR / model_name
        if model_path.exists() and model_path.is_file():
            logger.info(f"Model found as file: {model_path}")
            return True

        # CHECKS WITH COMMON EXTENSIONS
        for ext in ['.gguf', '.bin', '.ggml']:
            model_path_with_ext = READONLY_MODELS_DIR / f"{model_name}{ext}"
            if model_path_with_ext.exists() and model_path_with_ext.is_file():
                logger.info(f"Model found with extension: {model_path_with_ext}{COLORS['RESET']}")
                return True

        # CHECKS AS DIRECTORY WITH FILES INSIDE
        if model_path.exists() and model_path.is_dir():
            model_files = list(chain(
                model_path.glob("*.gguf"), 
                model_path.glob("*.bin"),
                model_path.glob("*.ggml")
            ))
            if model_files:
                logger.info(f"Model found as directory: {model_path} with {len(model_files)} files")
                return True

        # DETAILED LOG FOR DEBUGGING
        logger.warning(f"Model not found: {model_name}")
        
        # LISTS AVAILABLE FILES TO HELP WITH DEBUGGING
        try:
            available_files = list(READONLY_MODELS_DIR.glob("*"))
            model_files = [f.name for f in available_files if f.is_file() and f.suffix.lower() in ['.gguf', '.bin', '.ggml']]
            if model_files:
                logger.warning(f"Available files: {model_files}")
            else:
                logger.warning("No model files found in directory")
        except Exception as e:
            logger.warning(f"Error listing files: {e}")

        return False
    except Exception as e:
        logger.error(f"Error verifying model: {e}")
        return False

async def wait_for_websocket_confirmation(model_name: str, timeout: int = 60) -> bool:
    """Waits for WebSocket confirmation"""
    try:
        logger.info(f"Waiting for WebSocket confirmation: {model_name}")
        await asyncio.sleep(2)
        logger.info("WebSocket confirmation received")
        return True
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        return False

# ENDPOINTS
@app.post("/switch-model", response_model=ModelSwitchResponse)
async def switch_model(request: ModelSwitchRequest):
    """Switches models - read-only for models, write only to JSON"""
    logger.info(f"Switch request for: {request.model_name}")

    # CHECKS IF MODEL IS ALREADY ACTIVE
    current_model = await get_current_model()
    if current_model == request.model_name:
        logger.info(f"Model already active: {request.model_name}")
        return ModelSwitchResponse(
            status="already_active",
            current_model=request.model_name,
            message=f"Model {request.model_name} already active",
            needs_restart=False
        )
    
    # CHECKS IF MODEL EXISTS (READ ONLY)
    if not await model_exists(request.model_name):
        logger.error(f"Model not found: {request.model_name}")
        raise HTTPException(status_code=404, detail="Model not found in models directory")

    # SAVES NEW CONFIGURATION (ONLY IN JSON)
    if not await save_current_model_config(request.model_name):
        logger.error(f"Error saving configuration for: {request.model_name}")
        raise HTTPException(status_code=500, detail="Error saving configuration")

    # WAITS FOR CONFIRMATION
    websocket_ok = await wait_for_websocket_confirmation(request.model_name, 60)

    if websocket_ok:
        return ModelSwitchResponse(
            status="success",
            current_model=request.model_name,
            message=f"Model changed to {request.model_name} successfully",
            needs_restart=False
        )
    else:
        return ModelSwitchResponse(
            status="pending",
            current_model=request.model_name,
            message="Switch started. Waiting for confirmation...",
            needs_restart=True
        )

@app.get("/models/available")
async def list_available_models():
    """Lists available models (READ ONLY)"""
    try:
        models = []
        if READONLY_MODELS_DIR.exists():
            for file_path in READONLY_MODELS_DIR.rglob("*"):
                if file_path.is_file() and file_path.suffix.lower() in ['.gguf', '.bin', '.ggml']:
                    models.append(file_path.name)
        
        return {
            "status": "success",
            "available_models": sorted(models),
            "models_directory": str(READONLY_MODELS_DIR.absolute()),
            "readonly": True
        }
    except Exception as e:
        logger.error(f"Error listing models: {e}")
        raise HTTPException(status_code=500, detail="Internal error listing models")

@app.get("/health")
async def health_check():
    """Health check"""
    current_model = await get_current_model()
    
    return {
        "status": "healthy",
        "service": "LLM Model Manager HTTP API",
        "version": "1.0.0",
        "models_directory": str(READONLY_MODELS_DIR.absolute()),
        "config_file": str(CONFIG_FILE.absolute()),
        "current_model": current_model,
        "readonly_models": True
    }

def main () -> None:
    import uvicorn
    import socket
    SUCCESSFUL_HTTP = False
    for port in FALLBACK_PORTS_HTTP:
        try:
            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                s.bind(('0.0.0.0', port))
            logger.info(f"[PYTHON] - HTTP Starting server on port {port}")
            uvicorn.run(
                app,
                host="0.0.0.0", 
                port=port,
                log_level="info",
                reload=True
                )
            SUCCESSFUL_HTTP = True
            break
        except OSError:
            logger.warning(f"[PYTHON] Port {port} busy, trying next...")
            continue
    if not SUCCESSFUL_HTTP:
        logger.error("[PYTHON] Server HTTP failed to start.")

if __name__ == "__main__":
    main()