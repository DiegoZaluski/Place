import React, { useCallback } from 'react';
import { Plus, ArrowUp, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const ClearTooltip = React.memo(({ tooltipRef }) => {
  const { t } = useTranslation();
  return (
    <span
      id="clear"
      ref={tooltipRef}
      className="w-28 flex items-center justify-center self-center translate-y-[-100%] mb-2 px-2 py-2 rounded bg-black text-white text-xs whitespace-nowrap opacity-0 transition-opacity duration-300 pointer-events-none"
      role="tooltip"
      >
      {t('clear')}
    </span>
  );
});

const ClearButton = React.memo(({ onMouseEnter, onMouseLeave, onClick }) => (
  <button
    onMouseEnter={onMouseEnter}
    onMouseLeave={onMouseLeave}
    onClick={onClick}
    className="flex w-14 h-12 rounded-md bottom-2 transform -translate-y-1/2 items-center justify-center self-center relative"
    aria-label="Clear message"
    type="button"
    >
    <Plus className="text-white hover:text-red-500 transition-colors duration-200" />
  </button>
));

const MessageInput = React.memo(({ 
  textareaRef, 
  value, 
  onChange, 
  placeholder,
  onHeightAdjust,
  onClear,
  tooltipRef,
  showTooltip,
  hideTooltip,
  onSend,
  isGenerating, 
  stopGeneration, 
}) => {
  
  const handleSubmitOrStop = useCallback((e) => {
    e.preventDefault();
      
    if (isGenerating) {
      stopGeneration && stopGeneration();
    } else if (value && typeof value === 'string' && value.trim()) {
      onSend && onSend(value.trim());
      onClear && onClear();
    }
  }, [isGenerating, stopGeneration, value, onSend, onClear]);


  const handleEnterKey = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) 
    {
      e.preventDefault();
      
      if (isGenerating) {
        stopGeneration && stopGeneration();
      } else if (value && typeof value === 'string' && value.trim()) {
        onSend && onSend(value.trim());
        onClear && onClear();
      }
    }  
  }, [isGenerating, stopGeneration, value, onSend, onClear]);
  
  const handleChange = (e) => {
    onChange(e.target.value);
    onHeightAdjust();
  };

  const SendStopButton = isGenerating ? (
    <X className="w-4 h-4" />
  ) : (
    <ArrowUp className="w-4 h-4 text-black" />
  );
  
  const isButtonDisabled = isGenerating ? false : !(value && typeof value === 'string' && value.trim());

  return (
    <form 
      onSubmit={handleSubmitOrStop} 
      className="flex flex-col relative w-96 xl:w-1/2 md:w-2/4 -translate-y-16 z-10"
      >
      <div className="flex flex-col relative w-full">
        <ClearTooltip tooltipRef={tooltipRef} />
        <ClearButton 
          onMouseEnter={showTooltip}
          onMouseLeave={hideTooltip}
          onClick={onClear}
        />
        <textarea
          ref={textareaRef}
          placeholder={placeholder}
          value={value || ''}
          onChange={handleChange}
          className="bg-[#0000004D] w-full min-h-[9rem] max-h-40 outline-none caret-white text-white border border-black border-b-2 rounded-3xl p-4 pr-12 resize-none overflow-hidden shadow-b-xl transition-all duration-200"
          rows="1"
          style={{ scrollbarWidth: 'none' }}
          aria-label="Type your message"
          onKeyDown={handleEnterKey} 
          disabled={isGenerating} 
        />
        <button
          type="submit"
          disabled={isButtonDisabled}
          className={`absolute right-4 bottom-4 w-8 h-8 bg-[#F5F5DC] rounded-full flex items-center justify-center transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
            isGenerating ? 'hover:bg-red-500 hover:text-white' : 'hover:bg-white'
          }`}
        >
          {SendStopButton}
        </button>
      </div>
    </form>
  );
});

export default MessageInput;


