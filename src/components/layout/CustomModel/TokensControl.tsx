import { memo, useState, useEffect } from 'react';
import {MessageCircle} from 'lucide-react';

const TokensControl = memo(({ 
  maxTokens, 
  onChange,
  className = ""
}: { 
  maxTokens: number; 
  onChange: (value: number) => void;
  className?: string;
}) => {
  const [internalTokens, setInternalTokens] = useState(maxTokens);

  // Sync with external prop changes
  useEffect(() => {
    setInternalTokens(maxTokens);
  }, [maxTokens]);

  const handleChange = (value: number) => {
    const clampedValue = Math.min(Math.max(value, 128), 8192);
    setInternalTokens(clampedValue);
    onChange(clampedValue);
  };

  return (
    <div className={`pl-5 pt-5 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-neutral-500">
          {internalTokens.toLocaleString()} tokens
        </span>
      </div>

      <div className="relative">
        <MessageCircle size={16} stroke={document.documentElement.getAttribute('data-theme') === 'dark' ? 'white' : 'currentColor'}/>
        <input
          type="number"
          value={internalTokens}
          onChange={(e) => handleChange(parseInt(e.target.value) || 128)}
          min="128"
          max="8192"
          className={`
          absolute
          -top-1
          left-6
          w-full
          text-start 
          bg-transparent 
          dark-text-primary 
          font-semibold 
          focus:outline-none 
          focus:border-none 
          [appearance:textfield] 
          [&::-webkit-outer-spin-button]:appearance-none 
          [&::-webkit-inner-spin-button]:appearance-none
            `}
        />
        <div className="flex gap-2 text-xs text-neutral-400 mt-2">
          <span>Min: 128</span>
          <span>Max: 8,192</span>
        </div>
      </div>
    </div>
  );
});

export default TokensControl;