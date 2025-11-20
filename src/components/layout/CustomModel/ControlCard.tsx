import React, { useState, useCallback,} from 'react';
import { Pen, ChevronDown } from 'lucide-react';
import { CircularDial } from './CircularDial';
import { LoRaUpload, LoRaFile } from './LoRaUpload';

// COLORS 
export const COLORS = {
  PRIMARY: 'bg-c-700',
  SECONDARY: 'bg-n-500 ',
  TERTIARY: 'bg-b-900',
  SURFACE: 'dark-bg-surface',
  BEGG_MEDIUM: 'bg-b-700 ',
  PRIMARY_THEMA: 'dark-bg-primary ',
  SECONDARY_THEMA: 'dark-bg-secondary',
  TERTIARY_THEMA: 'dark-bg-tertiary',

  TEXT_PRIMARY: 'dark-text-primary',
  TEXT_SECONDARY: 'dark-text-secondary',
  TEXT_TERTIARY: 'dark-text-tertiary',

  BORDER_PRIMARY: 'dark-border-primary',
  BORDER_SECONDARY: 'dark-border-secondary',
  BORDER_LIGHT: 'dark-border-light',

}

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

const PRESET_VALUES = [1024, 2048, 4096, 8192] as const;

// MODEL CARD COMPONENT
interface ControlCardProps {
  model: Model;
  onUpdate: (modelId: string, state: ModelState) => void;
}

export const ControlCard: React.FC<ControlCardProps> = ({ model, onUpdate }) => {
  const [state, setState] = useState<ModelState>({
    temperature: 0.7,
    topP: 0.9,
    topK: 40,
    maxTokens: (TOKEN_PRESETS[model.id as keyof typeof TOKEN_PRESETS] ?? 2048),
    systemPrompt: '',
    loraFiles: [],
  });

  const [expandedPrompt, setExpandedPrompt] = useState(false);

  const handleChange = useCallback((key: keyof ModelState, value: any) => {
    setState(prev => {
      const updated = { ...prev, [key]: value };
      onUpdate(model.id, updated);
      return updated;
    });
  }, [model.id, onUpdate]);

  const handleAddLora = useCallback((file: LoRaFile) => {
    handleChange('loraFiles', [...state.loraFiles, file]);
  }, [handleChange, state.loraFiles]);

  const handleRemoveLora = useCallback((fileId: number) => {
    handleChange('loraFiles', state.loraFiles.filter(f => f.id !== fileId));
  }, [handleChange, state.loraFiles]);

  const dials = [
    { 
      label: 'Temperature', 
      value: state.temperature, 
      min: 0, 
      max: 2, 
      step: 0.01,
      key: 'temperature' as const 
    },
    { 
      label: 'Top P', 
      value: state.topP, 
      min: 0, 
      max: 1, 
      step: 0.01,
      key: 'topP' as const 
    },
    { 
      label: 'Top K', 
      value: state.topK, 
      min: 0, 
      max: 100, 
      step: 1,
      key: 'topK' as const 
    },
  ];

  return (
    <div className={`w-28/12 rounded-lg overflow-hidden bg-white ${COLORS.PRIMARY_THEMA}`}>
      {/* HEADER */}
      <div className={`p-5 flex items-center justify-between ${COLORS.PRIMARY_THEMA}`}>
        <div>
          <h3 className={`text-lg font-bold font-playfair ${COLORS.TEXT_PRIMARY}`}>{model.name}</h3>
        </div>
      </div>

      {/* CONTENT */}
      <div className="p-5 space-y-6">
        {/* DIALS */}
        <div className={`grid grid-cols-3 gap-6 p-4 rounded-lg${COLORS.PRIMARY_THEMA}`}>
          {dials.map(dial => (
            <CircularDial
              key={dial.key}
              label={dial.label}
              value={dial.value}
              min={dial.min}
              max={dial.max}
              step={dial.step}
              onChange={(val) => handleChange(dial.key, val)}
            />
          ))}
        </div>

        {/* TOKENS */}
        <div className={` rounded-lg p-4 ${COLORS.PRIMARY_THEMA}`}>
          <label className={`text-xs font-semibold uppercase tracking-widest mb-3 block ${COLORS.TEXT_SECONDARY}`}>
            Max Tokens
          </label>

          <div className="flex gap-2 mb-4 flex-wrap">
            {PRESET_VALUES.map((preset) => (
              <button
                key={preset}
                onClick={() => handleChange('maxTokens', preset)}
                className={`px-3 py-1.5 rounded text-xs font-semibold transition-all border ${
                  state.maxTokens === preset
                    ? 'bg-neutral-900 text-white border-neutral-900'
                    : 'bg-white border-neutral-300 text-neutral-900 hover:border-neutral-400'
                }`}
              >
                {preset}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <input
              type="range"
              min="128"
              max="8192"
              step="128"
              value={state.maxTokens}
              onChange={(e) => handleChange('maxTokens', parseInt(e.target.value))}
              className="flex-1 h-1.5 bg-neutral-300 rounded-full appearance-none cursor-pointer accent-neutral-900"
            />
            <input
              type="number"
              value={state.maxTokens}
              onChange={(e) => handleChange('maxTokens', parseInt(e.target.value) || 0)}
              className="w-16 px-2 py-1.5 border border-neutral-300 rounded text-xs font-bold text-neutral-900 text-center focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-950"
            />
          </div>
        </div>

        {/* LORA */}
        <LoRaUpload
          files={state.loraFiles}
          onAdd={handleAddLora}
          onRemove={handleRemoveLora}
        />

        {/* PROMPT TOGGLE */}
        <button
          onClick={() => setExpandedPrompt(!expandedPrompt)}
          className={`w-full flex items-center justify-between px-4 py-3 rounded-lg border font-medium text-sm transition-all ${
            expandedPrompt
              ? 'bg-white text-neutral-900 border-neutral-900'
              : 'bg-white border-neutral-300 text-neutral-900 hover:border-neutral-400'
          }`}
          aria-expanded={expandedPrompt}
        >
          <span className="flex items-center gap-2">
            <Pen size={16} />
            Prompt System
          </span>
          <ChevronDown
            size={16}
            className={`transition-transform ${expandedPrompt ? 'rotate-180' : ''}`}
          />
        </button>

        {/* PROMPT AREA */}
        {expandedPrompt && (
          <div className="border border-neutral-300 rounded-lg p-4 bg-neutral-50">
            <textarea
              value={state.systemPrompt}
              onChange={(e) => handleChange('systemPrompt', e.target.value)}
              placeholder="Digite instruções do sistema..."
              className="w-full px-3 py-2 bg-white border border-neutral-300 rounded text-sm text-neutral-900 focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-950 resize-none h-24 placeholder-neutral-500"
              maxLength={1000}
            />
            <p className="text-xs text-neutral-500 mt-2 font-medium">
              {state.systemPrompt.length}/1000
            </p>
          </div>
        )}
      </div>
    </div>
  );
};