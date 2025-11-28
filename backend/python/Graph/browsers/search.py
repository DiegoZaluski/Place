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
        
        # Enhanced content selectors for better extraction
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
            ".story-content",
            ".news-content",
            ".blog-content",
            "#content",
            "#main-content",
            ".content-area",
            ".single-content",
            ".post-body",
            ".entry-body"
        ]
        
        # Comprehensive noise removal selectors
        self.noise_selectors = [
            # Structural elements
            "nav", "footer", "aside", "header",
            # Navigation and menus
            ".sidebar", ".navigation", "[role='navigation']", ".menu", ".breadcrumb",
            # Advertising and tracking
            ".advertisement", ".ads", ".ad-container", ".banner-ad", ".google-ads",
            ".tracking", ".analytics", "[id*='ad']", "[class*='ad']",
            # Social media and sharing
            ".social-share", ".social-media", ".share-buttons", ".like-button",
            # Comments and user content
            ".comments", ".comment-section", ".user-content", ".user-generated",
            # Related content and widgets
            ".related-posts", ".widget", ".widgets", ".recommended", ".popular-posts",
            # Technical elements
            "script", "style", "noscript", "iframe", "embed", "object",
            # Notifications and modals
            ".cookie-notice", ".popup", ".modal", ".notification", ".alert",
            # Images and media
            "img", "picture", "video", "audio", ".gallery", ".carousel",
            # Hidden and invisible content
            ".hidden", "[style*='display: none']", "[style*='visibility: hidden']",
            # Metadata and SEO elements
            ".meta", ".post-meta", ".article-meta", ".timestamp", ".author-info",
            # Pagination and navigation
            ".pagination", ".page-nav", ".next-prev"
        ]
        
        # Content quality filters
        self.content_filters = {
            'min_length': 150,
            'max_length': 10000,
            'min_words': 25,
            'min_paragraphs': 1,
            'max_paragraphs': 20
        }

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
                # Set longer timeout for better content loading
                page.set_default_timeout(15000)
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
                if self._isQualityContent(content):
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
        return list(urls)[:10]  # Increased to get more options

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
            
            # Block search engines and social media
            blocked_domains = [engine, 'google', 'youtube', 'facebook', 'twitter', 
                             'instagram', 'linkedin', 'pinterest', 'tiktok']
            blocked = any(b in domain for b in blocked_domains)
            
            # Block file types and invalid patterns
            bad_patterns = any(re.search(p, url) for p in [
                r'\.(pdf|jpg|png|gif|css|js|zip|rar|exe)$', 
                r'(blob|javascript|mailto|tel):', 
                r'#', r'void\(0\)'
            ])
            
            # Block URLs with too many parameters or deep paths
            return not (blocked or bad_patterns or path.count('/') > 6 or len(query) > 200)
        except Exception:
            return False

    async def _extractBestContent(self, urls: List[str], page) -> Dict:
        for url in urls[:3]:
            if content := await self._fastExtractPage(url, page):
                if self._isQualityContent(content):
                    return {
                        "used_url": url,
                        "content": cleanPage(content),
                        "remaining_urls": [u for u in urls if u != url][:4]
                    }
        
        # Fallback: use first URL even if content is minimal
        used_url = urls[0] if urls else ""
        content = await self._fastExtractPage(used_url, page) if used_url else ""
        return {
            "used_url": used_url,
            "content": cleanPage(content) if content else f"Search completed for query",
            "remaining_urls": urls[1:5]
        }

    async def _fastExtractPage(self, url: str, page) -> str:
        try:
            await page.goto(url, wait_until="domcontentloaded", timeout=15000)
            
            # Wait a bit for dynamic content to load
            await page.wait_for_timeout(1000)
            
            # Try main content selectors first
            for selector in self.main_selectors:
                if content := await self._extractQualityContent(page, selector):
                    return content
            
            # Fallback to body extraction with aggressive filtering
            return await self._extractFallbackContent(page)
            
        except Exception as e:
            logger.warning(f"Fast extraction failed for {url}: {e}")
            return ""

    async def _extractQualityContent(self, page, selector: str) -> str:
        try:
            element = await page.query_selector(selector)
            if not element:
                return ""
            
            # Remove all noise elements recursively
            await self._removeNoiseElements(element)
            
            # Extract text and apply quality filters
            text_content = await element.inner_text()
            clean_content = self._cleanExtractedText(text_content)
            
            return clean_content if self._isQualityContent(clean_content) else ""
            
        except Exception:
            return ""

    async def _removeNoiseElements(self, parent_element):
        """Recursively remove noise elements from parent"""
        for noise_selector in self.noise_selectors:
            elements_to_remove = await parent_element.query_selector_all(noise_selector)
            for element in elements_to_remove:
                try:
                    await element.evaluate("element => element.remove()")
                except:
                    continue

    def _cleanExtractedText(self, text: str) -> str:
        """Apply multiple cleaning filters to extracted text"""
        if not text:
            return ""
        
        lines = text.split('\n')
        clean_lines = []
        
        for line in lines:
            line_clean = line.strip()
            if not line_clean:
                continue
                
            # Skip lines that are likely noise
            if self._isNoiseLine(line_clean):
                continue
                
            # Skip very short lines or lines with too many special characters
            if (len(line_clean) < 25 or 
                line_clean.count(' ') < 3 or
                line_clean.count('|') > 2 or
                line_clean.count('•') > 3):
                continue
                
            clean_lines.append(line_clean)
        
        # Limit the number of paragraphs and overall length
        content = '\n'.join(clean_lines[:self.content_filters['max_paragraphs']])
        
        if len(content) > self.content_filters['max_length']:
            content = content[:self.content_filters['max_length']] + "..."
            
        return content

    def _isNoiseLine(self, line: str) -> bool:
        """Check if a line is likely to be noise"""
        noise_patterns = [
            r'^\s*(foto|imagem|photo|image):',
            r'^\s*clique\s+(aqui|here)',
            r'^\s*escute\s+(a|aqui)',
            r'^\s*tempo\s+de\s+leitura',
            r'^\s*compartilhe',
            r'^\s*curtir',
            r'^\s*seguir',
            r'^\s*@\w+',  # Social media handles
            r'^\d+\s*(comentários|comments)',
            r'^\s*publicidade',
            r'^\s*anúncio',
            r'^\s*ads?\.',
            r'^[\d\s\.]+$',  # Only numbers and dots
        ]
        
        line_lower = line.lower()
        return any(re.search(pattern, line_lower) for pattern in noise_patterns)

    def _isQualityContent(self, content: str) -> bool:
        """Check if content meets quality thresholds"""
        if not content:
            return False
            
        word_count = len(content.split())
        paragraph_count = content.count('\n') + 1
        
        return (len(content) >= self.content_filters['min_length'] and
                word_count >= self.content_filters['min_words'] and
                paragraph_count >= self.content_filters['min_paragraphs'])

    async def _extractFallbackContent(self, page) -> str:
        """Fallback content extraction when main selectors fail"""
        try:
            # Remove noise from entire body first
            body = await page.query_selector('body')
            if body:
                await self._removeNoiseElements(body)
            
            # Extract all paragraphs
            paragraphs = await page.query_selector_all('p')
            content_parts = []
            
            for p in paragraphs[:30]:  # Limit to first 30 paragraphs
                text = await p.text_content()
                if text and len(text.strip()) > 40 and not self._isNoiseLine(text.strip()):
                    content_parts.append(text.strip())
            
            content = '\n\n'.join(content_parts[:15])  # Limit to 15 paragraphs
            
            return content if self._isQualityContent(content) else ""
            
        except Exception:
            return ""

    def _emptyResult(self) -> Dict:
        if self.fiveSearches:
            return {"used_urls": [], "contents": [], "total_extracted": 0, "mode": "fiveSearches"}
        else:
            return {"used_url": "", "content": "", "remaining_urls": []}

# TEST CODE
# import asyncio
# async def main():
#     s = Search()
#     results = await s.duckDuckGo("bolo de morango")
#     print("Resultados:", results)

# if __name__ == "__main__":
#     asyncio.run(main())