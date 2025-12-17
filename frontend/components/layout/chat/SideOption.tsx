import React, { useState, useCallback, useContext, useEffect } from 'react';
import { PanelLeft } from 'lucide-react';
import { CircularDial } from '../custom-model/CircularDial';
import { model, TOKEN_PRESETS, config_model } from '../../../global/global';
import TokensControl from '../custom-model/TokensControl';
import SystemPrompt from './SystemPrompt';
import { AppContext } from '@/global/AppProvider';
import { GetConfigLlm } from '@/global/GetConfigLlm';

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

const SideOption = React.memo(() => {
  const [isVisible, setIsVisible] = useState(false);
  const [expandedPrompt, setExpandedPrompt] = useState(false);
  const CONTEXT = useContext(AppContext);
  const curretModel = CONTEXT.curretModel;
  const test = GetConfigLlm(curretModel);

  const [stateModel, setStateModel] = useState<config_model>({
    temperature: 0.7,
    top_p: 0.9,
    top_k: 40,
    repeat_penalty: 1.1,
    frequency_penalty: 0.0,
    presence_penalty: 0.0,
    tokens: TOKEN_PRESETS[model.id as keyof typeof TOKEN_PRESETS] ?? 2048,
    min_p: 0.05,
    tfs_z: 1.0,
    mirostat_tau: 5.0,
    system_prompt: '',
    lora_files: [],
  });

  useEffect(() => {
    const modelConfig = async () => {
      const config = await GetConfigLlm(curretModel);
      if (!config || typeof config !== 'object' || Array.isArray(config)) {
        console.error('Config not found or invalid');
        return;
      }

      setStateModel((prev: config_model) => ({
        temperature: (config as any).temperature ?? prev.temperature,
        top_p: (config as any).top_p ?? prev.top_p,
        top_k: (config as any).top_k ?? prev.top_k,
        repeat_penalty: (config as any).repeat_penalty ?? prev.repeat_penalty,
        frequency_penalty: (config as any).frequency_penalty ?? prev.frequency_penalty,
        presence_penalty: (config as any).presence_penalty ?? prev.presence_penalty,
        tokens: (config as any).tokens ?? prev.tokens,
        min_p: (config as any).min_p ?? prev.min_p,
        tfs_z: (config as any).tfs_z ?? prev.tfs_z,
        mirostat_tau: (config as any).mirostat_tau ?? prev.mirostat_tau,
        system_prompt: (config as any).system_prompt ?? prev.system_prompt,
        lora_files: (config as any).lora_files ?? prev.lora_files,
      }));
    };

    modelConfig();
  }, [curretModel]);

  const handleTokensChange = useCallback(() => {
    setStateModel((prev) => ({ ...prev }));
  }, []);

  const dials = [
    { label: 'Temperature', value: stateModel.temperature, min: 0, max: 2, step: 0.1, key: 'temperature' as const },
    { label: 'Top P', value: stateModel.top_p, min: 0, max: 1, step: 0.05, key: 'top_p' as const },
    { label: 'Top K', value: stateModel.top_k, min: 0, max: 100, step: 1, key: 'top_k' as const },
    { label: 'Repeat', value: stateModel.repeat_penalty, min: 1.0, max: 2.0, step: 0.1, key: 'repeat_penalty' as const },
  ];

  const toggleVisibility = () => setIsVisible((prev) => !prev);

  if (!isVisible)
    return (
      <div className="h-[calc(100vh-5rem)] w-16 shadow-xl absolute left-0 top-[5rem] transition-all duration-300">
        <ToggleButton onClick={toggleVisibility} />
      </div>
    );

  return (
    <div className="h-[calc(100vh-5rem)] w-64 shadow-2xl absolute left-0 top-[5rem]">
      <ToggleButton onClick={toggleVisibility} />

      <div>
        {dials.map((dial) => (
          <CircularDial
            key={dial.key}
            label={dial.label}
            value={dial.value}
            onChange={(val) => setStateModel((prev) => ({ ...prev, [dial.key]: val }))}
            simple={true}
            id_model={curretModel}
          />
        ))}
      </div>

      <div className=" h-28 w-56 mt-8 ml-4 border border-neutral-200/10 rounded-3xl flex items-center justify-start pl-4 bg-white/5">
        <TokensControl
          maxTokens={stateModel.tokens}
          onChange={handleTokensChange}
          id_model={curretModel}
        />
      </div>

      <div className="mt-4 ml-4">
        <SystemPrompt
          isExpanded={expandedPrompt}
          onToggle={() => setExpandedPrompt((prev) => !prev)}
        />
      </div>

      <div className="mt-6"></div>
    </div>
  );
});

export default SideOption;
