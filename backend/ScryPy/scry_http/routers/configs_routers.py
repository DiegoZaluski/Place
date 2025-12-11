from ScryPy.scry_http import logger
from fastapi import APIRouter, HTTPException
from ScryPy.scry_sqlite.control_config import ControlConfig

configs_routers = APIRouter(prefix="/configs")

# ENDPOINTS
@configs_routers.get("/{id_model}")
async def getConfigs(id_model:str) -> dict:
    control = ControlConfig({"id_model":id_model})
    if not control.get():
        raise HTTPException(status_code=404, detail="Config not found")
    return control.get()

@configs_routers.post("/")
async def setConfigs(body:dict ) -> dict:
    control = ControlConfig(body) 
    if not control.add():
        raise HTTPException(status_code=400, detail="Config not found")
    return {"status": "OK"}

@configs_routers.patch("/")
async def updateConfigs(body:dict) -> dict:
    logger.info(f'Objto to update: {body}')
    control = ControlConfig(body) 
    if not control.update():
        raise HTTPException(status_code=400, detail="Config not found")
    return {"status": "OK"}

@configs_routers.delete("/{id_model}")
async def deleteConfigs(id_model:str) -> dict:
    control = ControlConfig({"id_model":id_model})
    if not control.delete():
        raise HTTPException(status_code=400, detail="Config not found")
    return {"status": "OK"}
