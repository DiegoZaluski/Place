import React, { useState, useCallback, memo } from 'react';
import { Pen, ChevronDown } from 'lucide-react';
import { CircularDial } from './CircularDial';
import { LoRaUpload, LoRaFile } from './LoRaUpload';
import TokensControl from './TokensControl';
import SystemPrompt from './SystemPrompt';

// COLORS - Keep same names for consistency
export const COLORS = {
  PRIMARY: 'bg-c-700',
  SECONDARY: 'bg-n-500',
  TERTIARY: 'bg-b-900',
  SURFACE: 'dark-bg-surface',
  BEGG_MEDIUM: 'bg-b-700',
  PRIMARY_THEMA: 'dark-bg-primary',
  SECONDARY_THEMA: 'dark-bg-secondary',
  TERTIARY_THEMA: 'dark-bg-tertiary',

  TEXT_PRIMARY: 'dark-text-primary',
  TEXT_SECONDARY: 'dark-text-secondary',
  TEXT_TERTIARY: 'dark-text-tertiary',

  BORDER_PRIMARY: 'dark-border-primary',
  BORDER_SECONDARY: 'dark-border-secondary',
  BORDER_LIGHT: 'dark-border-light',
};

// TYPES
export interface Model {
  id: string;
  name: string;
}

export interface ModelState {
  temperature: number;
  topP: number;
  topK: number;
  maxTokens: number;
  systemPrompt: string;
  loraFiles: LoRaFile[];
}

export const TOKEN_PRESETS = {
  'model_001': 2048,
  'model_002': 4096,
  'model_003': 3072,
} as const;

// DIAL CONFIGURATION - Extract for reusability
const DIAL_CONFIGS = [
  { label: 'Temperature', key: 'temperature', min: 0, max: 2, step: 0.01 },
  { label: 'Top P', key: 'topP', min: 0, max: 1, step: 0.01 },
  { label: 'Top K', key: 'topK', min: 0, max: 100, step: 1 },
] as const;

// SEPARATED COMPONENTS

// Header Component
const ModelHeader = memo(({ modelName }: { modelName: string }) => (
  <div className={`p-5 flex items-center justify-between ${COLORS.PRIMARY_THEMA}`}>
    <h3 className={`text-lg font-bold font-playfair ${COLORS.TEXT_PRIMARY}`}>
      {modelName}
    </h3>
  </div>
));

// Dials Grid Component
const DialsGrid = memo(({ dials, onChange }: { 
  dials: Array<{
    label: string;
    key: string;
    min: number;
    max: number;
    step: number;
    value: number;
  }>; 
  onChange: (key: keyof ModelState, value: number) => void;
}) => (
  <div className={`grid grid-cols-3 gap-6 p-4 rounded-lg ${COLORS.PRIMARY_THEMA}`}>
    {dials.map(({ label, key, value, min, max, step }) => (
      <CircularDial
        key={key}
        label={label}
        value={value} 
        min={min}
        max={max}
        step={step}
        onChange={(val) => onChange(key as keyof ModelState, val)}
      />
    ))}
  </div>
));



// MAIN COMPONENT
export const ControlCard: React.FC<ControlCardProps> = memo(({ model, onUpdate }) => {
  // Initialize state with model-specific token preset
  const [state, setState] = useState<ModelState>(() => ({
    temperature: 0.7,
    topP: 0.9,
    topK: 40,
    maxTokens: TOKEN_PRESETS[model.id as keyof typeof TOKEN_PRESETS] ?? 2048,
    systemPrompt: '',
    loraFiles: [],
  }));

  const [expandedPrompt, setExpandedPrompt] = useState(false);

  // Optimized handler with useCallback
  const handleChange = useCallback((key: keyof ModelState, value: any) => {
    setState(prev => {
      const updated = { ...prev, [key]: value };
      onUpdate(model.id, updated);
      return updated;
    });
  }, [model.id, onUpdate]);

  // Memoized LoRa handlers
  const handleAddLora = useCallback((file: LoRaFile) => {
    handleChange('loraFiles', [...state.loraFiles, file]);
  }, [handleChange, state.loraFiles]);

  const handleRemoveLora = useCallback((fileId: number) => {
    handleChange('loraFiles', state.loraFiles.filter(f => f.id !== fileId));
  }, [handleChange, state.loraFiles]);

  // Prepare dials with current values
  const dialsWithValues = DIAL_CONFIGS.map(config => ({
    ...config,
    value: state[config.key as keyof ModelState] as number
  }));

  return (
    <div className={`w-28/12 rounded-lg overflow-hidden bg-white ${COLORS.PRIMARY_THEMA}`}>
      <ModelHeader modelName={model.name} />
      
      <div className="p-5 space-y-6">
        <DialsGrid dials={dialsWithValues} onChange={handleChange} />
        
        <TokensControl 
          maxTokens={state.maxTokens} 
          onChange={(value) => handleChange('maxTokens', value)} 
        />
        
        <LoRaUpload
          files={state.loraFiles}
          onAdd={handleAddLora}
          onRemove={handleRemoveLora}
        />
      <SystemPrompt 
        prompt={state.systemPrompt} 
        onChange={(value) => handleChange('systemPrompt', value)}
        isExpanded={expandedPrompt}
        onToggle={() => setExpandedPrompt(!expandedPrompt)}
      />
      </div>
    </div>
  );
});

// Keep original interface for backward compatibility
interface ControlCardProps {
  model: Model;
  onUpdate: (modelId: string, state: ModelState) => void;
}