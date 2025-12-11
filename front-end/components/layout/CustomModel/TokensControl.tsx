import { memo, useState, useEffect, useRef } from 'react';
import { MessageCircle } from 'lucide-react';
import { dispatchLlamaConfigEvent, LlamaConfigEventDetail } from '../../../global/eventCofigLlm'

const TokensControl = memo(({ 
  maxTokens, 
  onChange,
  className = "",
  id_model,
}: { 
  maxTokens: number; 
  onChange: (value: number) => void;
  className?: string;
  id_model: string;
}) => {
  const [internalTokens, setInternalTokens] = useState(maxTokens);
  const [inputValue, setInputValue] = useState(maxTokens.toString());
  const controlRef = useRef<HTMLDivElement>(null);

  // Sync with external prop changes
  useEffect(() => {
    setInternalTokens(maxTokens);
    setInputValue(maxTokens.toString());
  }, [maxTokens]);

  const sendEvent = (value: number) => {
    const clampedValue = Math.min(Math.max(value, 128), 8192);
    setInternalTokens(clampedValue);
    onChange(clampedValue);

    if (controlRef.current && id_model) {
      const payload: LlamaConfigEventDetail = {
        id_model: id_model,
        tokens: clampedValue,
      };
      dispatchLlamaConfigEvent(controlRef.current, payload);
    }
  };

  const handleInputChange = (value: string) => {
    setInputValue(value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const numValue = parseInt(inputValue);
      if (!isNaN(numValue)) {
        sendEvent(numValue);
        setInputValue(numValue.toString());
      }
    }
  };

  const handleBlur = () => {
    const numValue = parseInt(inputValue);
    if (isNaN(numValue)) {
      setInputValue(internalTokens.toString());
      return;
    }
    
    sendEvent(numValue);
    setInputValue(internalTokens.toString());
  };

  return (
    <div ref={controlRef} className={`${className}`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-neutral-500">
          {internalTokens.toLocaleString()} tokens
        </span>
      </div>

      <div className="relative">
        <MessageCircle size={20} stroke={document.documentElement.getAttribute('data-theme') === 'dark' ? 'white' : 'currentColor'}/>
        <input
          type="number"
          value={inputValue}
          onChange={(e) => handleInputChange(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className={`
          absolute
          -top-1
          left-6
          w-12
          text-center 
          dark-text-primary 
          font-semibold 
          focus:outline-none 
          focus:border-none 
          focus:ring-none
          [appearance:textfield] 
          [&::-webkit-outer-spin-button]:appearance-none 
          [&::-webkit-inner-spin-button]:appearance-none
          text-sm 
          font-bold 
          bg-white/10 border border-white/10 
          rounded-lg 
          pt-1 
          pb-1 
          transition-all 
          duration-200
            `}
        />
        <div className="flex gap-3 text-xs text-neutral-400 mt-4">
          <span>Min: 128</span>
          <span>Max: 8,192</span>
        </div>
      </div>
    </div>
  );
});

export default TokensControl;