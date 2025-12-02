import React, { useState, useCallback, memo } from 'react';
import { CircularDial } from './CircularDial';
import { LoRaUpload, LoRaFile } from './LoRaUpload';
import TokensControl from './TokensControl';

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
  temperature: number;
  topP: number;
  topK: number;
  repeatPenalty: number;
  frequencyPenalty: number;
  presencePenalty: number;
  minP: number;
  tfsZ: number;
  mirostatTau: number;
  maxTokens: number;
  loraFiles: LoRaFile[];
}

export const TOKEN_PRESETS = {
  'model_001': 2048,
  'model_002': 4096,
  'model_003': 3072,
} as const;

// CONFIG: Advanced mode parameter controls (full parameter set)
const ADVANCED_DIAL_CONFIGS = [
  { label: 'Temperature', key: 'temperature', min: 0, max: 2, step: 0.1 },
  { label: 'Top P', key: 'topP', min: 0, max: 1, step: 0.05 },
  { label: 'Top K', key: 'topK', min: 0, max: 100, step: 1 },
  { label: 'Repeat', key: 'repeatPenalty', min: 1.0, max: 2.0, step: 0.1 },
  { label: 'Freq Penalty', key: 'frequencyPenalty', min: -2.0, max: 2.0, step: 0.1 },
  { label: 'Pres Penalty', key: 'presencePenalty', min: -2.0, max: 2.0, step: 0.1 },
  { label: 'Min P', key: 'minP', min: 0.0, max: 1.0, step: 0.05 },
  { label: 'TFS Z', key: 'tfsZ', min: 0.0, max: 1.0, step: 0.05 },
  { label: 'Mirostat Tau', key: 'mirostatTau', min: 0.0, max: 10.0, step: 0.1 },
] as const;

interface ControlCardProps {
  model: Model;
  onUpdate: (modelId: string, state: ModelState) => void;
}

export const ControlCard: React.FC<ControlCardProps> = memo(({ model, onUpdate }) => {
  // STATE: Advanced mode model configuration
  const [state, setState] = useState<ModelState>(() => ({
    temperature: 0.7,
    topP: 0.9,
    topK: 40,
    repeatPenalty: 1.1,
    frequencyPenalty: 0.0,
    presencePenalty: 0.0,
    minP: 0.05,
    tfsZ: 1.0,
    mirostatTau: 5.0,
    maxTokens: TOKEN_PRESETS[model.id as keyof typeof TOKEN_PRESETS] ?? 2048,
    loraFiles: [],
  }));

  // CALLBACK: Update state and notify parent
  const updateState = useCallback((updates: Partial<ModelState>) => {
    setState(prev => {
      const updated = { ...prev, ...updates };
      onUpdate(model.id, updated);
      return updated;
    });
  }, [model.id, onUpdate]);

  // CALLBACK: Add LoRA file
  const handleAddLora = useCallback((file: LoRaFile) => {
    updateState({ loraFiles: [...state.loraFiles, file] });
  }, [state.loraFiles, updateState]);

  // CALLBACK: Remove LoRA file
  const handleRemoveLora = useCallback((fileId: number) => {
    updateState({ loraFiles: state.loraFiles.filter(f => f.id !== fileId) });
  }, [state.loraFiles, updateState]);

  return (
    <div className={`w-28/12 rounded-lg overflow-hidden bg-white ${COLORS.PRIMARY_THEMA}`}>
      <div className={`p-5 flex items-center justify-between ${COLORS.PRIMARY_THEMA}`}>
        <h3 className={`text-lg font-bold font-playfair ${COLORS.TEXT_PRIMARY}`}>
          {model.name}
        </h3>
      </div>
    
      <div className="p-5 space-y-6">
        {/* SECTION: Advanced parameter controls (3x3 grid) */}
        <div className={`grid grid-cols-3 gap-6 p-4 rounded-lg ${COLORS.PRIMARY_THEMA}`}>
          {ADVANCED_DIAL_CONFIGS.map(config => (
            <CircularDial
              key={config.key}
              label={config.label}
              value={state[config.key as keyof ModelState] as number}
              onChange={(value) => updateState({ [config.key]: value })}
            />
          ))}
        </div>
        
        {/* SECTION: Token count control */}
        <TokensControl 
          maxTokens={state.maxTokens} 
          onChange={(value) => updateState({ maxTokens: value })} 
        />
        
        {/* SECTION: LoRA file management */}
        <LoRaUpload
          files={state.loraFiles}
          onAdd={handleAddLora}
          onRemove={handleRemoveLora}
        />
      </div>
    </div>
  );
});