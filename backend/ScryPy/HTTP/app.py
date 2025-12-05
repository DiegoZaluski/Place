from ScryPy.HTTP import logger
from fastapi import FastAPI
from config import PROJECT_ROOT, CONFIG_FILE, READONLY_MODELS_DIR
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from ScryPy.HTTP.routers.switch_routers import switch_routers
from ScryPy.HTTP.routers.configs_routers import configs_routers 
from ScryPy.HTTP.routers.prompt_router import prompt_router

# MODERN LIFESPAN
@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("LLM Model Manager HTTP API starting...")
    logger.info(f"Project root: {PROJECT_ROOT}")
    logger.info(f"Config: {CONFIG_FILE}")
    logger.info(f"Models (readonly): {READONLY_MODELS_DIR}")

    import sys
    sys.stdout.flush()

    yield
    logger.info("LLM Model Manager HTTP API ending...")
    logger.info("BYE BYE! - BIBÍ") # HTTPServer.cjs: waiting for the final string.

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

# INCLUDE ROUTER
app.include_router(switch_routers)
app.include_router(configs_routers)
app.include_router(prompt_router)