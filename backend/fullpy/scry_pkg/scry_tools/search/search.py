import requests
import trafilatura
from urllib.parse import unquote, urlparse, parse_qs
import re
from .__init__ import logger, cleanPage
from typing import Dict, List

class Search:
    def __init__(self, fiveSearches: bool = False) -> None:
        self.fiveSearches = fiveSearches
        self._search_engines = {
            "duckduckgo": "https://html.duckduckgo.com/html/?q={}",
            "brave": "https://search.brave.com/search?q={}"
        }
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }

    def simpleSearch(self, url: str) -> Dict:
        content = self._extractContent(url)
        return {"used_url": url, "content": content, "remaining_urls": []} if content else self._emptyResult()

    def duckDuckGo(self, query: str) -> Dict:
        return self._universalSearch(query, "duckduckgo")

    def brave(self, query: str) -> Dict:
        return self._universalSearch(query, "brave")

    def _universalSearch(self, query: str, engine: str) -> Dict:
        search_url = self._search_engines[engine].format(requests.utils.quote(query))
        html_content = self._fetchUrl(search_url)
        
        if not html_content:
            return self._emptyResult()
        
        urls = self._extractAndFilterUrls(html_content, engine)
        if not urls:
            return self._emptyResult()
        
        return self._extractMultipleContents(urls) if self.fiveSearches else self._extractBestContent(urls)

    def _fetchUrl(self, url: str) -> str:
        try:
            response = requests.get(url, headers=self.headers, timeout=10)
            response.raise_for_status()
            return response.text
        except Exception as e:
            logger.warning(f"Fetch failed for {url}: {e}")
            return ""

    def _extractContent(self, url: str) -> str:
        html_content = self._fetchUrl(url)
        if not html_content:
            return ""
        
        # First try trafilatura
        content = trafilatura.extract(html_content)
        
        # If content has encoding issues or trafilatura failed, use cleanPage
        if content and any(char in content for char in ['Ã', 'â', '€']):
            content = cleanPage(html_content)
        elif not content or len(content.strip()) < 200:
            content = cleanPage(html_content)
        
        return content.strip() if content and len(content.strip()) > 150 else ""

    def _extractAndFilterUrls(self, html: str, engine: str) -> List[str]:
        urls = set()
        for match in re.findall(r'href=["\']?([^"\' >]+)', html):
            if url := self._cleanAndValidateUrl(match, engine):
                urls.add(url)
        return list(urls)[:8]

    def _cleanAndValidateUrl(self, url: str, engine: str) -> str:
        try:
            if '/url?q=' in url or 'uddg=' in url:
                parsed = urlparse(url)
                for key in ['q', 'uddg']:
                    if key in parse_qs(parsed.query):
                        url = unquote(parse_qs(parsed.query)[key][0])
            
            return url if self._isQualityUrl(url) else None
        except Exception:
            return None

    def _isQualityUrl(self, url: str) -> bool:
        try:
            if not url.startswith('http') or len(url) > 400:
                return False
                
            parsed = urlparse(url.lower())
            domain = parsed.netloc
            
            if any(b in domain for b in ['google', 'youtube', 'facebook', 'twitter', 'instagram']):
                return False
            
            if re.search(r'\.(pdf|jpg|png|gif|css|js|zip|rar)$', url):
                return False
            
            return parsed.path.count('/') <= 8
        except Exception:
            return False

    def _extractMultipleContents(self, urls: List[str]) -> Dict:
        contents = []
        used_urls = []
        
        for url in urls[:5]:
            if content := self._extractContent(url):
                contents.append(content)
                used_urls.append(url)
                if len(contents) >= 5:
                    break
        
        return {
            "used_urls": used_urls,
            "contents": contents,
            "total_extracted": len(contents),
            "mode": "fiveSearches"
        }

    def _extractBestContent(self, urls: List[str]) -> Dict:
        for url in urls[:3]:
            if content := self._extractContent(url):
                return {
                    "used_url": url,
                    "content": content,
                    "remaining_urls": [u for u in urls if u != url][:3]
                }
        
        return self._emptyResult()

    def _emptyResult(self) -> Dict:
        if self.fiveSearches:
            return {"used_urls": [], "contents": [], "total_extracted": 0, "mode": "fiveSearches"}
        return {"used_url": "", "content": "", "remaining_urls": []}