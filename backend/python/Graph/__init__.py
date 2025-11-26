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

def cleanPage(content: str) -> str:
    """
    Intelligent webpage text cleaner using heuristics to detect and remove
    obvious structural, navigational, and boilerplate garbage, preserving core
    text content. Optimized for token economy and context quality for LLMs.
    """
    if not content:
        return ""

    # Initial Cleaning: Remove technical noise (agnostic and high-gain)
    content = re.sub(r'<[^>]*>', ' ', content)
    
    technical_patterns = [
        r'\{[^}]*\}',                # CSS/JS blocks/objects
        r'[a-z-]+="[^"]*"',          # HTML/XML attributes remnants
        r'&\w+;',                    # HTML entities (e.g., &nbsp;, &copy;)
        r'/\*[^*]*\*/',              # C-style comments (JS/CSS)
    ]
    
    for pattern in technical_patterns:
        content = re.sub(pattern, ' ', content)
        
    # Standardize newlines (helps with line-by-line processing)
    content = content.replace('\r', '') 

    # Line-by-Line Heuristics: Context preservation and garbage removal
    
    lines = content.split('\n')
    cleaned_lines = []
    
    # Common navigation/boilerplate keywords in multiple languages (Agnostic Improvement)
    nav_keywords = r'(mw-parser-output|sidebar|navbar|toggle|footer|copyright|all rights reserved|ver tambem|see also|expandir|expand|menu|search|busca|início|home|voltar|back)'

    for line in lines:
        line = line.strip()
        
        if not line:
            continue

        # Check for lines that are just long sequences of non-alphanumeric chars (dividers)
        if re.match(r'^[^a-zA-Z0-9\s]{5,}$', line):
             continue

        # HEURISTIC RULES - detect structural/navigational garbage
        is_garbage = (
            # Lines with too little alphanumeric content (low text density)
            len(re.findall(r'[a-zA-Z0-9]', line)) < 0.2 * len(line) or
            # Lines that are just a date or simple short number sequence
            re.match(r'^\s*[\d\s\W]{1,15}\s*$', line) or
            # Lines that are too short to be meaningful content (e.g., single-word nav items)
            (len(line) < 15 and len(line.split()) < 4) or
            # Obvious technical/placeholder/navigation strings (Improved)
            re.search(nav_keywords, line, re.IGNORECASE)
        )
        
        # Keep lines that meet a minimum standard for meaningful content
        is_content = (
            len(line) > 10 and 
            # Must contain at least a few proper "words"
            len(re.findall(r'[a-zA-ZÀ-ÿ]{3,}', line)) >= 2
        )
        
        if is_content and not is_garbage:
            cleaned_lines.append(line)
    
    content = '\n'.join(cleaned_lines)
    
    # Post-Processing: Remove References/Boilerplate Footer (Agnostic Improvement)
    
    # Look for common reference markers at the end of the cleaned text
    footer_keywords = r'(references|bibliograf|see also|notes|further read|references|citations|external links|ver tambem|leia mais)'
    
    # Split into paragraphs and reverse iterate to remove the footer section
    paragraphs = content.split('\n\n')
    cleaned_paragraphs = []
    found_footer_marker = False

    for paragraph in reversed(paragraphs):
        # Check for footer marker in the paragraph
        if re.search(footer_keywords, paragraph.strip(), re.IGNORECASE) and len(paragraph) < 100:
            found_footer_marker = True
            continue 
        
        if not found_footer_marker:
            cleaned_paragraphs.insert(0, paragraph) # Rebuild content in original order

    content = '\n\n'.join(cleaned_paragraphs)

    # Final Cleanup: Standardize and condense for efficient tokenization 
    
    # Replace decorative symbols with space
    content = re.sub(r'[↑↓←→•«»©®]', ' ', content)
    
    # Collapse multiple newlines into paragraph breaks (2 newlines)
    content = re.sub(r'\n\s*\n+', '\n\n', content)
    
    # Collapse multiple spaces/tabs into a single space (crucial for token economy)
    content = re.sub(r'[ \t]+', ' ', content)
    
    # Ensure correct spacing around common punctuation (improves readability and tokenization)
    content = re.sub(r'\s([.,;?!])', r'\1', content)
    
    return content.strip()