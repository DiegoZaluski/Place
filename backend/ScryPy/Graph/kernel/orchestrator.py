"""
KERNEL ORCHESTRATOR
Professional orchestration system for WebSocket server.
Dynamically controls system prompts based on task type.
"""
from typing import TypedDict, List, Dict, Any, Literal
from langgraph.graph import StateGraph, END
from backend.ScryPy.utilsPy import setup_logging
from ..browsers.search import Search
import asyncio
from concurrent.futures import ThreadPoolExecutor

logger = setup_logging('Orchestrator')

class OrchestrationState(TypedDict):
    """State management for WebSocket session processing."""
    session_id: str
    user_input: str
    conversation_history: List[Dict[str, str]]
    search_code: int  # 100=chat | 200=simple search | 300=deep search
    think_flag: bool
    final_response: str
    processing_complete: bool
    system_prompt: str  # Dynamic system prompt control


def analyzeRequest(state: OrchestrationState) -> OrchestrationState:
    """Analyze request and set appropriate system prompt."""
    logger.info(f"Analyzing request for session: {state['session_id']}")
    
    # Set dynamic system prompt based on task type
    if state["think_flag"]:
        state["system_prompt"] = "Think deeply. Provide comprehensive analysis with clear reasoning."
    elif state["search_code"] == 200:
        state["system_prompt"] = "Process search results. Present key findings clearly and concisely."
    elif state["search_code"] == 300:
        state["system_prompt"] = "Process search results. Present key findings clearly and concisely."
    else:
        state["system_prompt"] = "Helpful AI assistant. Provide clear, accurate responses."
        
    logger.debug(f"System prompt set for: search_code={state['search_code']}, think={state['think_flag']}")
    return state


def routeRequest(state: OrchestrationState) -> str:
    """Route request based on client control flags."""
    logger.info(f"Routing request for session: {state['session_id']}")
    
    if state["think_flag"]:
        return "processThinking"
    elif state["search_code"] == 200:
        return "processSimpleSearch" 
    elif state["search_code"] == 300:
        return "processDeepSearch"
    else:
        return "processChat"


def processChat(state: OrchestrationState) -> OrchestrationState:
    """Process standard chat request using dynamic system prompt."""
    logger.info(f"Processing chat for session: {state['session_id']}")
    
    # This will use the system prompt set in analyzeRequest
    state["final_response"] = f"Chat response to: {state['user_input']}"
    state["processing_complete"] = True
    
    return state


def _run_sync_search(query: str, engine: str, fiveSearches: bool = False) -> Dict:
    """Execute sync search with new Search class."""
    search = Search(fiveSearches=fiveSearches)
    
    try:
        if engine == "duckduckgo":
            results = search.duckDuckGo(query)
        elif engine == "brave":
            results = search.brave(query)
        else:
            results = {}
        
        return results
    except Exception as e:
        logger.error(f"Search failed for {engine}: {e}")
        return {}


def processSimpleSearch(state: OrchestrationState) -> OrchestrationState:
    """Process simple search with clean content extraction."""
    logger.info(f"Processing simple search for session: {state['session_id']}")
    
    try:
        executor = ThreadPoolExecutor(max_workers=1)
        
        engines = ["duckduckgo", "brave"]
        quality_results = None
        
        for engine in engines:
            future = executor.submit(_run_sync_search, state["user_input"], engine, False)
            results = future.result(timeout=30)
            
            if results and results.get("content") and len(results["content"].strip()) > 150:
                quality_results = results
                break
        
        if quality_results and quality_results.get("content"):
            state["final_response"] = quality_results["content"]
        else:
            state["final_response"] = ""
        
        executor.shutdown(wait=False)
            
    except Exception as error:
        logger.error(f"Simple search failed: {error}")
        state["final_response"] = ""
    
    state["processing_complete"] = True
    return state


def processDeepSearch(state: OrchestrationState) -> OrchestrationState:
    """Execute deep search with multi-engine fallback and quality filtering."""
    logger.info(f"Processing deep search for session: {state['session_id']}")
    
    try:
        executor = ThreadPoolExecutor(max_workers=1)
        
        engines = ["duckduckgo", "brave"]
        quality_results = None
        
        for engine in engines:
            future = executor.submit(_run_sync_search, state["user_input"], engine, True)
            results = future.result(timeout=30)
            
            has_content = (
                (results.get("content") and len(results["content"].strip()) > 150) or
                (results.get("contents") and any(len(c.strip()) > 150 for c in results["contents"]))
            )
            
            if results and has_content:
                quality_results = results
                logger.info(f"Quality content found from {engine}")
                break
        
        if quality_results:
            if quality_results.get("content"):
                state["final_response"] = quality_results["content"]
            elif quality_results.get("contents"):
                valid_contents = [c for c in quality_results["contents"][:3] if len(c.strip()) > 150]
                state["final_response"] = "\n\n".join(valid_contents) if valid_contents else ""
            else:
                state["final_response"] = ""
        else:
            state["final_response"] = ""
        
        executor.shutdown(wait=False)
            
    except Exception as error:
        logger.error(f"Deep search failed: {error}")
        state["final_response"] = ""
    
    state["processing_complete"] = True
    return state

def processThinking(state: OrchestrationState) -> OrchestrationState:
    """Process thinking mode request."""
    logger.info(f"Processing thinking mode for session: {state['session_id']}")
    
    # LLM will use the thinking-specific system prompt
    state["final_response"] = f"Thinking analysis for: {state['user_input']}"
    state["processing_complete"] = True
    
    return state


def createOrchestrationGraph() -> StateGraph:
    """Create and configure the main orchestration graph."""
    logger.info("Creating orchestration graph")
    
    workflow = StateGraph(OrchestrationState)
    
    # Add all processing nodes
    workflow.add_node("analyzeRequest", analyzeRequest)
    workflow.add_node("processChat", processChat)
    workflow.add_node("processSimpleSearch", processSimpleSearch)
    workflow.add_node("processDeepSearch", processDeepSearch)
    workflow.add_node("processThinking", processThinking)
    
    # Define workflow with conditional routing
    workflow.set_entry_point("analyzeRequest")
    
    workflow.add_conditional_edges(
        "analyzeRequest",
        routeRequest,
        {
            "processChat": "processChat",
            "processSimpleSearch": "processSimpleSearch",
            "processDeepSearch": "processDeepSearch", 
            "processThinking": "processThinking"
        }
    )
    
    # All nodes lead to end
    workflow.add_edge("processChat", END)
    workflow.add_edge("processSimpleSearch", END)
    workflow.add_edge("processDeepSearch", END)
    workflow.add_edge("processThinking", END)
    
    logger.info("Orchestration graph created successfully")
    return workflow.compile()


# Global orchestrator instance
orchestrator = createOrchestrationGraph()