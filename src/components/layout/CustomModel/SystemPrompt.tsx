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
// h
  return (
    <>
      <button
        onClick={handleToggle}
        className={`w-full flex items-center justify-between px-4 py-3 font-medium text-sm transition-all ${className} 
        ${
          internalExpanded
            ? 'text-primary border-neutral-900'
            : 'border-neutral-300 text-primary hover:border-neutral-400'
        }`}
        aria-expanded={internalExpanded}
      >
        <span className="flex items-center gap-2 flex-row">
          <Pen size={16} />
          Prompt System
        </span>
        <ChevronDown 
          size={16}
          className={`transform -translate-x-6 transition-transform ${internalExpanded ? 'rotate-180' : ''}`}
        />
      </button>

      {internalExpanded && (
        <div className="border border-neutral-300 rounded-lg p-4 bg-neutral-50">
          <textarea
            value={internalPrompt}
            onChange={(e) => handleChange(e.target.value)}
            placeholder="Enter system instructions..."
            className="w-full px-3 py-2 bg-white border border-neutral-300 rounded text-sm text-neutral-900 focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-950 resize-none h-24 placeholder-neutral-500"
            maxLength={1000}
          />
          <p className="text-xs text-neutral-500 mt-2 font-medium">
            {internalPrompt.length}/1000
          </p>
        </div>
      )}
    </>
  );
});

export default SystemPrompt;