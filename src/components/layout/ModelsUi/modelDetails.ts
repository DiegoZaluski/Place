export interface ModelData {
  modelName: string;
  memoryUsage: string;
  intelligenceLevel: 'Fast' | 'Balanced' | 'High' | 'Very High' | 'Maximum' | 'Code Specialist';
  fullModelName: string;
  description: string;
  features: string[];
}

export const modelDetails: ModelData[] = [
  {
    modelName: "Llama 3.2 3B",
    memoryUsage: "2.1 GB RAM",
    intelligenceLevel: "Fast",
    fullModelName: "Llama-3.2-3B-Instruct-Q4_K_M.gguf",
    description: "Modelo compacto e eficiente, ideal para tarefas rápidas e respostas ágeis com baixo consumo de recursos.",
    features: ["Baixo uso de memória", "Respostas rápidas", "Ideal para tarefas simples"]
  },
  {
    modelName: "Mistral 7B",
    memoryUsage: "4.5 GB RAM",
    intelligenceLevel: "High",
    fullModelName: "mistral-7b-instruct-v0.3.Q4_K_M.gguf",
    description: "Excelente equilíbrio entre desempenho e qualidade de respostas com alta precisão.",
    features: ["Alta precisão", "Versátil", "Ótimo custo-benefício"]
  },
  {
    modelName: "Qwen2.5 7B",
    memoryUsage: "4.8 GB RAM",
    intelligenceLevel: "Very High",
    fullModelName: "qwen2.5-7b-instruct.Q4_K_M.gguf",
    description: "Modelo avançado com excelente compreensão contextual e raciocínio complexo.",
    features: ["Raciocínio avançado", "Multi-idioma", "Alta qualidade"]
  },
  {
    modelName: "Llama 3.1 8B",
    memoryUsage: "5.2 GB RAM",
    intelligenceLevel: "Maximum",
    fullModelName: "llama-3.1-8b-instruct.Q4_K_M.gguf",
    description: "O modelo mais poderoso disponível, com capacidades máximas de raciocínio e compreensão.",
    features: ["Máxima inteligência", "Respostas complexas", "Melhor qualidade"]
  },
  {
    modelName: "DeepSeek Coder",
    memoryUsage: "4.2 GB RAM",
    intelligenceLevel: "Code Specialist",
    fullModelName: "deepseek-coder-6.7b-instruct.Q4_K_M.gguf",
    description: "Especializado em programação e tarefas técnicas de desenvolvimento de software.",
    features: ["Especialista em código", "Múltiplas linguagens", "Debug avançado"]
  },
  {
    modelName: "Phi-3 Mini",
    memoryUsage: "2.5 GB RAM",
    intelligenceLevel: "Balanced",
    fullModelName: "phi-3-mini-4k-instruct.Q4_K_M.gguf",
    description: "Modelo equilibrado entre eficiência e capacidade de processamento para uso geral.",
    features: ["Equilibrado", "Eficiente", "Uso moderado"]
  }
];