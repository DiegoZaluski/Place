import os
import sys
# ADD PROJECT ROOT TO PYTHONPATH
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '../..'))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)
from python import setup_logging
# LOGGING CONFIGURATION
logger = setup_logging('Agent_Orchestrator')

import re

import re

import re

def cleanPage(content: str) -> str:
    """
    Ultra-robust webpage text cleaner removing all technical noise.
    Preserves only meaningful content for LLM processing.
    """
    if not content:
        return ""

    # Remove HTML tags but preserve content
    content = re.sub(r'<[^>]*>', ' ', content)
    
    # Technical patterns that should be removed
    technical_patterns = [
        # Code and scripts
        r'\{[^}]*\}',
        r'\[[^\]]*\]',
        r'console\.\w+\([^)]*\)',
        r'document\.\w+',
        r'window\.\w+',
        r'addEventListener\([^)]*\)',
        r'\.(?:push|addEventListener|setAttribute|getElementById|querySelector)',
        r'(?:function|var|const|let)\s+\w+',
        
        # HTTP and APIs
        r'(?:POST|GET|PUT|DELETE|PATCH|HEAD|OPTIONS)\b',
        r'(?:application/json|text/html|utf-8|charset)',
        r'(?:method|Content-Type|Authorization|Bearer|X-CSRF|Accept-Encoding)\s*[:=]',
        
        # CSS and styling
        r'\([^)]*min-width[^)]*\)',
        r'\([^)]*max-width[^)]*\)',
        r'(?:min-width|max-width|font-size|margin|padding|display|flex|grid|color|background)',
        r'px|em|rem|vh|vw|%',
        r'#[0-9a-f]{3,6}\b',
        r'rgba?\([^)]*\)',
        r'url\([^)]*\)',
        
        # URLs and domains
        r'https?://[^\s)}\]]*',
        r'www\.[^\s)}\]]*',
        r'data:image[^;]*;[^\s)},]*',
        # r'\.(?:com|org|net|io|co|br|tv|app|dev|ai|gg)(?=/|$)',
        
        # Event handlers and tracking
        r'(?:onclick|onload|onready|onmouseover|onerror)\s*=',
        r'(?:gtag|ga\(|_gaq|fbq|mixpanel|amplitude|track)',
        r'(?:localStorage|sessionStorage|indexedDB|cookie)',
        
        # JavaScript patterns
        r'JSON\.(?:parse|stringify)',
        r'typeof\s+\w+',
        r'instanceof\s+\w+',
        r'\.(?:map|filter|reduce|forEach|find|some|every)',
        r'(?:if|else|for|while|switch|case|break|continue|return)\b',
        r'\$\(.*?\)',
        r'jQuery\([^)]*\)',
        r'async\s+function',
        r'await\s+\w+',
        r'Promise\.(?:all|race|resolve|reject)',
        r'\.then\(|\.catch\(|\.finally\(',
        
        # Logging and errors
        r'(?:error|warning|info|debug|log)(?:\s*:|:)',
        
        # UI elements and loading states
        r'(?:Carregando|Loading|Please wait|Aguarde)',
        r'(?:publicidade|advertisement|anúncio|sponsored|promotional)',
        
        # HTTP status codes
        r'\b(?:404|500|503|401|403)\b',
        
        # Legal and symbols
        r'©.*?(?=\n|$)',
        r'℠|™|®',
    ]
    
    for pattern in technical_patterns:
        content = re.sub(pattern, ' ', content, flags=re.IGNORECASE | re.DOTALL)
    
    # Normalize line endings
    content = content.replace('\r', '')
    lines = content.split('\n')
    cleaned_lines = []
    
    # Navigation and noise keywords (less aggressive)
    nav_keywords = [
        'sidebar', 'navbar', 'toggle', 'footer', 'copyright', 'all rights reserved',
        'ver tambem', 'see also', 'expandir', 'expand', 'menu', 'search', 'busca',
        'início', 'home', 'voltar', 'back', 'sign up', 'criar conta', 'faça login',
        'cookie', 'skip to', 'pular para', 'ir para', 'go to', 'newsletter',
        'subscribe', 'inscreva-se', 'follow us', 'nos siga', 'compartilhe', 'share',
        'like us', 'curta', 'comentarios', 'comments', 'mw-parser-output'
    ]
    
    # CSS patterns that indicate styling noise
    css_patterns = [
        'min-width', 'max-width', 'font-size', 'line-height', 'text-align',
        'display', 'position', 'margin', 'padding', 'border', 'background',
        'color', 'z-index', 'transform', 'transition', 'animation'
    ]
    
    for line in lines:
        line = line.strip()
        
        if not line:
            continue
        
        # Skip lines that are only symbols
        if re.match(r'^[^a-zA-Z0-9\s]{5,}$', line):
            continue
        
        # Skip lines with no meaningful content
        if re.match(r'^[\s\d\W]*$', line):
            continue
        
        # Check if line is garbage (less aggressive)
        is_garbage = (
            # Lines with very low text density
            (len(re.findall(r'[a-zA-Z0-9]', line)) < 0.15 * len(line)) or
            # Very short lines with few words
            (len(line) < 12 and len(line.split()) < 3) or
            # Contains navigation keywords
            any(keyword in line.lower() for keyword in nav_keywords) or
            # Contains CSS patterns
            any(pattern in line.lower() for pattern in css_patterns) or
            # Code-like patterns
            line.startswith(('{', '}', '[', ']', '(', ')', '//', '/*', '*', ';', ',', '.', '#')) or
            # Technical patterns in content
            any(keyword in line for keyword in ['addEventListener', 'console.', 'document.', 'window.', 'function(', 'var ', 'const ', 'let ', '$(', 'jQuery', 'async', 'await', '.then', '.catch', 'Promise'])
        )
        
        # Check if line is meaningful content (more permissive)
        is_content = (
            len(line) > 8 and 
            len(re.findall(r'[a-zA-ZÀ-ÿ]{2,}', line)) >= 2 and
            not line.isupper()  # Skip ALL CAPS lines which are often headers
        )
        
        if is_content and not is_garbage:
            cleaned_lines.append(line)
    
    content = '\n'.join(cleaned_lines)
    
    # Remove footer sections
    footer_keywords = [
        'references', 'bibliograf', 'see also', 'notes', 'further read',
        'citations', 'external links', 'ver tambem', 'leia mais', 'fonte',
        'sources', 'referências', 'leia também'
    ]
    
    paragraphs = content.split('\n\n')
    cleaned_paragraphs = []
    found_footer_marker = False
    
    for paragraph in reversed(paragraphs):
        paragraph_text = paragraph.strip()
        if any(keyword in paragraph_text.lower() for keyword in footer_keywords) and len(paragraph_text) < 150:
            found_footer_marker = True
            continue 
        
        if not found_footer_marker:
            cleaned_paragraphs.insert(0, paragraph)
    
    content = '\n\n'.join(cleaned_paragraphs)
    
    # Final cleanup
    content = re.sub(r'[↑↓←→•«»©®™§¶†‡℠℃℉°]', ' ', content)
    content = re.sub(r'\n\s*\n+', '\n\n', content)
    content = re.sub(r'[ \t]+', ' ', content)
    content = re.sub(r'\s([.,;?!])', r'\1', content)
    
    return content.strip()