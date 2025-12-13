import React, { useCallback, useState, useEffect, RefObject } from 'react';
import { ArrowUp, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import SearchButton from './SearchButton';
import ThinkButton from './ThinkButton';
import ClearButton from './ClearButton';

// Color constants
const COLORS = {
  background: 'bg-[#0000004D]',
  text: 'text-white',
  caret: 'caret-white',
  border: 'border-black border-b-2',
  newWindowBorder: 'border-white/50 border-b-2 ', //leave space at the end
  newWindowBg: 'bg-white/5',
  button: {
    base: 'bg-[#F5F5DC]',
    hover: 'hover:bg-white',
    generating: 'hover:bg-red-500 hover:text-white',
    disabled: 'disabled:opacity-50 disabled:cursor-not-allowed'
  },
  tooltip: 'bg-black/30 text-white'
};

interface ClearTooltipProps {
  tooltipRef: RefObject<HTMLSpanElement>;
  className?: string;
}
// Combine with the ClearButton component.
const ClearTooltip = React.memo(({ tooltipRef, className }: ClearTooltipProps) => {
  const { t } = useTranslation();
  return (
    <span
      id="clear"
      ref={tooltipRef}
      className={`
        ${className}
        w-28 
        flex 
        items-center 
        justify-center 
        self-center 
        translate-y-[-100%] 
        mb-2 
        px-2 
        py-2 
        rounded 
        ${COLORS.tooltip}
        text-xs 
        whitespace-nowrap 
        opacity-0 
        transition-opacity 
        duration-300 
        pointer-events-none`}
      role="tooltip"
      >
      {t('clear')}
    </span>
  );
});

interface MessageInputProps {
  textareaRef: RefObject<HTMLTextAreaElement>;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  onHeightAdjust: () => void;
  onClear: () => void;
  tooltipRef: RefObject<HTMLSpanElement>;
  showTooltip: () => void;
  hideTooltip: () => void;
  onSend: (message: string) => void;
  isGenerating: boolean;
  stopGeneration: () => void;
  adaptable: boolean;
  newWindow: boolean;
}

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
  adaptable,
  newWindow
}: MessageInputProps) => {
  const [beenGenerated, setBeenGenerated] = useState<boolean>(isGenerating);

  useEffect(() => {
    if (isGenerating) {
      setBeenGenerated(true);
    }
  }, [isGenerating]);

  // TRANSLATION: move textArea and nearby components 
  const Move = {
      NoGenerate: '-translate-y-96', 
      Generate: 'translate-y-2',
  };

  const handleSubmitOrStop = useCallback((e: React.FormEvent) => {
    e.preventDefault();
      
    if (isGenerating) {
      stopGeneration?.();
    } else if (value && typeof value === 'string' && value.trim()) {
      onSend?.(value.trim());
      onClear?.();
    }
  }, [isGenerating, stopGeneration, value, onSend, onClear]);

  const handleEnterKey = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      
      if (isGenerating) {
        stopGeneration?.();
      } else if (value && typeof value === 'string' && value.trim()) {
        onSend?.(value.trim());
        onClear?.();
      }
    }  
  }, [isGenerating, stopGeneration, value, onSend, onClear]);
  
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
    onHeightAdjust();
  };

  const SendStopButton = isGenerating ? (
    <X className="w-4 h-4 text-black hover:text-white" />
  ) : (
    <ArrowUp className="w-4 h-4 text-black" />
  );
  
  const isButtonDisabled = isGenerating ? false : !(value && typeof value === 'string' && value.trim());

  return (
    <form 
      onSubmit={handleSubmitOrStop} 
      className="flex flex-col relative w-96 xl:w-1/2 md:w-2/4 -translate-y-16 z-10"
    >
      <div className={`flex flex-col relative w-full ${!beenGenerated && adaptable ? 'hidden' : ''}`}>
        <ClearTooltip 
          tooltipRef={tooltipRef}
          className={`${adaptable ? `${Move.Generate}` : ''}`} 
        />
        <ClearButton 
          onMouseEnter={showTooltip}
          onMouseLeave={hideTooltip}
          onClick={onClear}
          className={`${adaptable ? `${Move.Generate}` : ''}`}
        />
        <div className="relative">
          <textarea
            ref={textareaRef}
            placeholder={placeholder}
            value={value || ''}
            onChange={handleChange}
            className={`
              ${COLORS.background}
              w-full
              ${adaptable ? `min-h-[6rem] max-h-20 ${Move.Generate}` : `min-h-[9rem] max-h-40`}
              ${newWindow ? `min-h-[6rem] max-h-20 `: `min-h-[9rem] max-h-40`}
              outline-none
              ${COLORS.caret}
              ${COLORS.text}
              ${newWindow ? COLORS.newWindowBorder + COLORS.newWindowBg: COLORS.border}
              rounded-3xl 
              p-4
              pr-12
              pl-12
              resize-none 
              overflow-hidden 
              shadow-b-xl 
            `}
            rows={1}
            style={{ scrollbarWidth: 'none' }}
            onKeyDown={handleEnterKey} 
            disabled={isGenerating} 
          />
          <button
            type="submit"
            disabled={isButtonDisabled}
            className={`
              absolute  
              ${adaptable ? 'right-4 bottom-4' : 'right-4 bottom-6'}
              ${adaptable ? `w-6 h-6 ${Move.Generate}` : 'w-8 h-8'}
              ${COLORS.button.base}
              rounded-full 
              flex items-center 
              justify-center 
              transition-colors 
              duration-200 
              ${COLORS.button.disabled} ${
              isGenerating ? COLORS.button.generating : COLORS.button.hover
            }`}
          >
            {SendStopButton}
          </button>
          <div className={`
            absolute 
            left-4 
            bottom-4 
            w-16 
            h-8
            ${adaptable ? 'left-4 bottom-4 w-12 h-6' : 'left-6 bottom-6'}`}>
            <SearchButton />
          </div>
          <div className={`
            absolute 
            left-[100px] 
            bottom-4 
            w-16 
            h-8
            ${adaptable ? 'left-[70px] bottom-4 w-12 h-6' : 'left-6 bottom-6'}`}>
            <ThinkButton />
          </div>
        </div>
      </div>

      {!beenGenerated && adaptable && (
        <div className="flex flex-col relative w-full">
          <div className="relative">
            <textarea
              ref={textareaRef}
              placeholder={placeholder}
              value={value || ''}
              onChange={handleChange}
              className={`
                ${COLORS.background}
                w-full
                min-h-[6rem] max-h-20 ${Move.NoGenerate}
                outline-none
                ${COLORS.caret}
                ${COLORS.text}
                ${COLORS.border}
                rounded-3xl 
                p-4
                pr-12
                resize-none 
                overflow-hidden 
                shadow-b-xl 
              `}
              rows={1}
              style={{ scrollbarWidth: 'none' }}
              onKeyDown={handleEnterKey} 
              disabled={isGenerating} 
            />
            <button
              type="submit"
              disabled={isButtonDisabled}
              className={`
                absolute 
                right-4 
                bottom-4 
                w-6 h-6 ${Move.NoGenerate}
                ${COLORS.button.base}
                rounded-full 
                flex items-center 
                justify-center 
                transition-colors 
                duration-200 
                ${COLORS.button.disabled} ${
                isGenerating ? COLORS.button.generating : COLORS.button.hover
              }`}
            >
              {SendStopButton}
            </button>
          </div>
        </div>
      )}
    </form>
  );
});

export default MessageInput;