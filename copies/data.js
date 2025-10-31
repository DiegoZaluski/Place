// Dados para os elementos (inalterado)
export const headerTabsContent = ["Configuração", "Documentação", "Contribuições"];

// Dados com detalhes auxiliares para as caixas maiores (inalterado)
export const topCardsDetails = [
  { title: "Models", detail: "5 Modelos em Produção. Último treinamento: há 3 horas.", indicator: "Alto Desempenho (94% Accuracy)" },
  { title: "Chat", detail: "21k Interações hoje. Latência média: 120ms.", indicator: "98% Satisfação do Usuário" },
  { title: "Workflows", detail: "7 Fluxos Ativos. 2 Pendentes. Próxima execução: 01:00 AM.", indicator: "Sincronização OK" },
  { title: "Workspace Security", detail: "12 Tentativas de acesso bloqueadas. RBAC Status: Conformidade Plena.", indicator: "Firewall Ativo" },
  { title: "IDE", detail: "2 Projetos em Andamento. 48 Commits Pendentes. 1 Sessão Ativa (DevOps).", indicator: "Compilação Sucesso" },
];

export const modelCardsDetails = [
  {
    modelName: "Mistral 7B",
    memoryUsage: "4.5 GB RAM",
    intelligenceLevel: "High",
    fullModelName: "mistral-7b-instruct-v0.3.Q4_K_M.gguf"
  },
  {
    modelName: "Qwen2.5 7B",
    memoryUsage: "4.8 GB RAM", 
    intelligenceLevel: "Very High",
    fullModelName: "qwen2.5-7b-instruct.Q4_K_M.gguf"
  },
  {
    modelName: "Llama 3.1 8B",
    memoryUsage: "5.2 GB RAM",
    intelligenceLevel: "Maximum",
    fullModelName: "llama-3.1-8b-instruct.Q4_K_M.gguf"
  },
  {
    modelName: "DeepSeek Coder",
    memoryUsage: "4.2 GB RAM",
    intelligenceLevel: "Code Specialist",
    fullModelName: "deepseek-coder-6.7b-instruct.Q4_K_M.gguf"
  },
  {
    modelName: "Phi-3 Mini",
    memoryUsage: "2.5 GB RAM",
    intelligenceLevel: "Balanced",
    fullModelName: "phi-3-mini-4k-instruct.Q4_K_M.gguf"
  }
];