import os
import sys
# ADD PROJECT ROOT TO PYTHONPATH
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '../..'))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)
from ScryPy.utils import setup_logging
# LOGGING CONFIGURATION
logger = setup_logging('HTTP_Server')

FALLBACK_PORTS_HTTP = [ 8001, 8002, 8003, 8004, 8005, 8006, 8007, 8008, 8009, 8010, 8011, 8012]