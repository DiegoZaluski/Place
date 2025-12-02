from ScryPy.HTTP import logger
from fastapi import APIRouter, HTTPException
from ScryPy.SQLite.controlConfig import ControlConfig

# CREATE INSTANCE
configsRouters = APIRouter(prefix="/configs")

# ENDPOINTS
@configsRouters.get("/{id_model}")
async def getConfigs(id_model:str) -> dict:
    control = ControlConfig({"id_model":id_model})
    if not control.get():
        raise HTTPException(status_code=400, detail="Config not found")
    return control.get()

@configsRouters.post("/")
async def setConfigs(body:dict ) -> dict:
    control = ControlConfig(body) 
    if not control.add():
        raise HTTPException(status_code=400, detail="Config not found")
    return {"status": "OK"}

@configsRouters.patch("/")
async def updateConfigs(body:dict) -> dict:
    control = ControlConfig(body) 
    if not control.update():
        raise HTTPException(status_code=400, detail="Config not found")
    return {"status": "OK"}

@configsRouters.delete("/{id_model}")
async def deleteConfigs(id_model:str) -> dict:
    control = ControlConfig({"id_model":id_model})
    if not control.delete():
        raise HTTPException(status_code=400, detail="Config not found")
    return {"status": "OK"}
