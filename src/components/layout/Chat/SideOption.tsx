import React, {useState, useCallback} from "react";
import { PanelLeft } from 'lucide-react';
import {CircularDial} from '../CustomModel/CircularDial';
import { model, TOKEN_PRESETS } from '../../../global/varsGlobal';
import TokensControl from "../CustomModel/TokensControl";
import SystemPrompt from "./SystemPrompt";

const ToggleButton = ({ onClick }: { onClick: () => void }) => ( 
  <button 
    onClick={onClick}
    className="w-full h-10 flex items-center justify-center mt-4"
  >
    <PanelLeft size={20} />
  </button>
);

const Divider = ({ className = "" }) => (
  <div className={`border-b border-white/50 h-10 w-3/4 ml-4 ${className}`} />
);

const SideOption = React.memo((): JSX.Element => {
  const [isVisible, setIsVisible] = useState(false);
  const [expandedPrompt, setExpandedPrompt] = useState(false);
  
  // STATE: Model generation parameters
  const [state, setState] = useState({
    temperature: 0.7,
    topP: 0.9,
    topK: 40,
    repeatPenalty: 1.1,
    frequencyPenalty: 0.0,
    presencePenalty: 0.0,
    maxTokens: (TOKEN_PRESETS[model.id as keyof typeof TOKEN_PRESETS] ?? 2048),
    minP: 0.05,
    tfsZ: 1.0,
    mirostatTau: 5.0,
    systemPrompt: '',
    loraFiles: [],
  });

  // CALLBACK: Tokens change handler
  const handleTokensChange = useCallback(() => {
    setState(prev => ({ ...prev }));
  }, []);

  // CONFIG: Simple mode parameter dials
  const dials = [
    { label: 'Temp', value: state.temperature, min: 0, max: 2, step: 0.1, key: 'temperature' as const },
    { label: 'Top P', value: state.topP, min: 0, max: 1, step: 0.05, key: 'topP' as const },
    { label: 'Top K', value: state.topK, min: 0, max: 100, step: 1, key: 'topK' as const },
    { label: 'Rept', value: state.repeatPenalty, min: 1.0, max: 2.0, step: 0.1, key: 'repeatPenalty' as const },
  ];

  const toggleVisibility = () => setIsVisible(prev => !prev);

  if (!isVisible) return (
    <div className="h-[calc(100vh-5rem)] w-16 shadow-xl absolute left-0 top-[5rem] transition-all duration-300"> 
      <ToggleButton onClick={toggleVisibility}/>
    </div>
  );

  return (
    <div className="h-[calc(100vh-5rem)] w-60 shadow-2xl absolute left-0 top-[5rem]">
      <ToggleButton onClick={toggleVisibility}/>
      
      {dials.map(dial => (
        <CircularDial
          label={dial.label}
          value={dial.value}
          onChange={(val) => setState(prev => ({ ...prev, [dial.key]: val }))}
          simple={true}
        />
      ))}
      
      <Divider />
      
      <TokensControl 
        maxTokens={state.maxTokens} 
        onChange={handleTokensChange}
      />
      
      <Divider className="transform -translate-y-5" />
      
      <SystemPrompt 
        isExpanded={expandedPrompt} 
        onToggle={() => setExpandedPrompt(prev => !prev)}
      />
      
      <Divider className="transform -translate-y-6"/>
      
      <h2 className="mt-2 mt4 ml-4 font-playfair transform -translate-y-6">History</h2>
      <p className="mt4 ml-4 text-sm transform -translate-y-6">This is in prod...</p>
    </div>
  );
});

export default SideOption;