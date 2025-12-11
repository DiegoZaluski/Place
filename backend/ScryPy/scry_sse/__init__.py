import os
import sys
# ADD PROJECT ROOT TO PYTHONPATH
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '../..'))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)
from ScryPy.utils import setup_logging
# LOGGING CONFIGURATION
logger = setup_logging('SSE_Server')

FALLBACK_PORTS_SSE = [ 8080, 8081, 8082, 8083, 8084, 8085, 8086, 8087, 8088, 8089, 8090]