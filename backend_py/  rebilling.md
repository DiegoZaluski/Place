``` python

import asyncio 
import json 
import uuid
from typing import Dict, List, Set, Any, Optional
from llama_cpp import Llama, LlamaCache # para controle de cache temperatura otimização de nucleos de processamentos, contexto e muito mais 
import websockets
import websockets.exeptions import ConnectionClosedOK

CONTEXT_SIZE = 4096 # TAMANHO DO CONTEXTO: recebera valor futuramente via function externa
MODEL_PATH = "../transformers/llama.cpp/models/llama-2-7b-chat.Q4_K_M.gguf" 

```

## ajuste garantir que o moelo esteja carregado antes do usuario abrir o chat de conversar para evitar mal entendidos 