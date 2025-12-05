"""Model settings for the Websocket package"""
import os
import sys
import json
from pathlib import Path

# ADD PROJECT ROOT TO PYTHONPATH
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)
from utilsPy import setup_logging

# LOGGER CONFIGURATION
logger = setup_logging('WEBSOCKET_Server')

# FORMAT TO CHAT MODEL 
MODEL_FORMATS = {
    "Meta-Llama-3.1-8B-Instruct-Q4_K_M.gguf": "llama-3",
    "mistral-7b-instruct-v0.3.Q4_K_M.gguf": "mistral-instruct",
    "qwen2.5-7b-instruct.Q4_K_M.gguf": "chatml",
    "llama-3.1-8b-instruct.Q4_K_M.gguf": "llama-3", 
    "deepseek-coder-6.7b-instruct.Q4_K_M.gguf": "chatml",
    "phi-3-mini-4k-instruct.Q4_K_M.gguf": "chatml"
}

def load_config():
    """Loads JSON configuration"""
    
    # PATH IS SIMILAR TO YOUR EXAMPLE
    current_file = Path(__file__).resolve()
    config_path = current_file.parent.parent.parent / "config" / "current_model.json"
    
    if not config_path.exists():
        raise FileNotFoundError(f"Configuration file not found: {config_path}")
    
    with open(config_path, 'r') as f:
        config = json.load(f)
    
    model_name = config.get("model_name")
    name_of_model = config.get("model_name")
    if not model_name:
        raise ValueError("model_name not found in JSON")
    
    # PATH IS SIMILAR TO YOUR EXAMPLE
    model_path = f"../transformers/llama.cpp/models/{model_name}"
    
    # GET THE CORRECT FORMAT
    chat_format = MODEL_FORMATS.get(model_name, "chatml")
    
    return {
        "model_path": model_path,
        "chat_format": chat_format,
        "name_of_model": name_of_model
    }

# LOAD CONFIGURATION
try:
    CONFIG = load_config()
    MODEL_PATH = CONFIG["model_path"]
    CHAT_FORMAT = CONFIG["chat_format"]
    NAME_OF_MODEL = CONFIG["name_of_model"]
except Exception as e:
    logger.error(f"[INIT] FATAL ERROR loading config: {e}")
    raise

PROMPT_SYSTEM_PATH = Path("/dev/shm/prompt_system.txt")

# PORTS
FALLBACK_PORTS_WEBSOCKET = [8765, 8766, 8767, 8768, 8769, 8770, 8771, 8772]
