from __init__ import MODEL_PATH, CHAT_FORMAT
import asyncio
import json
import uuid
import logging
from typing import Dict, Set, Optional, List, Any
from llama_cpp import Llama, LlamaCache
import websockets
from websockets.exceptions import ConnectionClosedOK

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)
logger.setLevel(logging.CRITICAL)
logger.addHandler(logging.NullHandler())
# --- Global Configuration ---
CONTEXT_SIZE = 4096 
MODEL_PATH = "../transformers/llama.cpp/models/Meta-Llama-3.1-8B-Instruct-Q4_K_M.gguf"

class LlamaChatServer:
    """WebSocket server for LLaMA model chat with native context optimization and async interruption support."""
    
    def __init__(self, model_path: str):
        # --- Model Initialization ---
        self.llm = Llama(
            model_path=model_path, 
            n_ctx=CONTEXT_SIZE,
            n_gpu_layers=-1,
            seed=42,
            verbose=False,
            chat_format="llama-3", 
            use_mlock=True,       
            use_mmap=True
        )
        
        self.llm.set_cache(LlamaCache())
        
        self.active_prompts: Set[str] = set()
        self.session_history: Dict[str, List[Dict[str, str]]] = {}
    
    def get_session_history(self, session_id: str) -> List[Dict[str, str]]:
        """Retrieves or creates conversation history for a session."""
        if session_id not in self.session_history:
            self.session_history[session_id] = [
                {
                    "role": "system", 
                    "content": "You are a helpful, knowledgeable, and professional AI assistant. "
                               "Provide clear, accurate, and well-structured responses. "
                               "Always maintain a respectful and patient tone. "
                               "Adapt your communication style to match the user's language and level of expertise."
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
        logger.info(f"Processing prompt {prompt_id} for session {session_id}")

        history = self.get_session_history(session_id).copy()
        history.append({"role": "user", "content": prompt_text})
        
        loop = asyncio.get_event_loop()
        
        # --- Synchronous LLM Call Wrapper ---
        def get_stream_sync(): 
            return self.llm.create_chat_completion(
                history, 
                max_tokens=512, 
                stream=True, 
                temperature=0.7, 
                top_p=0.9,
                repeat_penalty=1.1,
            )

        try:
            # --- Execute LLM call in thread pool ---
            stream = await loop.run_in_executor(None, get_stream_sync)
            
            response_tokens = []
            
            for chunk in stream:
                # --- Async context switch point ---
                await asyncio.sleep(0)
                
                # --- Cancellation Check ---
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

            # --- Completion Handler ---
            if prompt_id in self.active_prompts:
                self.active_prompts.remove(prompt_id)
                
                assistant_response = "".join(response_tokens)
                
                # --- Update session history ---
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
    
# --- Métodos Auxiliares de Gerenciamento de Cliente ---
    # PARADA 
    async def handle_client(self, websocket: websockets.WebSocketServerProtocol, path: Optional[str] = None) -> None:
        """Gerencia a conexão do cliente e processa mensagens."""
        session_id = str(uuid.uuid4())[:8]
        print(f"[SERVER] New client connected: {websocket.remote_address} - Session: {session_id}")
        
        try:
            # Envia status de 'ready' e a nova sessionId.
            await websocket.send(json.dumps({
                "type": "ready",
                "message": "Model is ready",
                "sessionId": session_id
            }))
            
            async for message in websocket:
                await self._process_client_message(websocket, message, session_id)
                
        except ConnectionClosedOK:
            print(f"[SERVER] Client disconnected gracefully - Session: {session_id}")
        except Exception as e:
            print(f"[SERVER] Client handler error: {e}")
            await self._send_error(websocket, None, f"Connection failure: {e}")
        finally:
            self.cleanup_session(session_id)
    
    async def _process_client_message(self, websocket: websockets.WebSocketServerProtocol, message: str, session_id: str) -> None:
        """Processa uma mensagem individual do cliente."""
        try:
            data = json.loads(message)
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
        """Processa ação de prompt."""
        prompt_text = data.get("prompt", "").strip()
        if not prompt_text:
            await self._send_error(websocket, None, "Empty prompt")
            return
            
        prompt_id = data.get("promptId") or str(uuid.uuid4())
        
        if len(self.active_prompts) > 5:
             await self._send_error(websocket, prompt_id, "Too many active prompts. Wait for current ones to finish.")
             return

        self.active_prompts.add(prompt_id)
        
        # Inicia processamento assíncrono em segundo plano
        asyncio.create_task(self.handle_prompt(prompt_id, prompt_text, session_id, websocket))
        
        await websocket.send(json.dumps({
            "promptId": prompt_id, 
            "sessionId": session_id,
            "status": "started",
            "type": "started"
        }))
    
    async def _handle_cancel_action(self, websocket: websockets.WebSocketServerProtocol, data: dict) -> None:
        """Processa ação de cancelamento."""
        prompt_id = data.get("promptId")
        if prompt_id and prompt_id in self.active_prompts:
            self.active_prompts.discard(prompt_id) # Sinaliza a parada no loop do LLM
            await websocket.send(json.dumps({
                "promptId": prompt_id,
                "status": "canceled", 
                "type": "status"
            }))
            print(f"[SERVER] Signal sent to cancel prompt {prompt_id}")
        
    async def _handle_clear_history_action(self, websocket: websockets.WebSocketServerProtocol, session_id: str) -> None:
        """Processa ação de limpar histórico."""
        self.session_history[session_id] = [
            {"role": "system", "content": "Você é um assistente prestativo e amigável. Responda sempre em português do Brasil."}
        ]
        
        await websocket.send(json.dumps({
            "sessionId": session_id,
            "status": "history_cleared", 
            "type": "memory_cleared"
        }))
        print(f"[SERVER] Session history reset for {session_id}")
    
    async def _send_error(self, websocket: websockets.WebSocketServerProtocol, prompt_id: Optional[str], error_msg: str) -> None:
        """Envia mensagem de erro para o cliente."""
        error_data = {"error": error_msg, "type": "error"}
        if prompt_id:
            error_data["promptId"] = prompt_id
        try:
            await websocket.send(json.dumps(error_data))
        except Exception as e:
            print(f"[SERVER] Could not send error message: {e}")


async def main() -> None:
    """Função principal do servidor."""
    print("Initializing LLaMA model...")
    try:
        server = LlamaChatServer(MODEL_PATH)
    except Exception as e:
        print(f"❌ FATAL: Failed to load LLaMA model at {MODEL_PATH}. Check path and dependencies.")
        print(f"Error: {e}")
        return
    
    ws_server = await websockets.serve(server.handle_client, "0.0.0.0", 8765) 
    
    print("🚀 WebSocket LLaMA server running on ws://0.0.0.0:8765")
    print("✅ Interrupção de geração otimizada via Thread Pool Executor e troca de contexto assíncrona.")
    
    try:
        await asyncio.Future()
    except KeyboardInterrupt:
        print("\n🛑 Server shutting down...")
        ws_server.close()
        await ws_server.wait_closed()


if __name__ == "__main__":
    asyncio.run(main())