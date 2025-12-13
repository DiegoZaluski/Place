import os
import sys
from concurrent.futures import ThreadPoolExecutor, TimeoutError

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '../..'))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)
from .search import Search
class RunSearch:
    def __init__(self):
        pass
    
    def _search(self, query):
        try:
            executor = ThreadPoolExecutor(max_workers=1)
            
            engines = ["duckduckgo", "brave"]
            quality_results = None
            
            for engine in engines:
                future = executor.submit(self._execute_search, query, engine)
                results = future.result(timeout=30)
                
                has_content = (
                    (results.get("content") and len(results["content"].strip()) > 150) or
                    (results.get("contents") and any(len(c.strip()) > 150 for c in results["contents"]))
                )
                
                if results and has_content:
                    quality_results = results
                    break
            
            if quality_results:
                if quality_results.get("content"):
                    response = quality_results["content"]
                elif quality_results.get("contents"):
                    valid_contents = [c for c in quality_results["contents"][:3] if len(c.strip()) > 150]
                    response = "\n\n".join(valid_contents) if valid_contents else ""
                else:
                    response = ""
            else:
                response = ""
            
            executor.shutdown(wait=False)
            return response
                
        except (Exception, TimeoutError):
            return ""
    
    def _execute_search(self, query, engine):
        search = Search(fiveSearches=True)
        
        try:
            if engine == "duckduckgo":
                return search.duckDuckGo(query)
            elif engine == "brave":
                return search.brave(query)
            else:
                return {}
        except Exception:
            return {}