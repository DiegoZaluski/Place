import React, { useState, useCallback, memo, useEffect } from 'react';
import { CircularDial } from './CircularDial';
import { LoRaUpload, LoRaFile } from './LoRaUpload';
import TokensControl from './TokensControl';
import {GetConfigLlm} from '@/global/GetConfigLlm';

export const COLORS = {
  PRIMARY_THEMA: 'dark-bg-primary',
  TEXT_PRIMARY: 'dark-text-primary',
  TEXT_SECONDARY: 'dark-text-secondary',
};

export interface Model {
  id: string;
  name: string;
}

export interface ModelState {
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

export const TOKEN_PRESETS = {
  'model_001': 2048,
  'model_002': 4096,
  'model_003': 3072,
} as const;

interface ControlCardProps {
  key_model: string;
  model: Model;
  onUpdate: (modelId: string, state: ModelState) => void;
}

export const ControlCard: React.FC<ControlCardProps> = memo(({key_model, model, onUpdate }) => {
  const [state, setState] = useState<ModelState>({
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
      const config = await GetConfigLlm(key_model);
      if (!config || typeof config !== 'object' || Array.isArray(config)) {
        console.error('Config not found or invalid');
        return;
      }
      setState((prev: ModelState) => ({
        temperature: (config as any).temperature ?? prev.temperature,
        topP: (config as any).top_p ?? prev.topP,
        topK: (config as any).top_k ?? prev.topK,
        repeatPenalty: (config as any).repeat_penalty ?? prev.repeatPenalty,
        frequencyPenalty: (config as any).frequency_penalty ?? prev.frequencyPenalty,
        presencePenalty: (config as any).presence_penalty ?? prev.presencePenalty,
        maxTokens: (config as any).tokens ?? prev.maxTokens,
        minP: (config as any).min_p ?? prev.minP,
        tfsZ: (config as any).tfs_z ?? prev.tfsZ,
        mirostatTau: (config as any).mirostat_tau ?? prev.mirostatTau,
        systemPrompt: (config as any).systemPrompt ?? prev.systemPrompt,
        loraFiles: (config as any).loraFiles ?? prev.loraFiles,
      }));
    };
    
    modelConfig();
  }, [key_model]);

  const ADVANCED_DIAL_CONFIGS = [
    { label: 'Temperature', value: state.temperature, key: 'temperature', min: 0, max: 2, step: 0.1 },
    { label: 'Top P', value: state.topP, key: 'topP', min: 0, max: 1, step: 0.05 },
    { label: 'Top K', value: state.topK, key: 'topK', min: 0, max: 100, step: 1 },
    { label: 'Repeat', value: state.repeatPenalty, key: 'repeatPenalty', min: 1.0, max: 2.0, step: 0.1 },
    { label: 'Freq Penalty', value: state.frequencyPenalty, key: 'frequencyPenalty', min: -2.0, max: 2.0, step: 0.1 },
    { label: 'Pres Penalty', value: state.presencePenalty, key: 'presencePenalty', min: -2.0, max: 2.0, step: 0.1 },
    { label: 'Min P', value: state.minP, key: 'minP', min: 0.0, max: 1.0, step: 0.05 },
    { label: 'TFS Z', value: state.tfsZ, key: 'tfsZ', min: 0.0, max: 1.0, step: 0.05 },
    { label: 'Mirostat Tau', value: state.mirostatTau, key: 'mirostatTau', min: 0.0, max: 10.0, step: 0.1 },
  ];

  const updateState = useCallback((updates: Partial<ModelState>) => {
    setState(prev => {
      const updated = { ...prev, ...updates };
      onUpdate(model.id, updated);
      return updated;
    });
  }, [model.id, onUpdate]);

  const handleAddLora = useCallback((file: LoRaFile) => {
    updateState({ loraFiles: [...state.loraFiles, file] });
  }, [state.loraFiles, updateState]);

  const handleRemoveLora = useCallback((fileId: number) => {
    updateState({ loraFiles: state.loraFiles.filter(f => f.id !== fileId) });
  }, [state.loraFiles, updateState]);

  return (
    <div className={`
      w-28/12 
      rounded-lg 
      overflow-hidden 
      bg-white 
      ${COLORS.PRIMARY_THEMA}
    `}>
      <div className={`
        p-5 
        flex 
        items-center 
        justify-between 
        ${COLORS.PRIMARY_THEMA}
      `}>
        <h3 className={`
          text-lg 
          font-bold 
          font-playfair 
          ${COLORS.TEXT_PRIMARY}
        `}>
          {model.name}
        </h3>
      </div>
    
      <div className="
        p-5 
        space-y-6
      ">
        <div className={`
          grid 
          grid-cols-3 
          gap-6 
          p-4 
          rounded-lg 
          ${COLORS.PRIMARY_THEMA}
        `}>
          {ADVANCED_DIAL_CONFIGS.map(config => (
            <CircularDial
              key={config.key}
              label={config.label}
              value={config.value}
              onChange={(value) => updateState({ [config.key]: value })}
              id_model={key_model} 
            />
          ))}
        </div>
        
        <TokensControl 
          maxTokens={state.maxTokens} 
          onChange={(value) => updateState({ maxTokens: value })} 
          id_model={key_model}
        />
        
        <LoRaUpload
          files={state.loraFiles}
          onAdd={handleAddLora}
          onRemove={handleRemoveLora}
        />
      </div>
    </div>
  );
});