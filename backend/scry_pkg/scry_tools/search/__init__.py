from scry_pkg.utils import setup_logging
# LOGGING CONFIGURATION
logger = setup_logging('search_in_tools')

import re
import trafilatura
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

