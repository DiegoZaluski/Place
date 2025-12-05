import os
import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(__file__))))
from ScryPy.Websocket import PROMPT_SYSTEM_PATH
def get_prompt_system(prompt): 
    try:
        with open(prompt, "r", encoding="utf-8") as f:
            content = f.read()
            return content
    except:
        return ""

print(f"Conteudo: {get_prompt_system(PROMPT_SYSTEM_PATH)}")