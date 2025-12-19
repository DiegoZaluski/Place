from scry_pkg.scry_http import logger
from pydantic import BaseModel
class ModelSwitchRequest(BaseModel):
    model_name: str

class ModelSwitchResponse(BaseModel):
    status: str
    current_model: str
    message: str
    needs_restart: bool