import os 
import sys

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from controlConfig import ControlConfig

control = ControlConfig({"id_model":"deepseek-coder-6.7b-instruct.Q4_K_M.gguf"})
print(f"SELECT: {control.get()}")