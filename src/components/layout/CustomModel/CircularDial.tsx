import { useState, useRef, useEffect } from 'react';
import { COLORS } from './ControlCard';
import { Sigma, Crown, Repeat, Minus, Zap, Filter, PieChart, Gauge } from 'lucide-react'
import { dispatchLlamaConfigEvent, LlamaConfigEventDetail } from '../../../global/eventCofigLlm'; 

interface CircularDialProps {
  value: number;
  onChange: (value: number) => void;
  label: string;
  simple?: boolean;
  min?: number;
  max?: number;
  step?: number;
  id_model: string;
}

const LlamaParameterKeys: { [key: string]: keyof Omit<LlamaConfigEventDetail, 'id_model'> } = {
    'Temp': 'temperature',
    'Top P': 'top_p',
    'Top K': 'top_k',
    'Rept': 'repeat_penalty', 
    'Freq Penalty': 'frequency_penalty',
    'Pres Penalty': 'presence_penalty',
    'Mirostat Tau': 'mirostat_tau',
    'Min P': 'min_p',
    'TFS Z': 'tfs_z',
};

export const CircularDial: React.FC<CircularDialProps> = ({ 
  value, 
  onChange, 
  label,
  simple = false,
  min: propMin,
  max: propMax,
  step: propStep,
  id_model,
}) => {
  const [inputVal, setInputVal] = useState(value.toFixed(2));
  const [isDragging, setIsDragging] = useState(false);
  const dialRef = useRef<HTMLDivElement>(null);

  const DEFAULT_CONFIGS = {
    'Temp': { MIN: 0.0, MAX: 2.0, STEP: 0.1, icon: Gauge },
    'Top P': { MIN: 0.0, MAX: 1.0, STEP: 0.05, icon: Sigma },
    'Top K': { MIN: 0, MAX: 100, STEP: 1, icon: Crown },
    'Repeat': { MIN: 1.0, MAX: 2.0, STEP: 0.1, icon: Repeat },
    'Freq Penalty': { MIN: -1.0, MAX: 2.0, STEP: 0.1, icon: Minus },
    'Pres Penalty': { MIN: -1.0, MAX: 2.0, STEP: 0.1, icon: Minus },
    'Mirostat Tau': { MIN: 0.0, MAX: 5.0, STEP: 0.1, icon: Zap },
    'Min P': { MIN: 0.0, MAX: 0.5, STEP: 0.05, icon: Filter },
    'TFS Z': { MIN: 0.5, MAX: 1.0, STEP: 0.05, icon: PieChart },
  };

  const defaultConfig = DEFAULT_CONFIGS[label] || { MIN: 0, MAX: 2, STEP: 0.01, icon: Gauge };
  const MIN = propMin !== undefined ? propMin : defaultConfig.MIN;
  const MAX = propMax !== undefined ? propMax : defaultConfig.MAX;
  const STEP = propStep !== undefined ? propStep : defaultConfig.STEP;
  const IconComponent = defaultConfig.icon;

  const updateValue = (newValue: number) => {
    const clamped = Math.min(Math.max(newValue, MIN), MAX);
    const rounded = Math.round(clamped / STEP) * STEP;
    onChange(rounded);
    setInputVal(rounded.toFixed(2));

    if (dialRef.current && id_model) {
        const apiFieldKey = LlamaParameterKeys[label];
        if (apiFieldKey) {
            const payload: LlamaConfigEventDetail = {
                id_model: id_model,
                [apiFieldKey]: rounded,
            } as LlamaConfigEventDetail;
            dispatchLlamaConfigEvent(dialRef.current, payload);
        }
    }
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
  const SIZE = useRef(20); 

  if (simple) return (
    <div 
      ref={dialRef} 
      className="h-10 pl-8 transform translate-y-4 flex items-center text-sm transition-all duration-300 rounded-xl mb-1 border border-transparent hover:bg-white/5 hover:border-white/10 "
    >
      <div className='ml-4 transform -translate-x-6 flex items-center gap-3'>
        {label === 'Temp' && <Gauge size={SIZE.current} className={COLORS.TEXT_SECONDARY} stroke={value > 1 ? 'red' : value <= 0.5 ? 'var(--pur-500)' : 'white'}/>}
        {label === 'Top P' && <Sigma size={SIZE.current} className={COLORS.TEXT_SECONDARY}/>}
        {label === 'Top K' && <Crown size={SIZE.current} className={COLORS.TEXT_SECONDARY}/>}
        {label === 'Rept' && <Repeat size={SIZE.current} className={COLORS.TEXT_SECONDARY}/>}
        {label === 'Freq Penalty' && <Minus size={SIZE.current} className={COLORS.TEXT_SECONDARY}/>}
        {label === 'Pres Penalty' && <Minus size={SIZE.current} className={COLORS.TEXT_SECONDARY}/>}
        {label === 'Mirostat Tau' && <Zap size={SIZE.current} className={COLORS.TEXT_SECONDARY}/>}
        {label === 'Min P' && <Filter size={SIZE.current} className={COLORS.TEXT_SECONDARY}/>}
        {label === 'TFS Z' && <PieChart size={SIZE.current} className={COLORS.TEXT_SECONDARY}/>}
        <span className="font-medium">
          {label}:
        </span>
        <input
          type="number"
          value={inputVal}
          onChange={handleInputChange}
          onBlur={handleBlur}
          onFocus={(e) => e.target.select()}
          onKeyDown={(e) => e.key === 'Enter' && handleBlur()}
          className={`w-12 text-center text-sm font-bold bg-white/10 border border-white/10 focus:border-none focus:ring-none focus:outline-none rounded-lg pt-1 pb-1 transition-all duration-200 ${COLORS.TEXT_PRIMARY} ${numberInputStyles}`}
        />
        <span className="text-xs text-white/60 mr-2 font-medium">max: {MAX}</span>
      </div>
    </div>
  );

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

  const percentage = ((value - MIN) / (MAX - MIN)) * 100;

  return (
    <div className="flex flex-col items-center gap-3">
      <label className={`text-xs font-semibold uppercase tracking-widest ${COLORS.TEXT_SECONDARY}`}>
        {label}
      </label>

      <div
        ref={dialRef}
        className="relative w-20 h-20 lg:w-32 lg:h-32 rounded-full border-3 border-neutral-950 flex items-center justify-center cursor-grab active:cursor-grabbing select-none transition-transform duration-200 hover:scale-105 shadow-lg"
        onMouseDown={handleMouseDown}
      >
        <svg className="absolute w-full h-full" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="2.5" />
          <path
            d={`M 50 8 A 42 42 0 ${percentage > 50 ? 1 : 0} 1 ${50 + 42 * Math.sin((percentage / 100) * 2 * Math.PI)} ${8 + 42 * (1 - Math.cos((percentage / 100) * 2 * Math.PI))}`}
            fill="none"
            stroke="var(--pur-400)"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        </svg>

        <div className={`relative w-12 h-12 lg:w-20 lg:h-20 rounded-full border-2 border-neutral-950 flex items-center justify-center z-10 ${COLORS.PRIMARY_THEMA} shadow-inner hover:border-neutral-800 transition-all duration-200`}>
          <input
            type="number"
            value={inputVal}
            onChange={handleInputChange}
            onBlur={handleBlur}
            onFocus={(e) => e.target.select()}
            className={`w-full h-full text-center text-sm lg:text-base font-bold bg-transparent ${COLORS.TEXT_PRIMARY} ${numberInputStyles}`}
          />
        </div>
      </div>
    </div>
  );
};