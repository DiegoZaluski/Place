from playwright.async_api import async_playwright
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
        self.main_selectors = [
            "article",
            "main",
            "[role='main']",
            ".main-content",
            ".content-main",
            ".post-content",
            ".entry-content",
            ".article-content",
            ".article-body",
            ".page-content",
            ".page-body",
            "div[data-content='true']",
            ".prose",
            ".markdown-body",
        ]
        self.noise_selectors = [
            "nav",
            "footer",
            "aside",
            ".sidebar",
            ".advertisement",
            ".ads",
            ".comments",
            ".related-posts",
            ".navigation",
            "[role='navigation']",
            ".breadcrumb",
            ".social-share",
            ".widgets",
            ".banner",
            ".cookie-notice",
            "script",
            "style",
        ]

    async def simpleSearch(self, url: str) -> Dict:
        return await self._withBrowser(lambda page: self._fastExtractPage(url, page))

    async def duckDuckGo(self, query: str) -> Dict:
        return await self._universalSearch(query, "duckduckgo")

    async def brave(self, query: str) -> Dict:
        return await self._universalSearch(query, "brave") 

    async def ecosia(self, query: str) -> Dict:
        return await self._universalSearch(query, "ecosia")

    async def mojeek(self, query: str) -> Dict:
        return await self._universalSearch(query, "mojeek")

    async def _universalSearch(self, query: str, engine: str) -> Dict:
        return await self._withBrowser(lambda page: self._performSearch(page, query, engine))

    async def _withBrowser(self, operation) -> Dict:
        async with async_playwright() as pw:
            browser = await self._browser_map[self.browser](pw).launch(headless=self.headless)
            try:
                page = await browser.new_page()
                return await operation(page)
            except Exception as e:
                logger.error(f"Browser operation failed: {e}")
                return self._emptyResult()
            finally:
                await browser.close()

    async def _performSearch(self, page, query: str, engine: str) -> Dict:
        logger.info(f"Searching {engine} for: {query}")
        await page.goto(self._search_engines[engine].format(query), wait_until="domcontentloaded")
        
        html_content = await page.content()
        urls = self._extractAndFilterUrls(html_content, engine)
        if len(urls) < 3:
            logger.warning(f"Only {len(urls)} quality URLs found")
            return self._emptyResult()
        
        if self.fiveSearches:
            return await self._extractMultipleContents(urls, page)
        else:
            return await self._extractBestContent(urls, page)

    async def _extractMultipleContents(self, urls: List[str], page) -> Dict:
        contents = []
        used_urls = []
        
        for url in urls[:5]:
            if content := await self._fastExtractPage(url, page):
                if len(content) > 300:
                    contents.append(cleanPage(content))
                    used_urls.append(url)
                    
                    if len(contents) >= 5:
                        break
        
        return {
            "used_urls": used_urls,
            "contents": contents,
            "total_extracted": len(contents),
            "mode": "fiveSearches"
        }

    def _extractAndFilterUrls(self, html: str, engine: str) -> List[str]:
        urls = set()
        for match in re.findall(r'href=[\'"]?([^\'" >]+)', html, re.IGNORECASE):
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
            
            return url if self._isQualityUrl(url, engine) else None
        except Exception:
            return None

    def _isQualityUrl(self, url: str, engine: str) -> bool:
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

    async def _extractBestContent(self, urls: List[str], page) -> Dict:
        for url in urls[:3]:
            if content := await self._fastExtractPage(url, page):
                if len(content) > 300:
                    return {
                        "used_url": url,
                        "content": cleanPage(content),
                        "remaining_urls": [u for u in urls if u != url][:4]
                    }
        
        used_url = urls[0] if urls else ""
        content = await self._fastExtractPage(used_url, page) if used_url else ""
        return {
            "used_url": used_url,
            "content": cleanPage(content),
            "remaining_urls": urls[1:5]
        }

    async def _fastExtractPage(self, url: str, page) -> str:
        try:
            await page.goto(url, wait_until="domcontentloaded", timeout=10000)
            
            for selector in self.main_selectors:
                if content := await self._extractBySelector(page, selector):
                    return content
            
            return await self._extractFallbackContent(page)
            
        except Exception as e:
            logger.warning(f"Fast extraction failed for {url}: {e}")
            return ""

    async def _extractBySelector(self, page, selector: str) -> str:
        try:
            element = await page.query_selector(selector)
            if not element:
                return ""
            
            for noise in self.noise_selectors:
                elements_to_remove = await element.query_selector_all(noise)
                for el in elements_to_remove:
                    try:
                        await el.evaluate("el => el.remove()", el)
                    except:
                        pass
            
            text_content = await element.text_content()
            
            if text_content and len(text_content.strip()) > 200:
                return text_content.strip()
            
            return ""
        except Exception:
            return ""

    async def _extractFallbackContent(self, page) -> str:
        try:
            for selector in self.noise_selectors:
                elements = await page.query_selector_all(selector)
                for el in elements:
                    try:
                        await el.evaluate("el => el.remove()", el)
                    except:
                        pass
            
            body_text = await page.text_content("body")
            lines = body_text.split('\n')
            paragraphs = [line.strip() for line in lines if len(line.strip()) > 80 and line.strip().count(' ') > 3]
            
            return '\n'.join(paragraphs[:10])
        except Exception:
            return ""

    def _emptyResult(self) -> Dict:
        if self.fiveSearches:
            return {"used_urls": [], "contents": [], "total_extracted": 0, "mode": "fiveSearches"}
        else:
            return {"used_url": "", "content": "", "remaining_urls": []}