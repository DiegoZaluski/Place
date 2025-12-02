import { useState, useRef, useEffect } from 'react';
import { COLORS } from './ControlCard';
import { Thermometer, Target, Crown, Repeat, Minus, Zap, Filter, PieChart, Gauge } from 'lucide-react'

interface CircularDialProps {
  value: number;
  onChange: (value: number) => void;
  label: string;
  simple?: boolean;
  min?: number;
  max?: number;
  step?: number;
}

export const CircularDial: React.FC<CircularDialProps> = ({ 
  value, 
  onChange, 
  label,
  simple = false,
  min: propMin,
  max: propMax,
  step: propStep,
}) => {
  const [inputVal, setInputVal] = useState(value.toFixed(2));
  const [isDragging, setIsDragging] = useState(false);
  const dialRef = useRef<HTMLDivElement>(null);

  // CONFIG: Default parameter definitions for Llama.cpp (fallback)
  const DEFAULT_CONFIGS = {
    'Temp': { MIN: 0.0, MAX: 2.0, STEP: 0.1, icon: Thermometer },
    'Top P': { MIN: 0.0, MAX: 1.0, STEP: 0.05, icon: Target },
    'Top K': { MIN: 0, MAX: 100, STEP: 1, icon: Crown },
    'Repeat': { MIN: 1.0, MAX: 2.0, STEP: 0.1, icon: Repeat },
    'Freq Penalty': { MIN: -1.0, MAX: 2.0, STEP: 0.1, icon: Minus },
    'Pres Penalty': { MIN: -1.0, MAX: 2.0, STEP: 0.1, icon: Minus },
    'Mirostat Tau': { MIN: 0.0, MAX: 5.0, STEP: 0.1, icon: Zap },
    'Min P': { MIN: 0.0, MAX: 0.5, STEP: 0.05, icon: Filter },
    'TFS Z': { MIN: 0.5, MAX: 1.0, STEP: 0.05, icon: PieChart },
  };

  // LOGIC: Use props if provided, otherwise use defaults
  const defaultConfig = DEFAULT_CONFIGS[label] || { MIN: 0, MAX: 2, STEP: 0.01, icon: Gauge };
  const MIN = propMin !== undefined ? propMin : defaultConfig.MIN;
  const MAX = propMax !== undefined ? propMax : defaultConfig.MAX;
  const STEP = propStep !== undefined ? propStep : defaultConfig.STEP;
  const IconComponent = defaultConfig.icon;

  // HELPER: Update value with clamping and rounding
  const updateValue = (newValue: number) => {
    const clamped = Math.min(Math.max(newValue, MIN), MAX);
    const rounded = Math.round(clamped / STEP) * STEP;
    onChange(rounded);
    setInputVal(rounded.toFixed(2));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputVal(e.target.value);
  };

  const handleBlur = () => {
    const numericValue = parseFloat(inputVal);
    
    if (isNaN(numericValue) || inputVal === '') {
      setInputVal(value.toFixed(2));
    } else {
      updateValue(numericValue);
    }
  };

  useEffect(() => {
    setInputVal(value.toFixed(2));
  }, [value]);

  const numberInputStyles = "[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none";

  // RENDER: Simple mode (compact horizontal layout)
  if (simple) return (
    <div className="h-10 pl-6 transform translate-y-4 hover:bg-black/20 hover:shadow-[inset_4px_0_0_0_black] flex items-center">
      <div className=' ml-4 transform -translate-x-6 flex items-center gap-2'>
        {label === 'Temp' && <Thermometer size={16} className={COLORS.TEXT_SECONDARY} stroke={value > 1 ? 'red' : value <= 0.5 ? 'blue' : 'orange'}/>}
        {label === 'Top P' && <Target size={16} className={COLORS.TEXT_SECONDARY} />}
        {label === 'Top K' && <Crown size={16} className={COLORS.TEXT_SECONDARY} />}
        {label === 'Rept' && <Repeat size={16} className={COLORS.TEXT_SECONDARY} />}
        {label === 'Freq Penalty' && <Minus size={16} className={COLORS.TEXT_SECONDARY} />}
        {label === 'Pres Penalty' && <Minus size={16} className={COLORS.TEXT_SECONDARY} />}
        {label === 'Mirostat Tau' && <Zap size={16} className={COLORS.TEXT_SECONDARY} />}
        {label === 'Min P' && <Filter size={16} className={COLORS.TEXT_SECONDARY} />}
        {label === 'TFS Z' && <PieChart size={16} className={COLORS.TEXT_SECONDARY} />}
        <span className={`text-xs font-medium uppercase font-semibold ${COLORS.TEXT_SECONDARY}`}>
          {label}:
        </span>
        <input
          type="number"
          value={inputVal}
          onChange={handleInputChange}
          onBlur={handleBlur}
          onFocus={(e) => e.target.select()}
          onKeyDown={(e) => e.key === 'Enter' && handleBlur()}
          className={`w-12 text-center text-sm font-bold bg-transparent focus:outline-none bg-white/10 rounded-lg ${COLORS.TEXT_PRIMARY} ${numberInputStyles}`}
        />
        <span className="text-xs text-white mr-2">max: {MAX}</span>
      </div>
    </div>
  );

  // INTERACTION: Circular dial mouse handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging || !dialRef.current) return;
    
    const rect = dialRef.current.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const x = e.clientX - rect.left - centerX;
    const y = e.clientY - rect.top - centerY;

    const angle = Math.atan2(y, x) + Math.PI / 2;
    let normalized = (angle / (2 * Math.PI)) % 1;
    if (normalized < 0) normalized += 1;

    updateValue(MIN + normalized * (MAX - MIN));
  };

  const handleMouseUp = () => setIsDragging(false);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging]);

  // CALC: Progress percentage for circular visualization
  const percentage = ((value - MIN) / (MAX - MIN)) * 100;

  // RENDER: Advanced mode (circular dial layout)
  return (
    <div className="flex flex-col items-center gap-3">
      <label className={`text-xs font-semibold uppercase tracking-widest ${COLORS.TEXT_SECONDARY}`}>
        {label}
      </label>

      <div
        ref={dialRef}
        className="relative w-20 h-20 lg:w-32 lg:h-32 rounded-full border-3 border-neutral-950 flex items-center justify-center cursor-grab active:cursor-grabbing select-none"
        onMouseDown={handleMouseDown}
      >
        <svg className="absolute w-full h-full" viewBox="0 0 100 100">
          <path
            d={`M 50 8 A 42 42 0 ${percentage > 50 ? 1 : 0} 1 ${50 + 42 * Math.sin((percentage / 100) * 2 * Math.PI)} ${8 + 42 * (1 - Math.cos((percentage / 100) * 2 * Math.PI))}`}
            fill="none"
            stroke="var(--pur-400)"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        </svg>

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