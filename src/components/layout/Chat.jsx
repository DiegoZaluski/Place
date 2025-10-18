// components/Chat.js
import React, { useState, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import MessageInput from './MessageInput';
import ResBox from './ResBox';

// Custom hook to manage tooltip
const useTooltip = () => {
  const tooltipRef = useRef(null);
  
  const showTooltip = useCallback(() => {
    if (tooltipRef.current) {
      tooltipRef.current.style.opacity = '1';
    }
  }, []);
  
  const hideTooltip = useCallback(() => {
    if (tooltipRef.current) {
      tooltipRef.current.style.opacity = '0';
    }
  }, []);
  
  return { tooltipRef, showTooltip, hideTooltip };
};

// Custom hook for textarea auto-resize
const useAutoResize = () => {
  const textareaRef = useRef(null);
  
  const adjustHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }, []);
  
  return { textareaRef, adjustHeight };
};

// Custom hook to manage chat state
const useChatState = () => {
  const [showOp, setShowOp] = useState(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const chatRef = useRef(null);

  const sendMessage = useCallback((messageText) => {
    if (!messageText.trim()) return;
    
    // Add user message
    const userMessage = { text: messageText, sender: 'user' };
    setMessages(prev => [...prev, userMessage]);
    
    // Simulate bot response
    setIsGenerating(true);
    setTimeout(() => {
      const botResponse = { 
        text: `This is a response to: ${messageText}`,
        sender: 'bot',
      };
      setMessages(prev => [...prev, botResponse]);
      setIsGenerating(false);
    }, 1000);
  }, []);

  const handleSend = useCallback((messageText) => {
    if (!messageText.trim()) return;
    sendMessage(messageText);
    setMessage('');
  }, [sendMessage]);

  const toggleMenu = useCallback(() => {
    setShowOp(prev => !prev);
  }, []);

  const closeMenu = useCallback(() => {
    setShowOp(false);
  }, []);

  const handleHeightAdjust = useCallback((height) => {
    console.log('Height adjusted:', height);
  }, []);

  const clearMessage = useCallback(() => {
    setMessage('');
  }, []);

  const updateMessage = useCallback((event) => {
    const value = typeof event === 'string' ? event : event?.target?.value || '';
    setMessage(value);
  }, []);

  return {
    showOp,
    message,
    toggleMenu,
    closeMenu,
    updateMessage,
    clearMessage,
    handleHeightAdjust,
    handleSend,
    isGenerating,
    stopGeneration: () => setIsGenerating(false),
    messages,
    chatRef,
  };
};

// Isolated Header component
const ChatHeader = React.memo(() => (
  <header className="h-20 w-full flex items-center flex-row text-white shadow-b-md z-10">
    {/*ADD:conteudos futuros para o header*/}
  </header>
));

// Main Chat component
const Chat = () => {
  const { t, ready } = useTranslation(['auth']);
  const { 
    message,
    updateMessage,
    clearMessage,
    handleSend,
    isConnected,
    isGenerating, 
    stopGeneration,
    messages,
    showOp,
    toggleMenu,
    closeMenu
  } = useChatState();
  const { tooltipRef, showTooltip, hideTooltip } = useTooltip();
  const { textareaRef, adjustHeight } = useAutoResize();
  
  // Loading state
  if (!ready) {
    return (
      <div className="flex items-center justify-center h-screen w-full bg-[#0f0f11] text-white">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-wrap justify-center items-center h-screen w-full paddEnv bg-[#0f0f11] p-0 m-0 noScroll">
      
      {/* Header */}
      <ChatHeader 
        showOp={showOp}
        onToggleMenu={toggleMenu}
        t={t}
      />
      
      {/* Main Content Area */}
      <div
        onClick={closeMenu}
        className="flex flex-col justify-end items-center flex-1 w-full bg-[#0f0f11]"
        role="main"
      >
        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto w-full">
          <ResBox 
            messages={messages}
            isGenerating={isGenerating} 
            showTypingIndicator={isGenerating}
            showWelcome={messages.length === 0 && !isConnected}
          />
        </div>
        
        {/* Input Container */}
        <MessageInput 
          textareaRef={textareaRef}
          value={message}
          onChange={updateMessage}
          placeholder={isConnected ? t('question') : 'enviar mensagem'}
          onHeightAdjust={adjustHeight}
          onClear={clearMessage}
          onSend={handleSend} 
          tooltipRef={tooltipRef}
          showTooltip={showTooltip}
          hideTooltip={hideTooltip}
          isGenerating={isGenerating} 
          stopGeneration={stopGeneration}
          disabled={!isConnected}
        />
      </div>
      
      {/* Footer */}
      <footer className="flex items-center justify-center h-10 w-full text-white bg-[#0f0f11] text-sm">
        <span>Place&trade;</span>
      </footer>
      
    </div>
  );
};

// Add displayName for debugging
Chat.displayName = 'Chat';
ChatHeader.displayName = 'ChatHeader';

export default Chat;
