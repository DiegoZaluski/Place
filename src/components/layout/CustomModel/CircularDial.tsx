import { useState, useCallback, useRef, useEffect } from 'react';
import { COLORS } from './ControlCard';

interface CircularDialProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  label: string;
  step?: number;
  simple?: boolean; 
}

const clamp = (value: number, min: number, max: number): number => 
  Math.min(Math.max(value, min), max);

const roundToStep = (value: number, step: number): number => 
  Math.round(value / step) * step;

export const CircularDial: React.FC<CircularDialProps> = ({ 
  value, 
  onChange, 
  min = 0, 
  max = 2, 
  label,
  step = 0.01,
  simple = false
}) => {
  const [inputVal, setInputVal] = useState(value.toFixed(2));
  const [isDragging, setIsDragging] = useState(false);
  const dialRef = useRef<HTMLDivElement>(null);

  // Update value with automatic max correction
  const updateValue = useCallback((newValue: number) => {
    const clamped = clamp(newValue, min, max);
    const rounded = roundToStep(clamped, step);
    onChange(rounded);
    setInputVal(rounded.toFixed(2));
  }, [min, max, step, onChange]);

  // Handle input changes - allow free typing but validate numbers
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputVal(newValue);
  };

  // Validate and clamp value when input loses focus
  const handleBlur = () => {
    const numericValue = parseFloat(inputVal);
    
    if (isNaN(numericValue) || inputVal === '') {
      // Reset to current value if invalid
      setInputVal(value.toFixed(2));
    } else {
      // Auto-correct to max if value exceeds maximum
      updateValue(numericValue);
    }
  };

  // Sync input value when prop changes
  useEffect(() => {
    setInputVal(value.toFixed(2));
  }, [value]);

  // CSS to remove number input arrows
  const numberInputStyles = "[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none";
  let isLast = false
  // Simple version - just the input without dial
  if (simple) {
    return (
      //last-child
      <div className={`ml-4 pl-6 transform translate-y-4`}>
        <div className='transform -translate-x-6'>
          <span className={`text-xs font-medium uppercase font-semibold ${COLORS.TEXT_SECONDARY} text-right w-20`}>
            {label} :
          </span>
          <input
            type="number"
            value={inputVal}
            onChange={handleInputChange}
            onBlur={handleBlur}
            onFocus={(e) => e.target.select()}
            onKeyDown={(e) => e.key === 'Enter' && handleBlur()}
            className={`w-12 text-center text-sm font-bold bg-transparent focus:outline-none border-b border-white ${COLORS.TEXT_PRIMARY} ${numberInputStyles}`}
          />
          <span className="text-xs text-white ml-1 mr-2">max: {max}</span>
        </div>
      </div>
    );
  }

  const CircularDialFull = () => {
    const handleMouseDown = useCallback((e: React.MouseEvent) => {
      e.preventDefault();
      setIsDragging(true);
      updateFromEvent(e.nativeEvent);
    }, []);

    const handleMouseMove = useCallback((e: MouseEvent) => {
      if (isDragging) updateFromEvent(e);
    }, [isDragging]);

    const handleMouseUp = useCallback(() => setIsDragging(false), []);

    // Calculate value based on mouse position
    const updateFromEvent = useCallback((e: MouseEvent | React.MouseEvent) => {
      if (!dialRef.current) return;
      const rect = dialRef.current.getBoundingClientRect();
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const x = e.clientX - rect.left - centerX;
      const y = e.clientY - rect.top - centerY;

      const angle = Math.atan2(y, x) + Math.PI / 2;
      let normalized = (angle / (2 * Math.PI)) % 1;
      if (normalized < 0) normalized += 1;

      updateValue(min + normalized * (max - min));
    }, [min, max, updateValue]);

    // Mouse event listeners for drag interaction
    useEffect(() => {
      if (isDragging) {
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        return () => {
          document.removeEventListener('mousemove', handleMouseMove);
          document.removeEventListener('mouseup', handleMouseUp);
        };
      }
    }, [isDragging, handleMouseMove, handleMouseUp]);

    // Calculate percentage for arc visualization
    const percentage = ((value - min) / (max - min)) * 100;

    return (
      <div className="flex flex-col items-center gap-3">
        <label className={`text-xs font-semibold uppercase tracking-widest ${COLORS.TEXT_SECONDARY}`}>
          {label}
        </label>

        {/* Dial container with SVG arc and input */}
        <div
          ref={dialRef}
          className="relative w-20 h-20 lg:w-32 lg:h-32 rounded-full border-3 border-neutral-950 flex items-center justify-center cursor-grab active:cursor-grabbing select-none"
          onMouseDown={handleMouseDown}
        >
          {/* SVG arc visualization */}
          <svg className="absolute w-full h-full" viewBox="0 0 100 100">
            <path
              d={`M 50 8 A 42 42 0 ${percentage > 50 ? 1 : 0} 1 ${50 + 42 * Math.sin((percentage / 100) * 2 * Math.PI)} ${8 + 42 * (1 - Math.cos((percentage / 100) * 2 * Math.PI))}`}
              fill="none"
              stroke="var(--pur-400)"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          </svg>

          {/* Central input area */}
          <div className={`relative w-12 h-12 lg:w-20 lg:h-20 rounded-full border-2 border-neutral-950 flex items-center justify-center z-10 ${COLORS.PRIMARY_THEMA}`}>
            <input
              type="number"
              value={inputVal}
              onChange={handleInputChange}
              onBlur={handleBlur}
              onFocus={(e) => e.target.select()}
              className={`w-full h-full text-center text-sm lg:text-base font-bold bg-transparent focus:outline-none ${COLORS.TEXT_PRIMARY} ${numberInputStyles}`}
            />
          </div>
        </div>
      </div>
    );
  };

  return <CircularDialFull />;
};