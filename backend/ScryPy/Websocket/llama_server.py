# from __init__ import MODEL_PATH, CHAT_FORMAT
import asyncio
import json
import uuid
import os
import sys
from typing import List, Dict, Optional, Any, Set
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))
# ADD PROJECT ROOT TO PYTHONPATH
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '../..'))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from ScryPy.Websocket import MODEL_PATH, CHAT_FORMAT, logger, FALLBACK_PORTS_WEBSOCKET, NAME_OF_MODEL
from ScryPy.SQLite.controlConfig import ControlConfig 
from llama_cpp import Llama, LlamaCache
import websockets
from websockets.exceptions import ConnectionClosedOK
import time
# GLOBAL CONFIGURATION 
CONTEXT_SIZE = 8000

class LlamaChatServer:
    """WebSocket server for LLaMA model chat with native context optimization and async interruption support."""

    _config_cache = None
    _cache_time = 0
    @classmethod
    def get_config(cls):
        """Function Global Configuration""" 
        now = time.time()
        if not cls._config_cache or (now - cls._cache_time) > 5:
            control = ControlConfig({"id_model": NAME_OF_MODEL})
            cls._config_cache = control.get()
            cls._cache_time = now
        
        return cls._config_cache
    
    def __init__(self, model_path: str, system_prompt: str = None):
        # MODEL INITIALIZATION
        self.temperature = 0.7
        self.top_p = 0.9
        self.top_k = 40
        self.tokens = 512
        self.repeat_penalty = 1.1
        self.frequency_penalty = 0.0
        self.presence_penalty = 0.0
        self.min_p = 0.05
        self.tfs_z = 1.0
        self.mirostat_tau = 5.0
        self.seed = None
        self.stop = None

        self.llm = Llama(
            model_path=model_path, 
            n_ctx=CONTEXT_SIZE,
            n_gpu_layers=-1,
            seed=self.seed,
            verbose=False,
            chat_format=CHAT_FORMAT, 
            use_mlock=True,       
            use_mmap=True
        )
        
        self.llm.set_cache(LlamaCache())
        
        self.active_prompts: Set[str] = set()
        self.session_history: Dict[str, List[Dict[str, str]]] = {}
        self.system_prompt = "You are a helpful, knowledgeable, and professional AI assistant. " or system_prompt
    def update_live_config(self):
        """Updates configuration parameters from the database."""
        CONFIGPARAMS = self.get_config()
        
        if CONFIGPARAMS:
            self.temperature = CONFIGPARAMS['temperature']
            self.top_p = CONFIGPARAMS['top_p']
            self.top_k = CONFIGPARAMS['top_k']
            self.tokens = CONFIGPARAMS['tokens']
            self.repeat_penalty = CONFIGPARAMS['repeat_penalty']
            self.frequency_penalty = CONFIGPARAMS['frequency_penalty']
            self.presence_penalty = CONFIGPARAMS['presence_penalty']
            self.min_p = CONFIGPARAMS['min_p']
            self.tfs_z = CONFIGPARAMS['tfs_z']
            self.mirostat_tau = CONFIGPARAMS['mirostat_tau']
            self.seed = CONFIGPARAMS['seed']
            self.stop = CONFIGPARAMS['stop']
            logger.info("CONFIGPARAMS: " + str(CONFIGPARAMS))
        else:
            logger.warning("ERROR: CONFIGPARAMS DEFAULTS")

    def get_session_history(self, session_id: str) -> List[Dict[str, str]]:
        """Retrieves or creates conversation history for a session."""
        if session_id not in self.session_history:
            self.session_history[session_id] = [
                {
                    "role": "system", 
                    "content": self.system_prompt
                }
            ]
        return self.session_history[session_id]
    
    def cleanup_session(self, session_id: str) -> None:
        """Removes a session and clears its conversation history."""
        if session_id in self.session_history:
            del self.session_history[session_id]
        logger.info(f"Session cleanup complete for {session_id}")
    
    async def handle_prompt(
        self, 
        prompt_id: str, 
        prompt_text: str, 
        session_id: str, 
        websocket: websockets.WebSocketServerProtocol
    ) -> None:
        """
        Processes a prompt using run_in_executor for separate thread execution,
        with asyncio.sleep(0) in the loop to ensure cancellation priority.
        """
        self.update_live_config()
        logger.info(f"Processing prompt {prompt_id} for session {session_id}")

        history = self.get_session_history(session_id).copy()
        history.append({"role": "user", "content": prompt_text})
        
        loop = asyncio.get_event_loop()
        
        # SYNCHRONOUS LLM CALL WRAPPER
        def get_stream_sync(): 
            return self.llm.create_chat_completion(
                history, 
                max_tokens=self.tokens,
                stream=True, 
                temperature=self.temperature,
                top_p=self.top_p,
                top_k=self.top_k,
                repeat_penalty=self.repeat_penalty,
                frequency_penalty=self.frequency_penalty,
                presence_penalty=self.presence_penalty,
                min_p=self.min_p,
                tfs_z=self.tfs_z,
                mirostat_tau=self.mirostat_tau,
                stop=self.stop
            )
        try:
            stream = await loop.run_in_executor(None, get_stream_sync)
            response_tokens = []
            
            for chunk in stream:
                await asyncio.sleep(0)
                
            # CANCELLATION CHECK
                if prompt_id not in self.active_prompts:
                    logger.info(f"Prompt {prompt_id} canceled by user request")
                    await websocket.send(json.dumps({
                        "promptId": prompt_id, 
                        "complete": True,
                        "type": "complete"
                    }))
                    return 

                token = chunk["choices"][0]["delta"].get("content", "")
                
                if token:
                    response_tokens.append(token)
                    await websocket.send(json.dumps({
                        "promptId": prompt_id, 
                        "token": token,
                        "type": "token"
                    }))

            # COMPLETION HANDLER
            if prompt_id in self.active_prompts:
                self.active_prompts.remove(prompt_id)
                
                assistant_response = "".join(response_tokens)
                
                self.get_session_history(session_id).append({"role": "user", "content": prompt_text})
                if assistant_response:
                    self.get_session_history(session_id).append({"role": "assistant", "content": assistant_response})
                    
                await websocket.send(json.dumps({
                    "promptId": prompt_id, 
                    "complete": True,
                    "type": "complete"
                }))
                
                logger.info(f"Prompt {prompt_id} complete. History length: {len(self.get_session_history(session_id))}")

        except ConnectionClosedOK:
            logger.info(f"Connection closed normally during processing of {prompt_id}")
            self.active_prompts.discard(prompt_id)
        except Exception as e:
            logger.error(f"Fatal error during prompt {prompt_id}: {type(e).__name__}: {e}", exc_info=True)
            await self._send_error(websocket, prompt_id, f"Server Error: {e}")
            self.active_prompts.discard(prompt_id)
    

    # SHUTDOWN
    async def handle_client(self, websocket: websockets.WebSocketServerProtocol, path: Optional[str] = None) -> None:
        """Manages client connection and processes messages."""
        session_id = str(uuid.uuid4())[:8]
        logger.info(f"New client connected: {websocket.remote_address} - Session: {session_id}")
        
        try:
            await websocket.send(json.dumps({
                "type": "ready",
                "message": "Model is ready",
                "sessionId": session_id
            }))
            
            async for message in websocket:
                await self._process_client_message(websocket, message, session_id)
                
        except ConnectionClosedOK:
            logger.info(f"Client disconnected gracefully - Session: {session_id}")
        except Exception as e:
            logger.error(f"Client handler error: {e}")
            await self._send_error(websocket, None, f"Connection failure: {e}")
        finally:
            self.cleanup_session(session_id)
    
    async def _process_client_message(self, websocket: websockets.WebSocketServerProtocol, message: str, session_id: str) -> None:
        """Processes an individual client message."""
        try:
            data = json.loads(message)
            print(f'\033[31m[DEBUG]: {data} \033[m')
            action = data.get("action")

            if action == "prompt":
                await self._handle_prompt_action(websocket, data, session_id)
            elif action == "cancel":
                await self._handle_cancel_action(websocket, data)
            elif action == "clear_history":
                await self._handle_clear_history_action(websocket, session_id)
            else:
                await self._send_error(websocket, None, f"Unknown action: {action}")

        except json.JSONDecodeError as e:
            await self._send_error(websocket, None, f"Invalid JSON: {e}")
        except Exception as e:
            await self._send_error(websocket, None, f"Error processing message: {e}")
    
    async def _handle_prompt_action(self, websocket: websockets.WebSocketServerProtocol, data: dict, session_id: str) -> None:
        """Handles the 'prompt' action."""
        prompt_text = data.get("prompt", "").strip()
        if not prompt_text:
            await self._send_error(websocket, None, "Empty prompt")
            return
            
        prompt_id = data.get("promptId") or str(uuid.uuid4())
        
        if len(self.active_prompts) > 5:
             await self._send_error(websocket, prompt_id, "Too many active prompts. Wait for current ones to finish.")
             return

        self.active_prompts.add(prompt_id)
        
        asyncio.create_task(self.router(data, prompt_id, prompt_text, session_id, websocket))
        
        await websocket.send(json.dumps({
            "promptId": prompt_id, 
            "sessionId": session_id,
            "status": "started",
            "type": "started"
        }))
    
    async def _handle_cancel_action(self, websocket: websockets.WebSocketServerProtocol, data: dict) -> None:
        """Processes a cancel action."""
        prompt_id = data.get("promptId")
        if prompt_id and prompt_id in self.active_prompts:
            self.active_prompts.discard(prompt_id) # Signals the stop of the LLM loop
            await websocket.send(json.dumps({
                "promptId": prompt_id,
                "status": "canceled", 
                "type": "status"
            }))
            print(f"[SERVER] Signal sent to cancel prompt {prompt_id}")
        
    async def _handle_clear_history_action(self, websocket: websockets.WebSocketServerProtocol, session_id: str) -> None:
        """Processes the action of clearing history."""
        self.session_history[session_id] = [
            {"role": "system", "content": "You are a helpful and polite assistant. Always respond in the user's language."}
        ]
        
        await websocket.send(json.dumps({
            "sessionId": session_id,
            "status": "history_cleared", 
            "type": "memory_cleared"
        }))
        logger.info(f"[SERVER] Session history reset for {session_id}")
    
    async def _send_error(self, websocket: websockets.WebSocketServerProtocol, prompt_id: Optional[str], error_msg: str) -> None:
        """Sends an error message to the client."""
        error_data = {"error": error_msg, "type": "error"}
        if prompt_id:
            error_data["promptId"] = prompt_id
        try:
            await websocket.send(json.dumps(error_data))
        except Exception as e:
            logger.error(f"[SERVER] Could not send error message: {e}")

    async def bridges(
        self,
        data: Dict, 
        promptId: str, 
        promptText: str, 
        sessionId: str, 
        websocket: websockets.WebSocketServerProtocol
    ) -> None:
        """Bridge method to integrate orchestrator with WebSocket server."""
        from Graph.kernel.orchestrator import orchestrator
        
        try:
            initial_state = {
                "session_id": sessionId,
                "user_input": promptText,
                "conversation_history": self.get_session_history(sessionId),
                "search_code": data.get("search", 100),
                "think_flag": data.get("think", False),
                "final_response": "",
                "processing_complete": False,
                "system_prompt": ""  
            }
            
            final_state = orchestrator.invoke(initial_state)
            
            self._updateSystemPrompt(sessionId, final_state["system_prompt"])

            await websocket.send(json.dumps({
                "promptId": promptId,
                "token": final_state["final_response"],
                "type": "token"
            }))
            
            await websocket.send(json.dumps({
                "promptId": promptId,
                "complete": True,
                "type": "complete"
            }))
            
            if final_state["search_code"] == 100:
                self.get_session_history(sessionId).append({"role": "user", "content": promptText})
                self.get_session_history(sessionId).append({"role": "assistant", "content": final_state["final_response"]})
            
            logger.info(f"Orchestrator processing complete for {promptId}")
            
        except Exception as e:
            logger.error(f"Orchestrator bridge error: {e}")
            await self._send_error(websocket, promptId, f"Orchestration failed: {e}")

    def _updateSystemPrompt(self, session_id: str, new_prompt: str) -> None:
        """Update system prompt in session history."""
        if session_id in self.session_history:
            # Find and update system message
            for i, message in enumerate(self.session_history[session_id]):
                if message.get("role") == "system":
                    self.session_history[session_id][i]["content"] = new_prompt
                    logger.debug(f"Updated system prompt for session {session_id}")
                    return
            self.session_history[session_id].insert(0, {"role": "system", "content": new_prompt})

    def router(
        self,
        data: Dict, 
        promptId: str, 
        promptText: str, 
        sessionId: str, 
        websocket: websockets.WebSocketServerProtocol) -> Any:
        """
        Routing logic for enhanced processing modes.
        Returns None for standard processing flow.
        """

        searchCode = data.get("search", 100)
        thinkFlag = data.get("think", False)

        if searchCode == 100 and not thinkFlag:
            return self.handle_prompt(promptId, promptText, sessionId, websocket)   
        else:
            return self.bridges(data, promptId, promptText, sessionId, websocket)   
        
async def main() -> None:
    """Main function of the server."""
    logger.info("Initializing LLaMA model...")
    ws_server = None
    try:
        server = LlamaChatServer(MODEL_PATH)
    except Exception as e:
        logger.error(f"FATAL: Failed to load LLaMA model at {MODEL_PATH}. Check path and dependencies.")
        logger.error(f"Error: {e}")
        return
    
    for port in FALLBACK_PORTS_WEBSOCKET:
        try:
            ws_server = await websockets.serve(
                server.handle_client,
                "0.0.0.0",
                port,
                ping_interval=20,   
                ping_timeout=10,     
                close_timeout=10 
                )
            logger.info(f"WebSocket LLaMA server running on ws://0.0.0.0:{port}") 
            break
        except OSError as e:
            logger.error(f"WebSocket error: {e}")
            continue
    if not ws_server:
        logger.error("WebSocket server failed to start.")
        return
    try:
        await asyncio.Future()
    except KeyboardInterrupt:
        logger.info(f"\nServer shutting down...")
        ws_server.close()
        await ws_server.wait_closed()


if __name__ == "__main__":
    asyncio.run(main())