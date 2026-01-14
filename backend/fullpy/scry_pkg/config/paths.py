from pathlib import Path
from scry_pkg.utils import  setup_logging

logger =  setup_logging("scry_pkg.config.paths")

# scry_http
def get_project_root() -> Path:
    current_file = Path(__file__).resolve()
    for parent in current_file.parents:
        if parent.name == 'backend':
            return parent.parent
    return current_file.parent

PROJECT_ROOT = get_project_root()
CONFIG_FILE = PROJECT_ROOT / "backend" / "config" / "current_model.json"
PROMPT_SYSTEM = Path("/dev/shm/prompt_system.txt") or Path(os.getenv('TEMP', 'C:\\Windows\\Temp')) / "prompt_system.txt"
READONLY_MODELS_DIR = PROJECT_ROOT / "llama.cpp" / "models"

logger.info(f"Project root: {PROJECT_ROOT}")
logger.info(f"Configuration file: {CONFIG_FILE}")
logger.info(f"Models directory (readonly): {READONLY_MODELS_DIR}")

# scry_sse
possible_paths = [
    PROJECT_ROOT / "backend" / "config" / "models.json",
    PROJECT_ROOT / "config" / "models.json",
    Path("config") / "models.json",
    Path("..") / "config" / "models.json",
    Path("..") / ".." / "config" / "models.json",
    Path("models.json"),
    Path("..") / "models.json",
    Path("..") / "backend" / "config" / "models.json",
    Path("..") / ".." / "backend" / "config" / "models.json",
    Path("..") / ".." / ".." / "backend" / "config" / "models.json",
    Path("C:") / "Projetos" / "huglab" / "backend" / "config" / "models.json" or Path("..") / ".." / ".." / "backend" / "config" / "models.json",
    Path("C:") / "Projetos" / "huglab" / "config" / "models.json" or Path("..") / ".." / "config" / "models.json",
]
