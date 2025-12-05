from fastapi import APIRouter, HTTPException, Body
from HTTP.config import PROMPT_SYSTEM
import aiofiles

prompt_router = APIRouter(prefix="/prompt_system")

@prompt_router.get("")
async def get_prompt_system():
    try:
        async with aiofiles.open(PROMPT_SYSTEM, "r", encoding="utf-8") as f:
            content = await f.read()
            return {"prompt_system": content}
    except FileNotFoundError:
        return {"prompt_system": ""}
    
@prompt_router.post("")
async def set_prompt_system(prompt: str = Body(...)):
    if len(prompt) > 1000:
        raise HTTPException(status_code=400, detail="Prompt system too long")
    
    try:
        async with aiofiles.open(PROMPT_SYSTEM, "w", encoding="utf-8") as f:
            await f.write(prompt)
        return {"status": "OK"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
