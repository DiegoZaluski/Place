import { memo, useState, useEffect, useRef } from 'react';
import { Pen } from 'lucide-react';

interface SystemPromptProps {
  prompt?: string;
  onChange?: (value: string) => void;
  isExpanded?: boolean;
  onToggle?: () => void;
  className?: string;
}

const SystemPrompt = memo(({ 
  prompt: externalPrompt = "", 
  onChange,
  isExpanded: externalExpanded = false,
  onToggle,
  className = ""
}: SystemPromptProps) => {
  const [internalPrompt, setInternalPrompt] = useState(externalPrompt);
  const [internalExpanded, setInternalExpanded] = useState(externalExpanded);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const sendSystemPrompt = async (promptToSend: string) => {
    try {
      const response = await fetch('http://localhost:8001/prompt_system', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(internalPrompt)
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Erro HTTP: ${response.status}`);
      }
      
      const data = await response.json();
      console.log(data);
      return data;
    } catch {
      console.error('Error when sending the system prompt');
    }
  };

  const handleBlur = () => {
    if (internalPrompt && internalPrompt.trim().length > 0) {
      sendSystemPrompt(internalPrompt);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (internalPrompt && internalPrompt.trim().length > 0) {
        sendSystemPrompt(internalPrompt);
      }
    }
  };

  useEffect(() => {
    setInternalPrompt(externalPrompt);
  }, [externalPrompt]);

  useEffect(() => {
    setInternalExpanded(externalExpanded);
  }, [externalExpanded]);

  const handleToggle = () => {
    const newExpanded = !internalExpanded;
    setInternalExpanded(newExpanded);
    onToggle?.();
  };

  const handleChange = (value: string) => {
    setInternalPrompt(value);
    onChange?.(value);
  };

  return (
    <>
      <button
        onClick={handleToggle}
        className={`
          w-full flex items-center justify-center px-6 py-5 
          font-medium text-sm transition-all duration-200 
          rounded-xl border border-white/10 mb-1 
          bg-white/5 active:bg-white/20 
          ${className}
        `}
        aria-expanded={internalExpanded}
      >
        <span className="flex items-center gap-2 flex-row text-neutral-300 -translate-x-2">
          <Pen size={16} />
          Prompt System
        </span>
      </button>

      {internalExpanded && (
        <div className="
          border border-neutral-700/50 rounded-lg p-4 
          bg-neutral-950/40 mt-2 transition-all duration-200 
          -translate-y-1
        ">
          <textarea
            ref={textareaRef}
            value={internalPrompt}
            onChange={(e) => handleChange(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            placeholder="Enter system instructions... Shift+Enter for new line, Enter to send"
            className="
              w-full px-3 py-2 bg-neutral-900/60 
              border border-neutral-700/60 hover:border-neutral-600/60 
              focus:border-none focus:bg-neutral-900/80 
              rounded-lg text-sm text-neutral-100 
              focus:outline-none focus:ring-1 focus:ring-black 
              resize-none h-24 placeholder-neutral-500 
              transition-all duration-200
            "
            maxLength={1000}
          />
          <p className="text-xs text-neutral-400 mt-2 font-medium">
            {internalPrompt.length}/1000
          </p>
        </div>
      )}
    </>
  );
});

SystemPrompt.displayName = 'SystemPrompt';

export default SystemPrompt;