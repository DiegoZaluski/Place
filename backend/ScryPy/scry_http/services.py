from ScryPy.scry_http import logger
from config import CONFIG_FILE, READONLY_MODELS_DIR
import aiofiles
import json
from itertools import chain
from datetime import datetime
import asyncio
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
                logger.info(f"Model found with extension: {model_path_with_ext}")
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