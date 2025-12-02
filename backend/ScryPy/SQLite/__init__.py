import os
import sys
# ADD PROJECT ROOT TO PYTHONPATH
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)
from ScryPy.utilsPy import setup_logging
# LOGGING CONFIGURATION
logger = setup_logging('SQLite')


# WHITE LIST SQL
ID_MODEL_WHITELIST = {
    # MISTRAL
    "mistral-7b-instruct-v0.1.Q4_K_M.gguf", "mistral-7b-instruct-v0.2.Q4_K_M.gguf",
    "mistral-7b-instruct-v0.3.Q4_K_M.gguf", "mistral-7b-openorca.Q4_K_M.gguf",
    "mistral-7b-v0.1.Q4_K_M.gguf", "mistral-7b-v0.2.Q4_K_M.gguf",
    
    # LLAMA 3.1
    "llama-3.1-8b-instruct.Q4_K_M.gguf", "llama-3.1-8b-instruct.Q5_K_M.gguf", 
    "llama-3.1-8b-instruct.Q6_K.gguf", "llama-3.1-8b-instruct.Q8_0.gguf",
    "llama-3.1-70b-instruct.Q4_K_M.gguf", "llama-3.1-405b-instruct.Q4_K_M.gguf",
    
    # LLAMA 3
    "llama-3-8b-instruct.Q4_K_M.gguf", "llama-3-8b-instruct.Q5_K_M.gguf",
    "llama-3-8b-instruct.Q6_K.gguf", "llama-3-8b-instruct.Q8_0.gguf", 
    "llama-3-70b-instruct.Q4_K_M.gguf", "llama-3-70b-instruct.Q5_K_M.gguf",
    "Llama-3.2-3B-Instruct-Q4_K_M.gguf",
    
    # LLAMA 2
    "llama-2-7b-chat.Q4_K_M.gguf", "llama-2-13b-chat.Q4_K_M.gguf",
    "llama-2-70b-chat.Q4_K_M.gguf", "llama-2-7b.Q4_K_M.gguf",
    
    # QWEN 2.5
    "qwen2.5-7b-instruct.Q4_K_M.gguf", "qwen2.5-7b-instruct.Q5_K_M.gguf",
    "qwen2.5-7b-instruct.Q6_K.gguf", "qwen2.5-14b-instruct.Q4_K_M.gguf",
    "qwen2.5-72b-instruct.Q4_K_M.gguf", "qwen2.5-coder-7b-instruct.Q4_K_M.gguf",
    
    # ZEPHYR
    "zephyr-7b-beta.Q4_K_M.gguf", "zephyr-7b-beta.Q5_K_M.gguf",
    "zephyr-7b-beta.Q6_K.gguf", "zephyr-7b-alpha.Q4_K_M.gguf",
    
    # NEURAL-CHAT
    "neural-chat-7b-v3-3.Q4_K_M.gguf", "neural-chat-7b-v3-2.Q4_K_M.gguf",
    "neural-chat-7b-v3-1.Q4_K_M.gguf", "neural-chat-7b-v3-0.Q4_K_M.gguf",
    
    # OPENCHAT
    "openchat-3.6-8b-20240522.Q4_K_M.gguf", "openchat-3.5-1210.Q4_K_M.gguf",
    "openchat-3.5-0106.Q4_K_M.gguf",
    
    # DOLPHIN
    "dolphin-2.9-llama-3-8b.Q4_K_M.gguf", "dolphin-2.8-mistral-7b-v02.Q4_K_M.gguf",
    "dolphin-2.7-mixtral-8x7b.Q4_K_M.gguf", "dolphin-2.6-mistral-7b.Q4_K_M.gguf",
    
    # CODING MODELS
    "codellama-7b-instruct.Q4_K_M.gguf", "codellama-13b-instruct.Q4_K_M.gguf", 
    "codellama-34b-instruct.Q4_K_M.gguf", "deepseek-coder-6.7b-instruct.Q4_K_M.gguf",
    "deepseek-coder-33b-instruct.Q4_K_M.gguf", "codegemma-7b-it.Q4_K_M.gguf",
    
    # MIXTRAL
    "mixtral-8x7b-instruct-v0.1.Q4_K_M.gguf", "mixtral-8x7b-instruct-v0.1.Q5_K_M.gguf",
    "mixtral-8x7b-instruct-v0.1.Q6_K.gguf", "mixtral-8x22b-instruct-v0.1.Q4_K_M.gguf",
    
    # PHI-3
    "phi-3-medium-4k-instruct.Q4_K_M.gguf", "phi-3-small-8k-instruct.Q4_K_M.gguf",
    "phi-3-mini-4k-instruct.Q4_K_M.gguf", "phi-3-vision-128k-instruct.Q4_K_M.gguf",
    
    # YI
    "yi-1.5-9b-chat.Q4_K_M.gguf", "yi-1.5-34b-chat.Q4_K_M.gguf",
    "yi-1.5-6b-chat.Q4_K_M.gguf",
    
    # GROK (se disponível)
    "grok-1-beta.Q4_K_M.gguf", "grok-1-beta.Q5_K_M.gguf",
    
    # CLOUD MODELS (sem .gguf)
    "gpt-4", "gpt-4-turbo", "gpt-4o", "gpt-4o-mini", "gpt-3.5-turbo",
    "claude-3-5-sonnet-20240620", "claude-3-opus-20240229", "claude-3-haiku-20240307",
    "gemini-1.5-pro", "gemini-1.5-flash", "deepseek-chat", "deepseek-coder"
}

