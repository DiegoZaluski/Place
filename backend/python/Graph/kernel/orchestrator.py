"""
KERNEL ORCHESTRATOR
Professional orchestration system for WebSocket server.
Dynamically controls system prompts based on task type.
"""
from typing import TypedDict, List, Dict, Any, Literal
from langgraph.graph import StateGraph, END
from python import setup_logging
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
        state["system_prompt"] = """
        You are in advanced thinking mode. Analyze deeply and provide comprehensive insights.
        Structure your response with clear reasoning, evidence, and conclusions.
        Consider multiple perspectives and provide well-reasoned analysis.
        """
    elif state["search_code"] == 200:
        state["system_prompt"] = """
        You are processing simple search results. Format the information clearly and concisely.
        Focus on the most relevant findings and present them in an organized manner.
        Keep responses direct and to the point.
        """
    elif state["search_code"] == 300:
        state["system_prompt"] = """
        You are processing deep search results from multiple sources. 
        Format the response professionally:
        - Start with source overview
        - Organize information by topic/theme
        - Cite key findings from different sources
        - Provide comprehensive analysis
        - Highlight consensus and contradictions
        - End with summary and conclusions
        """
    else:
        state["system_prompt"] = """
        You are a helpful, knowledgeable, and professional AI assistant.
        Provide clear, accurate, and well-structured responses.
        Adapt your communication style to match the user's needs.
        """
    
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


def processSimpleSearch(state: OrchestrationState) -> OrchestrationState:
    """Process simple search request."""
    logger.info(f"Processing simple search for session: {state['session_id']}")
    
    # Placeholder - will integrate search with formatted response
    state["final_response"] = f"Simple search completed for: {state['user_input']}"
    state["processing_complete"] = True
    
    return state


def _run_async_search(query: str, engine: str) -> Dict:
    """Helper function to run async search in sync context."""
    search = Search(browser="firefox", headless=True, fiveSearches=True)
    
    # Create a new event loop for this thread
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    
    try:
        if engine == "duckduckgo":
            results = loop.run_until_complete(search.duckDuckGo(query))
        elif engine == "brave":
            results = loop.run_until_complete(search.brave(query))
        elif engine == "ecosia":
            results = loop.run_until_complete(search.ecosia(query))
        elif engine == "mojeek":
            results = loop.run_until_complete(search.mojeek(query))
        else:
            results = {}
        
        return results
    finally:
        loop.close()


def processDeepSearch(state: OrchestrationState) -> OrchestrationState:
    """
    Execute deep search with multi-engine fallback.
    LLM will format results using the dynamic system prompt.
    """
    logger.info(f"Processing deep search for session: {state['session_id']}")
    
    try:
        executor = ThreadPoolExecutor(max_workers=1)
        
        # Try search engines with fallback
        engines = ["duckduckgo", "brave", "ecosia", "mojeek"]
        results = None
        
        for engine in engines:
            future = executor.submit(_run_async_search, state["user_input"], engine)
            results = future.result(timeout=30)
            
            if results and results.get("contents"):
                break
        
        if results and results.get("contents"):
            # Return raw content - LLM will format using the search-specific system prompt
            raw_content = "\n\n".join(results["contents"][:5])
            state["final_response"] = raw_content
        else:
            state["final_response"] = f"Search completed for: {state['user_input']}"
        
        executor.shutdown(wait=False)
            
    except Exception as error:
        logger.error(f"Deep search failed: {error}")
        state["final_response"] = f"Search completed for: {state['user_input']}"
    
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