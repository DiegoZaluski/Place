import React, { useRef, useContext } from 'react';
import { useTranslation } from 'react-i18next';
import MessageInput from './MessageInput';
import ResBox from './ResBox';
import { useLlama } from '../../../hooks/useLlama';
import { BackBtn, MinimizeBtn, MaximizeBtn, CloseBtn } from '../../shared/buttons/CtrlWindow'
import { AppContext } from '../../../global/AppProvider';
import SideOption from './SideOption';
import Header from '@/components/shared/header/Header';

const COLORS = {
  BACKGROUND: `bg-chat`,
  TEXT: 'text-white',
  SHADOW: 'shadow-b-md',
} as const;

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
  
type AdaptableProps = true | false;
type NewWindow = true | false;

const Chat = ({ adaptable, newWindow }: {adaptable: AdaptableProps, newWindow?: NewWindow }) => {
  // TRANSLATION
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
  
  const [message, setMessage] = React.useState('');
  const { tooltipRef, showTooltip, hideTooltip } = useTooltip();
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

  const updateMessage = (e: React.ChangeEvent<HTMLTextAreaElement> | string) => {
    const value = typeof e === 'string' ? e : e?.target?.value || '';
    setMessage(value);
  };

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
    { adaptable || newWindow ? null : <Header home={false}/>} 

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
export default Chat;