from ScryPy.scry_http import logger
from fastapi import APIRouter, HTTPException
from config import CONFIG_FILE, READONLY_MODELS_DIR, ModelSwitchResponse, ModelSwitchRequest  
from services import get_current_model, model_exists, save_current_model_config, wait_for_websocket_confirmation  

# switchRouters
switch_routers = APIRouter()
@switch_routers.post("/switch-model", response_model=ModelSwitchResponse)

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

@switch_routers.get("/models/available")
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

@switch_routers.get("/health")
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