from ScryPy.scry_http import logger
from pathlib import Path
from pydantic import BaseModel

# CONFIGURATION 
def get_project_root() -> Path:
    """Finds the project root reliably"""
    current_file = Path(__file__).resolve()
    for parent in current_file.parents:
        if parent.name == 'backend':
            return parent
    # Fallback
    return current_file.parent

PROJECT_ROOT = get_project_root()
CONFIG_FILE = PROJECT_ROOT / "config" / "current_model.json"
PROMPT_SYSTEM = Path("/dev/shm/prompt_system.txt")  #temp
# CORRECT MODELS DIRECTORY (found by find)
READONLY_MODELS_DIR = Path("/home/zaluski/Documentos/Scry/llama.cpp/models")

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

