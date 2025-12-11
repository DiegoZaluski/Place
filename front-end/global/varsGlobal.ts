export interface Model {
  id: string;
  name: string;
}

export let model: Model = {
    id:'',
    name: '',
}; // example

export const TOKEN_PRESETS = {
  'model_001': 2048,
  'model_002': 4096,
  'model_003': 3072,
} as const;

export const objectState = {
    temperature: 0.7,
    topP: 0.9,
    topK: 40,
    maxTokens: (TOKEN_PRESETS[model.id as keyof typeof TOKEN_PRESETS] ?? 2048),
    systemPrompt: '',
    loraFiles: [],
  };
