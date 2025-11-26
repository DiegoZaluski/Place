from playwright.sync_api import sync_playwright
from urllib.parse import unquote, urlparse, parse_qs
import re
from Graph.__init__ import logger, cleanPage
from typing import Dict, List

class Search:
    def __init__(self, browser: str = "firefox", headless: bool = True, fiveSearches: bool = False) -> None:
        self.browser = browser.lower()
        self.headless = headless
        self._browser_map = {
            "firefox": lambda pw: pw.firefox,
            "chrome": lambda pw: pw.chromium, 
            "edge": lambda pw: pw.chromium,
            "safari": lambda pw: pw.webkit
        }
        self._search_engines = {
            "duckduckgo": "https://duckduckgo.com/html/?q={}",
            "brave": "https://search.brave.com/search?q={}",
            "ecosia": "https://www.ecosia.org/search?q={}",
            "mojeek": "https://www.mojeek.com/search?q={}"
        }
        self.fiveSearches = fiveSearches 

    def simpleSearch(self, url: str) -> Dict:
        """Extract main content from webpage using intelligent content detection."""
        return self._withBrowser(lambda page: self._fastExtractPage(url, page))

    def duckDuckGo(self, query: str) -> Dict:
        return self._universalSearch(query, "duckduckgo")

    def brave(self, query: str) -> Dict:
        return self._universalSearch(query, "brave") 

    def ecosia(self, query: str) -> Dict:
        return self._universalSearch(query, "ecosia")

    def mojeek(self, query: str) -> Dict:
        return self._universalSearch(query, "mojeek")

    def _universalSearch(self, query: str, engine: str) -> Dict:
        """Universal search method that works with any search engine."""
        return self._withBrowser(lambda page: self._performSearch(page, query, engine))

    def _withBrowser(self, operation) -> Dict:
        """Context manager for browser operations with error handling."""
        with sync_playwright() as pw:
            browser = self._browser_map[self.browser](pw).launch(headless=self.headless)
            try:
                return operation(browser.new_page())
            except Exception as e:
                logger.error(f"Browser operation failed: {e}")
                return self._emptyResult()
            finally:
                browser.close()

    def _performSearch(self, page, query: str, engine: str) -> Dict:
        logger.info(f"Searching {engine} for: {query}")
        page.goto(self._search_engines[engine].format(query), wait_until="domcontentloaded")
        
        urls = self._extractAndFilterUrls(page.content(), engine)
        if len(urls) < 3:
            logger.warning(f"Only {len(urls)} quality URLs found")
            return self._emptyResult()
        
        # Modified behavior for fiveSearches mode
        if self.fiveSearches:
            return self._extractMultipleContents(urls, page)
        else:
            return self._extractBestContent(urls, page)

    def _extractMultipleContents(self, urls: List[str], page) -> Dict:
        """Extract content from multiple URLs for fiveSearches mode."""
        contents = []
        used_urls = []
        
        for url in urls[:5]:  # Process up to 5 URLs
            if content := self._fastExtractPage(url, page):
                if len(content) > 300:  # Quality threshold
                    contents.append(cleanPage(content))
                    used_urls.append(url)
                    
                    # Stop if we have 5 good contents
                    if len(contents) >= 5:
                        break
        
        return {
            "used_urls": used_urls,
            "contents": contents,
            "total_extracted": len(contents),
            "mode": "fiveSearches"
        }

    def _extractAndFilterUrls(self, html: str, engine: str) -> List[str]:
        """Extract and filter URLs from HTML in one pass."""
        urls = set()
        for match in re.findall(r'href=[\'"]?([^\'" >]+)', html, re.IGNORECASE):
            if url := self._cleanAndValidateUrl(match, engine):
                urls.add(url)
        return list(urls)[:8]

    def _cleanAndValidateUrl(self, url: str, engine: str) -> str:
        """Clean, decode and validate URL in single operation."""
        try:
            # Decode search engine redirects
            if '/url?q=' in url or 'uddg=' in url:
                parsed = urlparse(url)
                for key in ['q', 'uddg']:
                    if key in parse_qs(parsed.query):
                        url = unquote(parse_qs(parsed.query)[key][0])
            
            return url if self._isQualityUrl(url, engine) else None
        except Exception:
            return None

    def _isQualityUrl(self, url: str, engine: str) -> bool:
        """Comprehensive URL quality check in single validation."""
        try:
            if not url.startswith('http') or len(url) > 500:
                return False
                
            parsed = urlparse(url.lower())
            domain, path, query = parsed.netloc, parsed.path, parsed.query
            
            blocked = any(b in domain for b in [engine, 'google', 'youtube', 'facebook'])
            bad_patterns = any(re.search(p, url) for p in [
                r'\.(pdf|jpg|png|gif|css|js)$', r'(blob|javascript|mailto|tel):', r'#'
            ])
            
            return not (blocked or bad_patterns or path.count('/') > 6 or len(query) > 200)
        except Exception:
            return False

    def _extractBestContent(self, urls: List[str], page) -> Dict:
        """Extract content from best available URL with quality check."""
        for url in urls[:3]:
            if content := self._fastExtractPage(url, page):
                if len(content) > 300:  # Quality threshold
                    return {
                        "used_url": url,
                        "content": cleanPage(content),
                        "remaining_urls": [u for u in urls if u != url][:4]
                    }
        
        # Fallback with first URL
        used_url = urls[0] if urls else ""
        content = self._fastExtractPage(used_url, page) if used_url else ""
        return {
            "used_url": used_url,
            "content": cleanPage(content),
            "remaining_urls": urls[1:5]
        }

    def _fastExtractPage(self, url: str, page) -> str:
        """Fast content extraction with smart selector prioritization."""
        try:
            page.goto(url, wait_until="domcontentloaded", timeout=10000)
            
            # Try semantic selectors first for better content
            for selector in ["article", "main", "[role='main']", ".content", ".post-content"]:
                if content := self._extractBySelector(page, selector):
                    return content
            
            # Fallback to body with paragraph filtering
            return self._extractFallbackContent(page)
            
        except Exception as e:
            logger.warning(f"Fast extraction failed for {url}: {e}")
            return ""

    def _extractBySelector(self, page, selector: str) -> str:
        """Extract content from elements matching selector."""
        elements = page.query_selector_all(selector)
        texts = [el.text_content().strip() for el in elements if el.text_content().strip()]
        return " ".join(texts) if texts else ""

    def _extractFallbackContent(self, page) -> str:
        """Fallback content extraction focusing on meaningful text."""
        body_text = page.text_content("body")
        paragraphs = [p.strip() for p in body_text.split('\n') if len(p.strip()) > 100]
        return '\n'.join(paragraphs[:5])  # Limit to top 5 paragraphs

    def _emptyResult(self) -> Dict:
        """Return empty result structure."""
        if self.fiveSearches:
            return {"used_urls": [], "contents": [], "total_extracted": 0, "mode": "fiveSearches"}
        else:
            return {"used_url": "", "content": "", "remaining_urls": []}

# Usage examples:
# page_fast = Search(headless=False, fiveSearches=True) 
# print(page_fast.duckDuckGo("receita de bolo de chocolate"))  