import { memo, useState, useEffect } from 'react';
import { Pen, ChevronDown } from 'lucide-react';

const SystemPrompt = memo(({ 
  prompt: externalPrompt = "", 
  onChange,
  isExpanded: externalExpanded = false,
  onToggle,
  className
}: { 
  prompt?: string; 
  onChange?: (value: string) => void;
  isExpanded?: boolean;
  onToggle?: () => void; 
  className?: string;
}) => {
  const [internalPrompt, setInternalPrompt] = useState(externalPrompt);
  const [internalExpanded, setInternalExpanded] = useState(externalExpanded);

  // Sync internal state with external props when they change
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
        className={`w-56 flex items-center justify-between px-6 py-5 font-medium text-sm transition-all duration-200 rounded-xl border border-white/10 mb-1 bg-white/5  ${className}`}
        aria-expanded={internalExpanded}
      >
        <span className="flex items-center gap-2 flex-row text-neutral-300 -translate-x-2">
          <Pen size={16} />
          Prompt System
        </span>
        <ChevronDown 
          size={16}
          className={`transform -translate-x-6 transition-transform duration-300 text-neutral-400 ${internalExpanded ? 'rotate-180' : ''}`}
        />
      </button>

      {internalExpanded && (
        <div className="border border-neutral-700/50 rounded-lg p-4 bg-neutral-950/40 mt-2 transition-all duration-200 -translate-y-1">
          <textarea
            value={internalPrompt}
            onChange={(e) => handleChange(e.target.value)}
            placeholder="Enter system instructions..."
            className="w-full px-3 py-2 bg-neutral-900/60 border border-neutral-700/60 hover:border-neutral-600/60 focus:border-none focus:bg-neutral-900/80 rounded-lg text-sm text-neutral-100 focus:outline-none focus:ring-1 focus:ring-black resize-none h-24 placeholder-neutral-500 transition-all duration-200"
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