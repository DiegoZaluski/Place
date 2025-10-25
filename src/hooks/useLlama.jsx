import { useState, useEffect, useCallback, useRef } from 'react';

export function useLlama() {
  const [messages, setMessages] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [currentPromptId, setCurrentPromptId] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  
  const messageListeners = useRef({});

  // 1. Limpeza de Listeners (Mantido)
  useEffect(() => {
    return () => {
      Object.values(messageListeners.current).forEach(cleanup => {
        if (typeof cleanup === 'function') {
          cleanup();
        }
      });
    };
  }, []);

  // Função interna para limpar o estado de geração (uso interno e seguro)
  const _cleanupGenerationState = useCallback(() => {
    setIsGenerating(false);
    setCurrentPromptId(null);
  }, []);

  const sendPrompt = useCallback(async (prompt) => {
    if (!prompt?.trim()) {
      console.error('❌ Prompt is empty');
      return;
    }
    
    if (!window.api?.sendPrompt) {
      console.error('❌ API not available');
      setMessages(prev => [...prev, { 
        role: 'error', 
        content: 'API not available - check connection' 
      }]);
      return;
    }

    // Se já estiver gerando, tenta parar o prompt atual primeiro.
    if (isGenerating && currentPromptId) {
        console.warn('⚠️ Already generating, stopping current generation before sending new prompt');
        try {
            await window.api.stopPrompt(currentPromptId);
        } catch (err) {
             console.error('❌ Error sending stop signal to previous prompt:', err);
             _cleanupGenerationState();
        }
    }

    // Prepara e envia o novo prompt
    setMessages(prev => [...prev, { role: 'user', content: prompt.trim() }]);
    setIsGenerating(true);

    try {
      const result = await window.api.sendPrompt(prompt.trim());
      
      if (result.success) {
        setCurrentPromptId(result.promptId); 
        console.log('📤 Prompt sent successfully:', result.promptId);
        setMessages(prev => [...prev, { role: 'assistant', content: '' }]);
      } else {
        throw new Error(result.error || 'Failed to send prompt');
      }
    } catch (err) {
      console.error('❌ Error sending prompt:', err);
      setMessages(prev => [
        ...prev,
        { role: 'error', content: `Error sending prompt: ${err.message}` }
      ]);
      _cleanupGenerationState();
    }
  }, [isGenerating, currentPromptId, _cleanupGenerationState]);


  // CORREÇÃO CHAVE DE FLUXO: Envia o comando, mas a limpeza real é feita pelo listener onComplete.
  const stopGeneration = useCallback(async () => {
    if (currentPromptId && window.api?.stopPrompt) {
      try {
        await window.api.stopPrompt(currentPromptId); 
        console.log('🛑 Stop signal sent for:', currentPromptId);
        // Não limpa o estado aqui. A confirmação do servidor (onComplete) fará isso.
      } catch (err) {
        console.error('❌ Error stopping generation (comm failed):', err);
        _cleanupGenerationState(); // Limpa localmente em caso de falha de comunicação
      }
    } else {
        // Se o estado estiver inconsistente, limpa localmente.
        if (isGenerating) {
            _cleanupGenerationState();
        }
    }
  }, [currentPromptId, isGenerating, _cleanupGenerationState]);

  const clearMemory = useCallback(async () => {
    try {
      if (window.api?.clearMemory) {
        await window.api.clearMemory();
        console.log('🧹 Memory cleared');
      }
    } catch (err) {
      console.error('❌ Error clearing memory:', err);
    }
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
    _cleanupGenerationState();
    clearMemory();
  }, [clearMemory, _cleanupGenerationState]);

  // Setup event listeners
  useEffect(() => {
    if (!window.api) {
      console.warn('⚠️ Window API not available yet');
      return;
    }

    // Novo token (Mantido, garante que apenas o prompt atual seja atualizado)
    messageListeners.current.newToken = window.api.onNewToken((promptId, token) => {
      setMessages(prev => {
        const lastMessage = prev[prev.length - 1];
        if (lastMessage?.role === 'assistant' && promptId === currentPromptId) {
          return [
            ...prev.slice(0, -1),
            { ...lastMessage, content: lastMessage.content + token }
          ];
        } 
        return prev;
      });
    });

    // Conclusão (RESPONSÁVEL PELA LIMPEZA DE ESTADO após geração ou CANCELAMENTO)
    messageListeners.current.complete = window.api.onComplete((promptId) => {
      console.log('✅ Generation complete or Canceled for:', promptId);
      // Limpa o estado APENAS quando o servidor confirma.
      _cleanupGenerationState(); 
    });

    // Erro (Limpa o estado em caso de erro)
    messageListeners.current.error = window.api.onError((promptId, error) => {
      console.error('❌ Model error:', { promptId, error });
      setMessages(prev => [
        ...prev,
        { role: 'error', content: `Error: ${error || 'Unknown error'}` }
      ]);
      _cleanupGenerationState();
    });

    // Conexão e Status
    messageListeners.current.ready = window.api.onReady((data) => {
      console.log('✅ Model ready:', data);
      setIsConnected(true);
      if (data.sessionId) setSessionId(data.sessionId);
    });

    messageListeners.current.disconnected = window.api.onDisconnected(() => {
      console.log('🔌 Model disconnected');
      setIsConnected(false);
      _cleanupGenerationState();
    });

    // Geração iniciada
    messageListeners.current.started = window.api.onStarted((data) => {
      console.log('🚀 Generation started:', data.promptId, 'Session:', data.sessionId);
      setCurrentPromptId(data.promptId);
      if (data.newSessionId) {
        setSessionId(data.newSessionId);
      }
      setIsGenerating(true); 
    });

    messageListeners.current.memoryCleared = window.api.onMemoryCleared((clearedSessionId) => {
      console.log('🧹 Memory cleared for session:', clearedSessionId);
    });

    return () => {
      Object.values(messageListeners.current).forEach(cleanup => {
        if (typeof cleanup === 'function') {
          cleanup();
        }
      });
      messageListeners.current = {};
    };
  }, [currentPromptId, _cleanupGenerationState]);

  return {
    messages,
    isGenerating,
    isConnected,
    currentPromptId,
    sessionId,
    sendPrompt,
    stopGeneration,
    clearMessages,
    clearMemory,
  };
}