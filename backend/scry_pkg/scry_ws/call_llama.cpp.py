import asyncio
import json
import uuid
import time
from typing import List, Dict, Optional, Any, Set
from scry_pkg.scry_ws import MODEL_PATH, CHAT_FORMAT, logger, FALLBACK_PORTS_WEBSOCKET, NAME_OF_MODEL, PROMPT_SYSTEM_PATH
from scry_pkg.scry_sqlite.control_config import ControlConfig
from llama_cpp import Llama, LlamaCache
import websockets
from websockets.exceptions import ConnectionClosedOK
from get_prompt_system import get_prompt_system

CONTEXT_SIZE = 8000


class LlamaChatServer:
    # Cache for dynamic configuration
    _config_cache = None
    _cache_time = 0

    @classmethod
    def get_config(cls):
        now = time.time()
        if not cls._config_cache or (now - cls._cache_time) > 5:
            cls._config_cache = ControlConfig({"id_model": NAME_OF_MODEL}).get()
            cls._cache_time = now
        return cls._config_cache

    def __init__(self, model_path: str, system_prompt: Optional[str] = None):
        # Default LLM parameters
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

        # Initialize LLaMA model
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
        self.__path_system_prompt = PROMPT_SYSTEM_PATH
        self.system_prompt = system_prompt or "You are a helpful, knowledgeable, and professional AI assistant."

    def update_live_config(self):
        # Update LLM parameters from database
        config = self.get_config()
        if config:
            for key, value in config.items():
                setattr(self, key, value)
            logger.info(f"CONFIGPARAMS: {config}")
        else:
            logger.warning("CONFIGPARAMS DEFAULTS USED")

    def get_session_history(self, session_id: str) -> List[Dict[str, str]]:
        # Retrieve or initialize session conversation
        prompt_system = get_prompt_system(self.__path_system_prompt) or self.system_prompt
        if session_id not in self.session_history:
            self.session_history[session_id] = [{"role": "system", "content": prompt_system}]
        return self.session_history[session_id]

    def cleanup_session(self, session_id: str):
        self.session_history.pop(session_id, None)
        logger.info(f"Session cleanup complete for {session_id}")

    async def handle_prompt(self, prompt_id: str, prompt_text: str, session_id: str, websocket: websockets.WebSocketServerProtocol):
        self.update_live_config()
        logger.info(f"Processing prompt {prompt_id} for session {session_id}")

        history = self.get_session_history(session_id).copy()
        history.append({"role": "user", "content": prompt_text})

        loop = asyncio.get_event_loop()

        def get_stream_sync():
            # Synchronous LLM call wrapped for executor
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
                await asyncio.sleep(0)  # yield control for cancellation

                if prompt_id not in self.active_prompts:
                    await websocket.send(json.dumps({"promptId": prompt_id, "complete": True, "type": "complete"}))
                    return

                token = chunk["choices"][0]["delta"].get("content", "")
                if token:
                    response_tokens.append(token)
                    await websocket.send(json.dumps({"promptId": prompt_id, "token": token, "type": "token"}))

            # Append final response to session
            if prompt_id in self.active_prompts:
                self.active_prompts.remove(prompt_id)
                assistant_response = "".join(response_tokens)
                self.get_session_history(session_id).append({"role": "user", "content": prompt_text})
                if assistant_response:
                    self.get_session_history(session_id).append({"role": "assistant", "content": assistant_response})
                await websocket.send(json.dumps({"promptId": prompt_id, "complete": True, "type": "complete"}))
                logger.info(f"Prompt {prompt_id} complete. History length: {len(self.get_session_history(session_id))}")

        except ConnectionClosedOK:
            self.active_prompts.discard(prompt_id)
        except Exception as e:
            logger.error(f"Fatal error during prompt {prompt_id}: {type(e).__name__}: {e}", exc_info=True)
            await self._send_error(websocket, prompt_id, f"Server Error: {e}")
            self.active_prompts.discard(prompt_id)

    async def handle_client(self, websocket: websockets.WebSocketServerProtocol, path: Optional[str] = None):
        session_id = str(uuid.uuid4())[:8]
        logger.info(f"New client connected: {websocket.remote_address} - Session: {session_id}")

        try:
            await websocket.send(json.dumps({"type": "ready", "message": "Model is ready", "sessionId": session_id}))
            async for message in websocket:
                await self._process_client_message(websocket, message, session_id)
        except ConnectionClosedOK:
            logger.info(f"Client disconnected gracefully - Session: {session_id}")
        except Exception as e:
            logger.error(f"Client handler error: {e}")
            await self._send_error(websocket, None, f"Connection failure: {e}")
        finally:
            self.cleanup_session(session_id)

    async def _process_client_message(self, websocket, message, session_id):
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
        except Exception as e:
            await self._send_error(websocket, None, f"Error processing message: {e}")

    async def _handle_prompt_action(self, websocket, data, session_id):
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
        await websocket.send(json.dumps({"promptId": prompt_id, "sessionId": session_id, "status": "started", "type": "started"}))

    async def _handle_cancel_action(self, websocket, data):
        prompt_id = data.get("promptId")
        if prompt_id:
            self.active_prompts.discard(prompt_id)
            await websocket.send(json.dumps({"promptId": prompt_id, "status": "canceled", "type": "status"}))

    async def _handle_clear_history_action(self, websocket, session_id):
        # Reset session conversation
        self.session_history[session_id] = [{"role": "system", "content": "You are a helpful and polite assistant. Always respond in the user's language."}]
        await websocket.send(json.dumps({"sessionId": session_id, "status": "history_cleared", "type": "memory_cleared"}))
        logger.info(f"Session history reset for {session_id}")

    async def _send_error(self, websocket, prompt_id, error_msg):
        data = {"error": error_msg, "type": "error"}
        if prompt_id:
            data["promptId"] = prompt_id
        try:
            await websocket.send(json.dumps(data))
        except Exception as e:
            logger.error(f"Could not send error message: {e}")

    async def bridges(self, data, promptId, promptText, sessionId, websocket):
        # Specialized processing (search or thinking)
        from scry_pkg.scry_tools.search.run_search import RunSearch
        try:
            search_code = data.get("search", 100)
            think_flag = data.get("think", False)

            if search_code in (200, 300):
                response = RunSearch()._search(promptText)
            else:
                response = f"Thinking analysis for: {promptText}" if think_flag else f"Chat response to: {promptText}"
                if search_code == 100:
                    self.get_session_history(sessionId).append({"role": "user", "content": promptText})
                    self.get_session_history(sessionId).append({"role": "assistant", "content": response})

            await websocket.send(json.dumps({"promptId": promptId, "token": response, "type": "token"}))
            await websocket.send(json.dumps({"promptId": promptId, "complete": True, "type": "complete"}))
        except Exception as e:
            logger.error(f"Bridge error: {e}")
            await websocket.send(json.dumps({"promptId": promptId, "error": f"Processing failed: {e}", "type": "error"}))

    def _updateSystemPrompt(self, session_id, new_prompt):
        # Update system prompt for a session
        if session_id in self.session_history:
            for msg in self.session_history[session_id]:
                if msg.get("role") == "system":
                    msg["content"] = new_prompt
                    return
            self.session_history[session_id].insert(0, {"role": "system", "content": new_prompt})

    def router(self, data, promptId, promptText, sessionId, websocket):
        # Route between standard chat and bridges
        searchCode = data.get("search", 100)
        thinkFlag = data.get("think", False)
        if searchCode == 100 and not thinkFlag:
            return self.handle_prompt(promptId, promptText, sessionId, websocket)
        return self.bridges(data, promptId, promptText, sessionId, websocket)


async def main():
    logger.info("Initializing LLaMA model...")
    try:
        server = LlamaChatServer(MODEL_PATH)
    except Exception as e:
        logger.error(f"FATAL: Failed to load LLaMA model at {MODEL_PATH}: {e}")
        return

    ws_server = None
    for port in FALLBACK_PORTS_WEBSOCKET:
        try:
            ws_server = await websockets.serve(
                server.handle_client, "0.0.0.0", port, ping_interval=20, ping_timeout=10, close_timeout=10
            )
            logger.info(f"WebSocket LLaMA server running on ws://0.0.0.0:{port}")
            break
        except OSError as e:
            logger.error(f"WebSocket error: {e}")

    if not ws_server:
        logger.error("WebSocket server failed to start.")
        return

    try:
        await asyncio.Future()
    except KeyboardInterrupt:
        logger.info("Server shutting down...")
        ws_server.close()
        await ws_server.wait_closed()


if __name__ == "__main__":
    asyncio.run(main())
