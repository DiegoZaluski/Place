import os
import sys
# ADD PROJECT ROOT TO PYTHONPATH
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../..'))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)
from python import setup_logging
# LOGGING CONFIGURATION
logger = setup_logging('HTTP_Server/routers')