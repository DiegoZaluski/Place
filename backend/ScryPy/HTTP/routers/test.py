# NO ARQUIVO: HTTP/routers/test.py

import os
import sys

# Calcula a raiz do projeto (o diretório 'python')
# Vai de '.../python/HTTP/routers' -> '.../python/HTTP' -> '.../python'
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')) 

if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

# Agora, o pacote 'SQLite' é acessível
from SQLite.controlConfig import ControlConfig

print("Importação de ControlConfig bem-sucedida!")

# Se você precisar do logger do pacote HTTP
from HTTP import logger
logger.info("Teste do logger.")