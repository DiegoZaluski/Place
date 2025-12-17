import React, { useState, useCallback, memo, useEffect } from 'react';
import { CircularDial } from './CircularDial';
import { LoRaUpload, LoRaFile } from './LoRaUpload';
import TokensControl from './TokensControl';
import { GetConfigLlm } from '@/global/GetConfigLlm';
import { config_model } from '@/global/global'

export const COLORS = {
  PRIMARY_THEMA: 'dark-bg-primary',
  TEXT_PRIMARY: 'dark-text-primary',
  TEXT_SECONDARY: 'dark-text-secondary',
};

export interface Model {
  id: string;
  name: string;
}

export const TOKEN_PRESETS = {
  model_001: 2048,
  model_002: 4096,
  model_003: 3072,
} as const;

interface ControlCardProps {
  key_model: string;
  model: Model;
  onUpdate: (modelId: string, state: config_model) => void;
}

export const ControlCard: React.FC<ControlCardProps> = memo(({ key_model, model, onUpdate }) => {
  const [state, setState] = useState<config_model>({
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
      const config = await GetConfigLlm(key_model);
      if (!config || typeof config !== 'object' || Array.isArray(config)) {
        console.error('Config not found or invalid');
        return;
      }
      setState((prev: config_model) => ({
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
        system_prompt: (config as any).systemPrompt ?? prev.system_prompt,
        lora_files: (config as any).loraFiles ?? prev.lora_files,
      }));
    };

    modelConfig();
  }, [key_model]);

  const ADVANCED_DIAL_CONFIGS = [
    {
      label: 'Temperature',
      value: state.temperature,
      key: 'temperature',
      min: 0,
      max: 2,
      step: 0.1,
    },
    { label: 'Top P', value: state.top_p, key: 'topP', min: 0, max: 1, step: 0.05 },
    { label: 'Top K', value: state.top_k, key: 'topK', min: 0, max: 100, step: 1 },
    {
      label: 'Repeat',
      value: state.repeat_penalty,
      key: 'repeatPenalty',
      min: 1.0,
      max: 2.0,
      step: 0.1,
    },
    {
      label: 'Freq Penalty',
      value: state.frequency_penalty,
      key: 'frequencyPenalty',
      min: -2.0,
      max: 2.0,
      step: 0.1,
    },
    {
      label: 'Pres Penalty',
      value: state.presence_penalty,
      key: 'presencePenalty',
      min: -2.0,
      max: 2.0,
      step: 0.1,
    },
    { label: 'Min P', value: state.min_p, key: 'minP', min: 0.0, max: 1.0, step: 0.05 },
    { label: 'TFS Z', value: state.tfs_z, key: 'tfsZ', min: 0.0, max: 1.0, step: 0.05 },
    {
      label: 'Mirostat Tau',
      value: state.mirostat_tau,
      key: 'mirostatTau',
      min: 0.0,
      max: 10.0,
      step: 0.1,
    },
  ];

  const updateState = useCallback(
    (updates: Partial<config_model>) => {
      setState((prev) => {
        const updated = { ...prev, ...updates };
        onUpdate(model.id, updated);
        return updated;
      });
    },
    [model.id, onUpdate],
  );

  const handleAddLora = useCallback(
    (file: LoRaFile) => {
      updateState({ lora_files: [...state.lora_files, file] });
    },
    [state.lora_files, updateState],
  );

  const handleRemoveLora = useCallback(
    (fileId: number) => {
      updateState({ lora_files: state.lora_files.filter((f) => f.id !== fileId) });
    },
    [state.lora_files, updateState],
  );

  return (
    <div
      className={`
      w-28/12 
      rounded-lg 
      overflow-hidden 
      bg-white 
      ${COLORS.PRIMARY_THEMA}
    `}
    >
      <div
        className={`
        p-5 
        flex 
        items-center 
        justify-between 
        ${COLORS.PRIMARY_THEMA}
      `}
      >
        <h3
          className={`
          text-lg 
          font-bold 
          font-playfair 
          ${COLORS.TEXT_PRIMARY}
        `}
        >
          {model.name}
        </h3>
      </div>

      <div
        className="
        p-5 
        space-y-6
      "
      >
        <div
          className={`
          grid 
          grid-cols-3 
          gap-6 
          p-4 
          rounded-lg 
          ${COLORS.PRIMARY_THEMA}
        `}
        >
          {ADVANCED_DIAL_CONFIGS.map((config) => (
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
          maxTokens={state.tokens}
          onChange={(value) => updateState({ tokens: value })}
          id_model={key_model}
        />

        <LoRaUpload files={state.lora_files} onAdd={handleAddLora} onRemove={handleRemoveLora} />
      </div>
    </div>
  );
});
