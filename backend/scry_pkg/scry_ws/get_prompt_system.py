from scry_pkg.scry_ws import PROMPT_SYSTEM_PATH
def get_prompt_system(prompt): 
    try:
        with open(prompt, "r", encoding="utf-8") as f:
            content = f.read()
            return content
    except:
        return ""

print(f"Conteudo: {get_prompt_system(PROMPT_SYSTEM_PATH)}")