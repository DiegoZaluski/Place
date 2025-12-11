import React, {useState, useCallback, useContext, useEffect} from "react";
import { PanelLeft } from 'lucide-react';
import {CircularDial} from '../CustomModel/CircularDial';
import { model, TOKEN_PRESETS } from '../../../global/varsGlobal';
import TokensControl from "../CustomModel/TokensControl";
import SystemPrompt from "./SystemPrompt";
import { AppContext } from "@/global/AppProvider";
import { GetConfigLlm } from "@/global/GetConfigLlm";

interface ModelConfigState {
  temperature?: number;
  topP?: number;
  topK?: number;
  repeatPenalty?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  maxTokens?: number;
  minP?: number;
  tfsZ?: number;
  mirostatTau?: number;
  systemPrompt?: string;
  loraFiles?: any;
}

const ToggleButton = ({ onClick }: { onClick: () => void }) => (
  <div className="w-full flex items-center justify-center">
    <button
      onClick={onClick}
      className="group relative w-14 h-10 mt-4 rounded-full overflow-hidden transition-all duration-300 ease-out"
      aria-label="Toggle panel"
    >
      <div className="relative flex items-center justify-center w-full h-full">
        <PanelLeft
          size={20}
          className="text-white/70 transition-all duration-300 group-active:scale-90"
        />
      </div>
      <div className="absolute inset-0 bg-white/10 rounded-full scale-0 group-active:scale-100 transition-transform duration-300 origin-center" />
    </button>
  </div>
);

const SideOption = React.memo((): JSX.Element => {
  const [isVisible, setIsVisible] = useState(false);
  const [expandedPrompt, setExpandedPrompt] = useState(false);
  const CONTEXT = useContext(AppContext);
  const curretModel = CONTEXT.curretModel;
  const test = GetConfigLlm(curretModel);

  const [state, setState] = useState<ModelConfigState>({
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

  useEffect(() => {
    const modelConfig = async () => {
      const config = await GetConfigLlm(curretModel);
      if (!config || typeof config !== 'object' || Array.isArray(config)) {
        console.error('Config not found or invalid');
        return;
      }
      
      setState((prev: ModelConfigState) => ({
        temperature: (config as any).temperature ?? prev.temperature,
        topP: (config as any).topP ?? prev.topP,
        topK: (config as any).topK ?? prev.topK,
        repeatPenalty: (config as any).repeatPenalty ?? prev.repeatPenalty,
        frequencyPenalty: (config as any).frequencyPenalty ?? prev.frequencyPenalty,
        presencePenalty: (config as any).presencePenalty ?? prev.presencePenalty,
        maxTokens: (config as any).maxTokens ?? prev.maxTokens,
        minP: (config as any).minP ?? prev.minP,
        tfsZ: (config as any).tfsZ ?? prev.tfsZ,
        mirostatTau: (config as any).mirostatTau ?? prev.mirostatTau,
        systemPrompt: (config as any).systemPrompt ?? prev.systemPrompt,
        loraFiles: (config as any).loraFiles ?? prev.loraFiles,
      }));
    };
    
    modelConfig();
  }, [curretModel]);
    

  const handleTokensChange = useCallback(() => {
    setState(prev => ({ ...prev }));
  }, []);

  const dials = [
    { label: 'Temperature', value: state.temperature, min: 0, max: 2, step: 0.1, key: 'temperature' as const },
    { label: 'Top P', value: state.topP, min: 0, max: 1, step: 0.05, key: 'topP' as const },
    { label: 'Top K', value: state.topK, min: 0, max: 100, step: 1, key: 'topK' as const },
    { label: 'Repeat', value: state.repeatPenalty, min: 1.0, max: 2.0, step: 0.1, key: 'repeatPenalty' as const },
  ];

  const toggleVisibility = () => setIsVisible(prev => !prev);

  if (!isVisible) return (
    <div className="h-[calc(100vh-5rem)] w-16 shadow-xl absolute left-0 top-[5rem] transition-all duration-300"> 
      <ToggleButton onClick={toggleVisibility}/>
    </div>
  );

  return (
    <div className="h-[calc(100vh-5rem)] w-64 shadow-2xl absolute left-0 top-[5rem]">
      <ToggleButton onClick={toggleVisibility}/>
      
      <div>
        {dials.map(dial => (
          <CircularDial
            key={dial.key}
            label={dial.label}
            value={dial.value}
            onChange={(val) => setState(prev => ({ ...prev, [dial.key]: val }))}
            simple={true}
            id_model={curretModel}
          />
        ))}
      </div>
      
      <div className=" h-28 w-56 mt-8 ml-4 border border-neutral-200/10 rounded-3xl flex items-center justify-start pl-4 bg-white/5">
        <TokensControl 
          maxTokens={state.maxTokens} 
          onChange={handleTokensChange}
          id_model={curretModel}
        />
      </div>
      
      <div className="mt-4 ml-4">
        <SystemPrompt 
          isExpanded={expandedPrompt} 
          onToggle={() => setExpandedPrompt(prev => !prev)}
        />
      </div>
      
      <div className="mt-6"></div>
      
    </div>
  );
});

export default SideOption;