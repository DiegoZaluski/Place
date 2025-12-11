# LOGGING CONFIGURATION
import logging
import sys
import os
import re
import trafilatura

def setup_logging(name, config=None):
    """
    Initialize and configure logger with optional custom settings.
    Maintains backward compatibility while allowing extended control.
    """
    logger = logging.getLogger(name)
    
    default_config = {
        'level': logging.INFO,
        'colors': COLORS,
        'format_style': 'legacy'
    }
    
    # MERGE USER CONFIGURATION IF PROVIDED
    if config:
        default_config.update(config)
    
    cfg = default_config
    logger.setLevel(cfg['level'])

    class FormatLogger(logging.Formatter):
        """Custom formatter supporting both legacy and extended formats."""
        
        def format(self, record):
            colors = cfg['colors']
            
            if cfg['format_style'] == 'legacy':
                match record.levelno:
                    case logging.INFO:
                        format_str = f"{colors['BLUE']}[INFO]: %(name)s {colors['RESET']}:%(message)s"
                    case logging.WARNING:
                        format_str = f"{colors['YELLOW']}[WARNING]: %(name)s {colors['RESET']}:%(message)s"
                    case logging.ERROR:
                        format_str = f"{colors['RED']}[ERROR]: %(name)s {colors['RESET']}:%(message)s"
            else:
                format_str = self._get_custom_format(record, colors, cfg)
            
            formatter = logging.Formatter(format_str)
            return formatter.format(record)
        
        def _get_custom_format(self, record, colors, cfg):
            """Generate custom format string based on configuration."""
            level_name = record.levelname
            color = colors.get(level_name, colors['RESET'])
            
            # BUILD FORMAT STRING DYNAMICALLY BASED ON CONFIGURATION
            format_parts = []
            
            # ADD TIMESTAMP IF REQUESTED
            if cfg.get('show_timestamp'):
                timestamp_color = colors.get('GRAY', colors['RESET'])
                format_parts.append(f"{timestamp_color}[%(asctime)s]{colors['RESET']}")
            
            # ADD LOG LEVEL AND NAME
            format_parts.append(f"{color}[{level_name}]: %(name)s {colors['RESET']}:%(message)s")
            
            return ' '.join(format_parts)

    format_logger = FormatLogger()

    stdout_level = cfg.get('stdout_level', logging.INFO)
    stderr_level = cfg.get('stderr_level', logging.ERROR)
    
    stdout_handler = logging.StreamHandler(sys.stdout)
    stdout_handler.setLevel(stdout_level)
    stdout_handler.addFilter(lambda record: record.levelno < stderr_level)
    stdout_handler.setFormatter(format_logger)
    
    stderr_handler = logging.StreamHandler(sys.stderr)
    stderr_handler.setLevel(stderr_level)
    stderr_handler.setFormatter(format_logger)
    
    logger.handlers.clear()
    
    logger.addHandler(stdout_handler)
    logger.addHandler(stderr_handler)
    
    # OPTIONAL PROPAGATION CONTROL
    if cfg.get('propagate') is not None:
        logger.propagate = cfg['propagate']
    
    return logger

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
def cleanPage(html_content: str) -> str:
    """
    Clean extracted page content by fixing common encoding issues and removing unwanted elements.
    
    Args:
        html_content: Raw HTML content to be cleaned
        
    Returns:
        str: Cleaned text content with encoding issues fixed and unwanted elements removed
    """
    if not html_content:
        return ""
    
    content = trafilatura.extract(html_content) if html_content else ""
    if not content:
        return ""
    
    encoding_fixes = [
        (r'Ã¡', 'á'), (r'Ã©', 'é'), (r'Ã­', 'í'), (r'Ã³', 'ó'), (r'Ãº', 'ú'),
        (r'Ã£', 'ã'), (r'Ãµ', 'õ'), (r'Ã§', 'ç'), (r'Ã¢', 'â'), (r'Ãª', 'ê'),
        (r'Ã´', 'ô'), (r'Ã ', 'à'), (r'Â°', '°'), (r'â', '-'), (r'â', '"'),
        (r'â', '"'), (r'â¦', '...')
    ]
    
    for wrong, correct in encoding_fixes:
        content = re.sub(wrong, correct, content)
    
    # Remove common comment markers and brackets
    content = re.sub(r'\[\s*\.\.\.\s*\]', '', content)
    content = re.sub(r'\[\d+\s*Comments?\]', '', content, flags=re.IGNORECASE)
    
    # Clean table formatting
    content = re.sub(r'\|\s*', ' ', content)
    content = re.sub(r'\s*\|', ' ', content)
    
    # Normalize whitespace
    content = re.sub(r'\n\s*\n\s*\n+', '\n\n', content)
    content = re.sub(r'\s+', ' ', content)
    
    content = re.sub(r'\[(\d+)\]', r'\1', content)
    content = re.sub(r'\[\]', '', content)
    content = re.sub(r'\s+', ' ', content)
    content = re.sub(r'\s+(\d+)\s+', r' \1 ', content)

    return content.strip()

logger = setup_logging('utils_in_ScryPy')