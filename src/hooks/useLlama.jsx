import { useState, useEffect, useCallback, useRef } from 'react';

export function useLlama() {
  const [messages, setMessages] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [currentPromptId, setCurrentPromptId] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  
  const messageListeners = useRef({});

  // Listener Cleanup (Maintained)
  useEffect(() => {
    return () => {
      Object.values(messageListeners.current).forEach(cleanup => {
        if (typeof cleanup === 'function') {
          cleanup();
        }
      });
    };
  }, []);

  // Internal function to clear the generation state (for internal and safe use).
  const _cleanupGenerationState = useCallback(() => {
    setIsGenerating(false);
    setCurrentPromptId(null);
  }, []);

  const sendPrompt = useCallback(async (prompt) => {
    if (!prompt?.trim()) {
      console.error('Prompt is empty');
      return;
    }
    
    if (!window.api?.sendPrompt) {
      console.error('API not available');
      setMessages(prev => [...prev, { 
        role: 'error', 
        content: 'API not available - check connection' 
      }]);
      return;
    }

    // If it's already generating, try stopping the current prompt first.
    if (isGenerating && currentPromptId) {
        console.warn('Already generating, stopping current generation before sending new prompt');
        try {
            await window.api.stopPrompt(currentPromptId);
        } catch (err) {
             console.error('Error sending stop signal to previous prompt:', err);
             _cleanupGenerationState();
        }
    }

    // Prepare and send the new prompt.
    setMessages(prev => [...prev, { role: 'user', content: prompt.trim() }]);
    setIsGenerating(true);

    try {
      const result = await window.api.sendPrompt(prompt.trim());
      
      if (result.success) {
        setCurrentPromptId(result.promptId); 
        console.log('Prompt sent successfully:', result.promptId);
        setMessages(prev => [...prev, { role: 'assistant', content: '' }]);
      } else {
        throw new Error(result.error || 'Failed to send prompt');
      }
    } catch (err) {
      console.error('Error sending prompt:', err);
      setMessages(prev => [
        ...prev,
        { role: 'error', content: `Error sending prompt: ${err.message}` }
      ]);
      _cleanupGenerationState();
    }
  }, [isGenerating, currentPromptId, _cleanupGenerationState]);


  // FLOW KEY CORRECTION: Sends the command, but the actual cleanup is done by the onComplete listener.
  const stopGeneration = useCallback(async () => {
    if (currentPromptId && window.api?.stopPrompt) {
      try {
        await window.api.stopPrompt(currentPromptId); 
        console.log('Stop signal sent for:', currentPromptId);
        // It doesn't clear the state here. The server confirmation (onComplete) will do that.
      } catch (err) {
        console.error('Error stopping generation (comm failed):', err);
        _cleanupGenerationState(); // Clears locally in case of communication failure.
      }
    } else {
        // If the state is inconsistent, clear it locally.
        if (isGenerating) {
            _cleanupGenerationState();
        }
    }
  }, [currentPromptId, isGenerating, _cleanupGenerationState]);

  const clearMemory = useCallback(async () => {
    try {
      if (window.api?.clearMemory) {
        await window.api.clearMemory();
        console.log('Memory cleared');
      }
    } catch (err) {
      console.error('Error clearing memory:', err);
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
      console.warn('Window API not available yet');
      return;
    }

    // New token (Maintained, ensures that only the current prompt is updated)
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

    // Conclusion (RESPONSIBLE FOR CLEANING UP THE STATUS after generation or CANCELLATION)
    messageListeners.current.complete = window.api.onComplete((promptId) => {
      console.log('Generation complete or Canceled for:', promptId);
      // Clear the state ONLY when the server confirms.
      _cleanupGenerationState(); 
    });

    messageListeners.current.error = window.api.onError((promptId, error) => {
      console.error('Model error:', { promptId, error });
      setMessages(prev => [
        ...prev,
        { role: 'error', content: `Error: ${error || 'Unknown error'}` }
      ]);
      _cleanupGenerationState();
    });

    // Status and connection
    messageListeners.current.ready = window.api.onReady((data) => {
      console.log('Model ready:', data);
      setIsConnected(true);
      if (data.sessionId) setSessionId(data.sessionId);
    });

    messageListeners.current.disconnected = window.api.onDisconnected(() => {
      console.log('Model disconnected');
      setIsConnected(false);
      _cleanupGenerationState();
    });

    // initialization
    messageListeners.current.started = window.api.onStarted((data) => {
      console.log('Generation started:', data.promptId, 'Session:', data.sessionId);
      setCurrentPromptId(data.promptId);
      if (data.newSessionId) {
        setSessionId(data.newSessionId);
      }
      setIsGenerating(true); 
    });

    messageListeners.current.memoryCleared = window.api.onMemoryCleared((clearedSessionId) => {
      console.log('Memory cleared for session:', clearedSessionId);
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