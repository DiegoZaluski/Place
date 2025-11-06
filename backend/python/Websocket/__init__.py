# __init__.py
"""Model settings for the Websocket package"""
import json
import os
from pathlib import Path

# FORMAT MAPPING
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
    
    # Caminho relativo: saindo de python/Websocket para ../config/
    current_file = Path(__file__).resolve()
    config_path = current_file.parent.parent.parent / "config" / "current_model.json"
    
    if not config_path.exists():
        raise FileNotFoundError(f"Configuration file not found: {config_path}")
    
    with open(config_path, 'r') as f:
        config = json.load(f)
    
    model_name = config.get("model_name")
    if not model_name:
        raise ValueError("model_name not found in JSON")
    
    # Caminho relativo igual ao seu exemplo
    model_path = f"../transformers/llama.cpp/models/{model_name}"
    
    # GET THE CORRECT FORMAT
    chat_format = MODEL_FORMATS.get(model_name, "chatml")
    
    return {
        "model_path": model_path,
        "chat_format": chat_format
    }

# LOAD CONFIGURATION
try:
    CONFIG = load_config()
    MODEL_PATH = CONFIG["model_path"]
    CHAT_FORMAT = CONFIG["chat_format"]
except Exception as e:
    print(f"[INIT] FATAL ERROR loading config: {e}")
    raise

print(f"[INIT] Model path: {MODEL_PATH}")
print(f"[INIT] Chat format: {CHAT_FORMAT}")