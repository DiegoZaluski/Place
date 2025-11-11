import { useState, useCallback, useRef, useEffect } from 'react';
import { COLORS } from './ControlCard';
interface CircularDialProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  label: string;
  step?: number;
}
// UTILITY FUNCTIONS
const clamp = (value: number, min: number, max: number): number => {
  return Math.min(Math.max(value, min), max);
};

const roundToStep = (value: number, step: number): number => {
  return Math.round(value / step) * step;
};


// CIRCULAR DIAL COMPONENT
export const CircularDial: React.FC<CircularDialProps> = ({ 
  value, 
  onChange, 
  min = 0, 
  max = 2, 
  label,
  step = 0.01
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [inputVal, setInputVal] = useState(value.toFixed(2));
  const dialRef = useRef<HTMLDivElement>(null);

  const normalizeValue = useCallback((newValue: number) => {
    const clamped = clamp(newValue, min, max);
    return roundToStep(clamped, step);
  }, [min, max, step]);

  const updateValue = useCallback((newValue: number) => {
    const normalizedValue = normalizeValue(newValue);
    onChange(normalizedValue);
    setInputVal(normalizedValue.toFixed(2));
  }, [onChange, normalizeValue]);

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
    
    // Start the movement immediately on click
    if (dialRef.current) {
      const rect = dialRef.current.getBoundingClientRect();
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const x = e.clientX - rect.left - centerX;
      const y = e.clientY - rect.top - centerY;

      const angle = Math.atan2(y, x) + Math.PI / 2;
      let normalized = (angle / (2 * Math.PI)) % 1;
      if (normalized < 0) normalized += 1;

      const newValue = min + normalized * (max - min);
      updateValue(newValue);
    }
  }, [min, max, updateValue]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !dialRef.current) return;

    const rect = dialRef.current.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const x = e.clientX - rect.left - centerX;
    const y = e.clientY - rect.top - centerY;

    const angle = Math.atan2(y, x) + Math.PI / 2;
    let normalized = (angle / (2 * Math.PI)) % 1;
    if (normalized < 0) normalized += 1;

    const newValue = min + normalized * (max - min);
    updateValue(newValue);
  }, [isDragging, min, max, updateValue]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    if (!isNaN(val)) {
      updateValue(val);
    }
  }, [updateValue]);

  const handleInputBlur = useCallback(() => {
    const currentValue = parseFloat(inputVal);
    if (!isNaN(currentValue)) {
      updateValue(currentValue);
    }
  }, [inputVal, updateValue]);

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

  const rotation = ((value - min) / (max - min)) * 360;
  const percentage = ((value - min) / (max - min)) * 100;

  return (
    <div className="flex flex-col items-center gap-4">
      <label className={`text-xs font-semibold uppercase tracking-widest ${COLORS.TEXT_SECONDARY}`}>
        {label}
      </label>

      <div
        ref={dialRef}
        className="relative w-40 h-40 rounded-full border-3 border-neutral-950 bg-white flex items-center justify-center cursor-grab active:cursor-grabbing select-none touch-none"
        onMouseDown={handleMouseDown}
      >
        {/* PROGRESS ARC */}
        <svg className="absolute w-full h-full" viewBox="0 0 100 100">
          <path
            d={`M 50 8 A 42 42 0 ${percentage > 50 ? 1 : 0} 1 ${50 + 42 * Math.sin((percentage / 100) * 2 * Math.PI)} ${8 + 42 * (1 - Math.cos((percentage / 100) * 2 * Math.PI))}`}
            fill="none"
            stroke=""
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        </svg>

        {/* NEEDLE */}
        <div
          className={`absolute w-1 h-16 bg-neutral-950 origin-bottom rounded-full pointer-events-none ${COLORS.PRIMARY_THEMA}`}
          style={{
            transform: `translateY(-50px) rotate(${rotation}deg)`,
            transition: isDragging ? 'none' : 'transform 0.15s ease-out',
          }}
        />

        {/* CENTER INPUT */}
        <div className="relative w-24 h-24 rounded-full border-2 border-neutral-950 bg-white flex items-center justify-center z-10">
          <input
            type="text"
            value={inputVal}
            onChange={handleInputChange}
            onBlur={handleInputBlur}
            className="w-full h-full text-center text-base font-bold text-neutral-950 focus:outline-none bg-transparent"
            style={{ appearance: 'textfield' }}
            step={step}
            min={min}
            max={max}
          />
        </div>
      </div>
    </div>
  );
};