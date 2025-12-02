from ScryPy.HTTP import logger
from pathlib import Path
from pydantic import BaseModel

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

