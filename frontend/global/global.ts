export interface Model {
  id: string;
  name: string;
}

export const model: Model = {
  id: '',
  name: '',
}; // example

export const TOKEN_PRESETS = {
  model_001: 2048,
  model_002: 4096,
  model_003: 3072,
} as const;

export const objectState = {
  temperature: 0.7,
  topP: 0.9,
  topK: 40,
  maxTokens: TOKEN_PRESETS[model.id as keyof typeof TOKEN_PRESETS] ?? 2048,
  systemPrompt: '',
  loraFiles: [],
};

export interface config_model { // config model for event of sqlite
  id_model?: string;
  temperature?: number;
  top_p?: number;
  top_k?: number;
  repeat_penalty?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
  tokens?: number;
  min_p?: number;
  tfs_z?: number;
  mirostat_tau?: number;
  seed?: number | null;
  stop?: string[] | null;
  system_prompt?: string;
  lora_files?: any;
}

