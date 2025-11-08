#: Constants for ANSI colors
COLORS = {
    'RESET': '\033[0m',
    'RED': '\033[31m',
    'GREEN': '\033[32m',
    'YELLOW': '\033[33m',
    'BLUE': '\033[34m',
    'MAGENTA': '\033[35m',
    'CYAN': '\033[36m',
    'WHITE': '\033[37m'
}

BG_COLORS = {
    'RESET': '\033[49m',
    'RED': '\033[41m',
    'GREEN': '\033[42m',
    'YELLOW': '\033[43m',
    'BLUE': '\033[44m',
    'MAGENTA': '\033[45m',
    'CYAN': '\033[46m',
    'WHITE': '\033[47m'
}

# LOGGING CONFIGURATION
import logging
import sys

def setup_logging(name):
    logger = logging.getLogger(name)
    logger.setLevel(logging.INFO)

    class FormatLogger(logging.Formatter):
        def format(self,record):
            match record.levelno:
                case logging.INFO:
                    format_str = f"{COLORS['BLUE']}[INFO]: %(name)s {COLORS['RESET']}:%(message)s"
                case logging.WARNING:
                    format_str = f"{COLORS['YELLOW']}[WARNING]: %(name)s {COLORS['RESET']}:%(message)s"
                case logging.ERROR:
                    format_str = f"{COLORS['RED']}[ERROR]: %(name)s {COLORS['RESET']}:%(message)s"
            formatter = logging.Formatter(format_str)
            return formatter.format(record)

    format_logger = FormatLogger()

    stdout_handler = logging.StreamHandler(sys.stdout)
    stdout_handler.setLevel(logging.INFO)
    stdout_handler.addFilter(lambda record: record.levelno < logging.ERROR)
    stdout_handler.setFormatter(format_logger)
    
    stderr_handler = logging.StreamHandler(sys.stderr)
    stderr_handler.setLevel(logging.ERROR)
    stderr_handler.setFormatter(format_logger)
    
    logger.addHandler(stdout_handler)
    logger.addHandler(stderr_handler)

    return logger