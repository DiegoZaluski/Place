import asyncio
import json
import uuid
from typing import Dict, Set, Optional, List, Any
from llama_cpp import Llama, LlamaCache
import websockets
from websockets.exceptions import ConnectionClosedOK

# --- Configurações Globais ---
CONTEXT_SIZE = 4096 
MODEL_PATH = model_path = "../transformers/llama.cpp/models/llama-2-7b-chat.Q4_K_M.gguf"

class LlamaChatServer:
    """Servidor WebSocket para chat com modelo LLaMA, otimizado para contexto nativo e interrupção assíncrona."""
    
    def __init__(self, model_path: str):
        # 1. 🚀 Inicialização Otimizada
        self.llm = Llama(
            model_path=model_path, 
            n_ctx=CONTEXT_SIZE,
            n_gpu_layers=-1,  # Máximo uso de VRAM/GPU.
            seed=42,
            verbose=False,
            chat_format="llama-2", 
            use_mlock=True,       
            use_mmap=True
        )
        
        self.llm.set_cache(LlamaCache()) # para Calculos reutilizaveis pelo modelo para aumentar a velocidade de resposta 
        
        self.active_prompts: Set[str] = set()
        self.session_history: Dict[str, List[Dict[str, str]]] = {} #vai recebre um json 
    
    def get_session_history(self, session_id: str) -> List[Dict[str, str]]:
        """Obtém ou cria histórico para uma sessão."""
        if session_id not in self.session_history:
            self.session_history[session_id] = [
                {"role": "system", "content": "Você é um assistente prestativo, amigável e paciente. Responda sempre no idioma do usuário, com clareza e precisão"}
            ]
        return self.session_history[session_id]
    
    def cleanup_session(self, session_id: str) -> None:
        """Remove uma sessão e limpa seu histórico."""
        if session_id in self.session_history:
            del self.session_history[session_id]
        print(f"[SERVER] Session cleanup complete for {session_id}")
    
    async def handle_prompt(
        self, 
        prompt_id: str, 
        prompt_text: str, 
        session_id: str, 
        websocket: websockets.WebSocketServerProtocol
    ) -> None:
        """
        CORREÇÃO: Processa um prompt usando run_in_executor para thread separado, 
        e inclui asyncio.sleep(0) no loop para garantir a prioridade do cancelamento.
        """
        print(f"[SERVER] Processing prompt {prompt_id} for session {session_id}")

        history = self.get_session_history(session_id).copy()
        history.append({"role": "user", "content": prompt_text})
        
        loop = asyncio.get_event_loop()
        
        # Função síncrona que encapsula a chamada bloqueante do LLM
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
            # CORREÇÃO 1: Move a chamada do LLM para o Thread Pool Executor
            stream = await loop.run_in_executor(None, get_stream_sync)
            
            assistant_response = ""
            
            for chunk in stream:
                # CORREÇÃO 2: Ponto de troca de contexto assíncrono
                # Garante que o loop de eventos processe o comando 'cancel' imediatamente.
                await asyncio.sleep(0) 
                
                # 🛑 Verificação de Cancelamento
                if prompt_id not in self.active_prompts:
                    print(f"[SERVER] Prompt {prompt_id} canceled by user request")
                    # Sinaliza a conclusão/parada no frontend (limpeza de estado)
                    await websocket.send(json.dumps({
                        "promptId": prompt_id, 
                        "complete": True,
                        "type": "complete"
                    }))
                    return 

                token = chunk["choices"][0]["delta"].get("content", "")
                
                if token:
                    assistant_response += token
                    await websocket.send(json.dumps({
                        "promptId": prompt_id, 
                        "token": token,
                        "type": "token"
                    }))

            # --- Conclusão (Se não foi cancelado) ---
            if prompt_id in self.active_prompts:
                self.active_prompts.remove(prompt_id)
                
                # Adiciona ao histórico PERMANENTE da sessão.
                self.get_session_history(session_id).append({"role": "user", "content": prompt_text})
                if assistant_response:
                    self.get_session_history(session_id).append({"role": "assistant", "content": assistant_response})
                    
                await websocket.send(json.dumps({
                    "promptId": prompt_id, 
                    "complete": True,
                    "type": "complete"
                }))
                
                print(f"[SERVER] Prompt {prompt_id} complete. New history length: {len(self.get_session_history(session_id))}")

        except ConnectionClosedOK:
            print(f"[SERVER] Connection closed normally during processing of {prompt_id}.")
            self.active_prompts.discard(prompt_id)
        except Exception as e:
            error_msg = f"[SERVER] Fatal error during prompt {prompt_id}: {type(e).__name__}: {e}"
            print(error_msg)
            await self._send_error(websocket, prompt_id, f"Server Error: {e}")
            self.active_prompts.discard(prompt_id)
    
# --- Métodos Auxiliares de Gerenciamento de Cliente ---

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