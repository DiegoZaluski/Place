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

    content = re.sub(r'<[^>]*>', ' ', content)
    
    technical_patterns = [
        r'\{[^}]*\}',
        r'\[[^\]]*\]',
        r'\([^)]*min-width[^)]*\)',
        r'\([^)]*max-width[^)]*\)',
        r'[a-z-]+="[^"]*"',
        r'&\w+;',
        r'/\*[^*]*\*/',
        r'console\.\w+\([^)]*\)',
        r'document\.\w+',
        r'window\.\w+',
        r'addEventListener\([^)]*\)',
        r'push\([^)]*\)',
        r'@(?:keyframes|media|import|supports)',
        r'\.(?:push|addEventListener|setAttribute|getElementById|querySelector)',
        r'(?:function|var|const|let)\s+\w+',
        r'(?:POST|GET|PUT|DELETE|PATCH|HEAD|OPTIONS)\b',
        r'(?:application/json|text/html|utf-8|charset)',
        r'(?:method|Content-Type|Authorization|Bearer|X-CSRF|Accept-Encoding)\s*[:=]',
        r'(?:min-width|max-width|font-size|margin|padding|display|flex|grid|color|background)',
        r'px|em|rem|vh|vw|%',
        r'https?://[^\s)}\]]*',
        r'www\.[^\s)}\]]*',
        r'data:image[^;]*;[^\s)},]*',
        r'#[0-9a-f]{3,6}\b',
        r'rgba?\([^)]*\)',
        r'url\([^)]*\)',
        r'\.(?:com|org|net|io|co|br|tv|app|dev|ai|gg)(?=/|$)',
        r'(?:onclick|onload|onready|onmouseover|onerror)\s*=',
        r'(?:gtag|ga\(|_gaq|fbq|mixpanel|amplitude|track)',
        r'(?:localStorage|sessionStorage|indexedDB|cookie)',
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
        r'(?:error|warning|info|debug|log)(?:\s*:|:)',
        r'(?:Carregando|Loading|Please wait|Aguarde)',
        r'(?:publicidade|advertisement|anúncio|sponsored|promotional)',
        r'\b(?:404|500|503|401|403)\b',
        r'©.*?(?=\n|$)',
        r'℠|™|®',
    ]
    
    for pattern in technical_patterns:
        content = re.sub(pattern, ' ', content, flags=re.IGNORECASE | re.DOTALL)
    
    content = content.replace('\r', '')
    lines = content.split('\n')
    cleaned_lines = []
    
    nav_keywords = r'(mw-parser-output|sidebar|navbar|toggle|footer|copyright|all rights reserved|ver tambem|see also|expandir|expand|menu|search|busca|início|home|voltar|back|sign up|criar conta|faça login|cookie|localStorage|sessionStorage|skip to|pular para|ir para|go to|newsletter|subscribe|inscreva-se|follow us|nos siga|compartilhe|share|like us|curta|comentarios|comments)'
    
    css_patterns = r'(min-width|max-width|font-size|line-height|text-align|display|position|margin|padding|border|background|color|z-index|transform|transition|animation)'
    
    for line in lines:
        line = line.strip()
        
        if not line:
            continue
        
        if re.match(r'^[^a-zA-Z0-9\s]{5,}$', line):
            continue
        
        if re.match(r'^[\s\d\W]*$', line):
            continue
        
        is_garbage = (
            len(re.findall(r'[a-zA-Z0-9]', line)) < 0.2 * len(line) or
            re.match(r'^\s*[\d\s\W]{1,15}\s*$', line) or
            (len(line) < 15 and len(line.split()) < 4) or
            re.search(nav_keywords, line, re.IGNORECASE) or
            re.search(css_patterns, line, re.IGNORECASE) or
            line.startswith('{') or
            line.startswith('}') or
            line.startswith('[') or
            line.startswith(']') or
            line.startswith('(') or
            line.startswith(')') or
            line.startswith('//') or
            line.startswith('/*') or
            line.startswith('*') or
            line.startswith(';') or
            line.startswith(',') or
            line.startswith('.') or
            line.startswith('#') or
            ':' in line and '=' in line and len(line.split()) < 3 or
            any(keyword in line for keyword in ['addEventListener', 'console.', 'document.', 'window.', 'function(', 'var ', 'const ', 'let ', '$(', 'jQuery', 'async', 'await', '.then', '.catch', 'Promise'])
        )
        
        is_content = (
            len(line) > 10 and 
            len(re.findall(r'[a-zA-ZÀ-ÿ]{3,}', line)) >= 2
        )
        
        if is_content and not is_garbage:
            cleaned_lines.append(line)
    
    content = '\n'.join(cleaned_lines)
    
    footer_keywords = r'(references|bibliograf|see also|notes|further read|citations|external links|ver tambem|leia mais|fonte|sources|referências|leia também)'
    
    paragraphs = content.split('\n\n')
    cleaned_paragraphs = []
    found_footer_marker = False
    
    for paragraph in reversed(paragraphs):
        if re.search(footer_keywords, paragraph.strip(), re.IGNORECASE) and len(paragraph) < 100:
            found_footer_marker = True
            continue 
        
        if not found_footer_marker:
            cleaned_paragraphs.insert(0, paragraph)
    
    content = '\n\n'.join(cleaned_paragraphs)
    
    content = re.sub(r'[↑↓←→•«»©®™§¶†‡℠℃℉°]', ' ', content)
    content = re.sub(r'\n\s*\n+', '\n\n', content)
    content = re.sub(r'[ \t]+', ' ', content)
    content = re.sub(r'\s([.,;?!])', r'\1', content)
    
    return content.strip()