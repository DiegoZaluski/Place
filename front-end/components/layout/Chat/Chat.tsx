import React, { useRef, useContext } from 'react';
import { useTranslation } from 'react-i18next';
import MessageInput from './MessageInput';
import ResBox from './ResBox';
import { useLlama } from '../../../hooks/useLlama';
import { BackBtn, MinimizeBtn, MaximizeBtn, CloseBtn } from '../../shared/WindowsComponents'
import { AppContext } from '../../../global/AppProvider';
import SideOption from './SideOption';
// COLORS
const COLORS = {
  BACKGROUND: `bg-chat`,
  TEXT: 'text-white',
  SHADOW: 'shadow-b-md',
} as const;

// HOOK: CUSTOM TOOLTIP MANAGEMENT
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

// HOOK: TEXTAREA AUTO-RESIZE FUNCTIONALITY
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

// COMPONENT: ISOLATED HEADER SECTION
const ChatHeader = React.memo(() => (
  <header className={`
    h-20
    w-full
    flex
    items-center
    ${COLORS.TEXT}
    ${COLORS.SHADOW}
    z-10
  `}>
    <div className={`
      flex
      items-center
      ml-8
      flex-1
    `}>
      <BackBtn whiteFixed={true} />
    </div>
    
    <div className={`
      flex-1
      flex
      justify-center
    `}>
      {/* FUTURE: content placeholder for header expansion */}
    </div>
    
    <div className={`
      flex
      items-center
      justify-end
      gap-4
      mr-10
      flex-1
    `}>
      <MinimizeBtn whiteFixed={true} />
      <MaximizeBtn whiteFixed={true} />
      <CloseBtn whiteFixed={true} />
    </div>
  </header>
));
  
type AdaptableProps = true | false;
type NewWindow = true | false;
type typeSearchCode = 100 | 200 | 300;
// COMPONENT: MAIN CHAT CONTAINER
const Chat = ({ adaptable, newWindow }: {adaptable: AdaptableProps, newWindow?: NewWindow }) => {
  // TRANSLATION: initialize localization with auth namespace
  const { t, ready } = useTranslation(['auth']);

  const CONTEXT = useContext(AppContext);
  const searchCode  = CONTEXT.searchCode // 100 not search | 200 simple search | 300 deep search 
  const thinking = CONTEXT.thinking
  console.log(searchCode, thinking);
   
  // LLAMA: use real llama hook for messaging functionality
  const {
    messages,
    isGenerating,
    sendPrompt,
    stopGeneration,
    clearMessages
  } = useLlama();
  
  // STATE: message input management
  const [message, setMessage] = React.useState('');
  
  // TOOLTIP: custom tooltip hook instance
  const { tooltipRef, showTooltip, hideTooltip } = useTooltip();
  
  // TEXTAREA: auto-resize hook instance
  const { textareaRef, adjustHeight } = useAutoResize();
  
  // HANDLER: send message to llama
  const handleSend = (msg: string) => {
    if (!msg?.trim()) return;
    sendPrompt(JSON.stringify({
      action: "prompt",
      prompt: msg,
      promptId: null,
      search: searchCode, // 100 not search | 200 simple search | 300 deep search
      think: thinking,
      timeStamp: new Date().toISOString()
    }));
    setMessage('');
  };
  
  // HANDLER: update message state from input
  const updateMessage = (e: React.ChangeEvent<HTMLTextAreaElement> | string) => {
    const value = typeof e === 'string' ? e : e?.target?.value || '';
    setMessage(value);
  };
  
  // HANDLER: clear message input field
  const clearMessage = () => setMessage('');
  
  // LOADING: render loading state until translation ready
  if (!ready) {
    return (
      <div className={`
        flex
        items-center
        justify-center
        h-screen
        w-full
        ${COLORS.TEXT}
        `}
        style={{ backgroundColor: COLORS.BACKGROUND }}
      >
        <div className="text-lg">Loading...</div>
      </div>
    );
  }
  
  // RENDER: main chat interface
  return (
    <div 
    className={`
      flex
      flex-col
      flex-wrap
      justify-center
      items-center
      w-full
      p-0
      m-0
      paddEnv
      noScroll
      ${newWindow ? 'bg-black/50' : COLORS.BACKGROUND}
      ${COLORS.TEXT}
      ${adaptable ? 'h-full' : newWindow? `h-full rounded-xl` : 'h-screen'}
    `}
    > 
    { adaptable || newWindow ? null : <SideOption/>} 
    { adaptable || newWindow ? null : <ChatHeader/>} 

      <div
        className={`
          flex
          flex-col
          justify-end
          items-center
          flex-1
          w-full 
        `}
        role="main"
      >
        <div className="
          flex-1 
          overflow-y-auto 
          w-full">
          <ResBox 
            messages={messages}
            isGenerating={isGenerating} 
            showTypingIndicator={isGenerating}
            showWelcome={messages.length === 0}
            adaptable={adaptable? true : false}
            newWindow={newWindow? true : false}
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
          adaptable={adaptable? true : false}
          newWindow = {newWindow? true: false}
        />
      </div>

      {adaptable ? null :        
        <footer className={`
          flex
          items-center
          justify-center
          h-10
          w-full
          ${COLORS.TEXT}
          text-sm
        `}
        style={{ backgroundColor: COLORS.BACKGROUND }}
        >
          <span>Scry&trade;</span>
        </footer>}
    </div>
  );
};

Chat.displayName = 'Chat';
ChatHeader.displayName = 'ChatHeader';

export default Chat;