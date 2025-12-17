from scry_pkg.scry_http import logger, FALLBACK_PORTS_HTTP
from app import app
import uvicorn
import socket

def main () -> None:
    SUCCESSFUL_HTTP = False
    for port in FALLBACK_PORTS_HTTP:
        try:
            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                s.bind(('0.0.0.0', port))
            logger.info(f"[PYTHON] - HTTP Starting server on port {port}")
            uvicorn.run(
                app,
                host="0.0.0.0", 
                port=port,
                log_level="info",
                reload=True
                )
            SUCCESSFUL_HTTP = True
            break
        except OSError:
            logger.warning(f"[PYTHON] Port {port} busy, trying next...")
            continue
    if not SUCCESSFUL_HTTP:
        logger.error("[PYTHON] Server HTTP failed to start.")

if __name__ == "__main__":
    main()