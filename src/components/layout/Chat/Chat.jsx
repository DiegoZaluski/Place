// components/Chat.js
import React, { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import MessageInput from './MessageInput';
import ResBox from './ResBox';
import { useLlama } from '../../../hooks/useLlama';

// Custom hook to manage tooltip
const useTooltip = () => {
  const tooltipRef = useRef(null);
  
  const showTooltip = () => {
    if (tooltipRef.current) tooltipRef.current.style.opacity = '1';
  };
  
  const hideTooltip = () => {
    if (tooltipRef.current) tooltipRef.current.style.opacity = '0';
  };
  
  return { tooltipRef, showTooltip, hideTooltip };
};

// Custom hook for textarea auto-resize
const useAutoResize = () => {
  const textareaRef = useRef(null);
  
  const adjustHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  };
  
  return { textareaRef, adjustHeight };
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
  
  // Aqui usamos o hook real do LLaMA
  const {
    messages,
    isGenerating,
    sendPrompt,
    stopGeneration,
    clearMessages
  } = useLlama();

  const [message, setMessage] = React.useState('');
  const { tooltipRef, showTooltip, hideTooltip } = useTooltip();
  const { textareaRef, adjustHeight } = useAutoResize();

  const handleSend = (msg) => {
    if (!msg?.trim()) return;
    sendPrompt(msg);
    setMessage('');
  };

  const updateMessage = (e) => {
    const value = typeof e === 'string' ? e : e?.target?.value || '';
    setMessage(value);
  };

  const clearMessage = () => setMessage('');

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
      
      <ChatHeader />

      <div
        className="flex flex-col justify-end items-center flex-1 w-full bg-[#0f0f11]"
        role="main"
      >
        <div className="flex-1 overflow-y-auto w-full">
          <ResBox 
            messages={messages}
            isGenerating={isGenerating} 
            showTypingIndicator={isGenerating}
            showWelcome={messages.length === 0}
          />
        </div>
        
        <MessageInput 
          textareaRef={textareaRef}
          value={message}
          onChange={updateMessage}
          placeholder={t('question')}
          onHeightAdjust={adjustHeight}
          onClear={clearMessage}
          onSend={handleSend} 
          tooltipRef={tooltipRef}
          showTooltip={showTooltip}
          hideTooltip={hideTooltip}
          isGenerating={isGenerating} 
          stopGeneration={stopGeneration}
        />
      </div>
      
      <footer className="flex items-center justify-center h-10 w-full text-white bg-[#0f0f11] text-sm">
        <span>Place&trade;</span>
      </footer>
      
    </div>
  );
};

Chat.displayName = 'Chat';
ChatHeader.displayName = 'ChatHeader';

export default Chat;
