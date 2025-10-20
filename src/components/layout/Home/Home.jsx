import React from 'react';
import { Link } from 'react-router-dom';

// Conteúdo para os elementos (inalterado)
const headerTabsContent = ["Configuração", "Documentação", "Contribuições"];

// Conteúdo com detalhes auxiliares para as caixas maiores (inalterado)
const topCardsDetails = [
  { title: "Models", detail: "5 Modelos em Produção. Último treinamento: há 3 horas.", indicator: "Alto Desempenho (94% Accuracy)" },
  { title: "Chat", detail: "21k Interações hoje. Latência média: 120ms.", indicator: "98% Satisfação do Usuário" },
  { title: "Workflows", detail: "7 Fluxos Ativos. 2 Pendentes. Próxima execução: 01:00 AM.", indicator: "Sincronização OK" },
  { title: "Workspace Security", detail: "12 Tentativas de acesso bloqueadas. RBAC Status: Conformidade Plena.", indicator: "Firewall Ativo" },
  { title: "IDE", detail: "2 Projetos em Andamento. 48 Commits Pendentes. 1 Sessão Ativa (DevOps).", indicator: "Compilação Sucesso" },
];

const bottomCardsDetails = [
  { title: "Biblioteca", detail: "35 Components. 120 Snippets. Versão: v4.1.2. Recursos Comunitários." },
  { title: "Integração API", detail: "API Gateway: 5 Endpoints. 3k Requests/min. Monitoramento de Latência em Tempo Real." },
  { title: "Gerenciamento de Memória", detail: "Uso de Heap: 65%. Cache Hit Rate: 88%. Limite de Alocação: 16GB." },
  { title: "Security Audit", detail: "Próximo Agendamento: Sexta-feira. Nível de Risco: Baixo. Relatório disponível em PDF." },
  { title: "Data Flow", detail: "3 Streams de Dados Ativos. 1TB Processado. Último Erro: Nenhum. Pipeline Status: Estável." },
];

function Home() {
  return (
    // BLACK MODE: Fundo Principal em preto
    <div className="min-h-screen bg-black font-sans"> 
      
      {/* Header: Fixo na parte superior, em preto e com borda clara */}
      <header className="w-full h-20 border-b border-white/20 px-8 bg-black shadow-2xl sticky top-0 z-10">
        <div className="h-full grid grid-cols-3 items-center">
          
          {/* 1. Seção Esquerda: Tabs */}
          <div className="justify-self-start ml-4">
            <div className="p-2 h-16 w-auto rounded-xl bg-[#605C4E] shadow-inner">
              <div className="flex space-x-3">
                {headerTabsContent.map((name, index) => (
                  <div 
                    key={`left-${index}`} 
                    // BOTÃO: Fundo preto, Borda clara
                    className="w-28 h-12 rounded-xl bg-black border border-white/30 transition-colors duration-200 hover:bg-[#1A1A1A] cursor-pointer shadow-lg flex flex-col items-center justify-center"
                  >
                    {name.split(' ').map((word, i) => (
                      <span 
                        key={i} 
                        // TEXTO: Branco puro
                        className="block text-[10px] font-semibold text-white tracking-tighter leading-none text-center"
                        style={{ fontSize: '0.8rem' }}
                      >
                        {word}
                      </span>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Seção Central Vazia */}
          <div className="justify-self-center"></div> 
          
          {/* Seção Direita: Ícones de status, notificações e perfil do usuário */}
          <div className="justify-self-end mr-4">
            <div className="flex items-center space-x-4">
              
              {/* Box de Status/Contador (GitHub) */}
              <div className="flex items-center bg-gradient-to-r from-black/90 to-black/70 backdrop-blur-sm border border-white/30 rounded-2xl px-5 py-3 space-x-3 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.05] cursor-pointer group">
                <div className="relative">
                  {/* Ícone Git: Branco puro */}
                  <svg
                    className="w-8 h-8 text-white group-hover:text-white transition-colors duration-300"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="flex flex-col">
                  {/* Contador de Contribuições/Status */}
                  <span className="text-white font-bold text-xl group-hover:text-white transition-colors duration-300">3k</span>
                  <span className="text-white/60 text-xs font-medium">Commits</span>
                </div>
              </div>
              
              {/* Botão de Configurações/Ajuda */}
              <div className="w-10 h-10 rounded-full border-2 border-white/20 bg-white/10 flex items-center justify-center transition-colors hover:bg-white/20 cursor-pointer"></div>
              
              {/* Avatar do Usuário */}
              <div className="w-10 h-10 rounded-full border-2 border-white/20 bg-white/10 shadow-md cursor-pointer"></div>
            </div>
          </div>
        </div>
      </header>

      {/* Área Principal de Conteúdo: Centralizada e espaçosa */}
      <main className="container mx-auto p-10 flex flex-col items-center">
        
        {/* Seção Superior: 5 Cartões/Widgets de Destaque (BLACK MODE + Aumento) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 w-full max-w-7xl mb-10">
          {topCardsDetails.map((item, index) => (
            <div 
              key={`top-card-${index}`}
              // Aumento para h-96
              className="h-96 border-2 border-white/20 bg-black rounded-3xl px-8 py-8 shadow-2xl flex flex-col justify-between transition-all duration-300 hover:scale-[1.02] hover:shadow-xl cursor-pointer"
            >
              <div className="w-full h-auto mb-4">
                {/* Título: Branco */}
                <h3 className="text-2xl font-bold text-white overflow-hidden whitespace-nowrap text-ellipsis leading-tight font-playfair">{item.title}</h3>
                <div className="w-1/2 h-4 bg-white/10 rounded-full mt-2"></div> 
              </div>
              
              {/* Conteúdo Principal do Cartão: Usa a cor secundária #605C4E */}
              <div className="flex-grow bg-[#605C4E]/90 rounded-2xl mb-4 p-4 space-y-2 flex flex-col justify-center">
                <p className="text-white text-sm font-semibold leading-relaxed">{item.detail.split('.')[0]}.</p>
                <p className="text-white/90 text-xs leading-relaxed mt-1">{item.detail.split('.')[1] ? item.detail.split('.')[1].trim() : ""}</p>
                <p className="text-white/95 text-xs font-medium mt-auto border-t border-white/20 pt-1 leading-relaxed">{item.indicator}</p>
              </div>
              
              {/* Placeholder para um indicador/botão no rodapé */}
              <div className="w-full h-4 bg-white/20 rounded-full"></div>
            </div>
          ))}
        </div>
        
        {/* Divisor Visual */}
        <div className="w-11/12 h-1 bg-white/10 my-8 rounded-full"></div>
        
        {/* Seção Inferior: 5 Cartões/Itens de Lista (BLACK MODE + Aumento) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 w-full max-w-7xl mt-10">
          {bottomCardsDetails.map((item, index) => (
            <div 
              key={`bottom-card-${index + 5}`}
              // Aumento para h-88
              className="bg-[#1A1A1A] h-88 border border-white/10 rounded-3xl px-8 py-8 shadow-2xl flex flex-col justify-center items-center transition-transform duration-300 hover:translate-y-[-4px] hover:shadow-xl cursor-pointer"
            >
              {/* INTERNO: Fundo em #605C4E para destacar como principal cor de detalhe */}
              <div className="w-full h-full bg-[#605C4E]/95 rounded-2xl p-6 space-y-3 flex flex-col justify-start">
                <h4 className="text-white text-lg font-bold mb-2 border-b border-white/20 pb-1 leading-tight font-playfair">{item.title}</h4>
                
                {/* Detalhes preenchendo o espaço interno */}
                <p className="text-white/95 text-sm leading-relaxed">{item.detail.split('.')[0]}.</p>
                <p className="text-white/80 text-xs leading-relaxed">{item.detail.split('.')[1] ? item.detail.split('.')[1].trim() : ""}</p>

                {/* Placeholders de linhas originais (decorativas) no rodapé do bloco */}
                <div className="flex-grow"></div> 
                <div className="w-4/5 h-2 bg-white/20 rounded-full"></div>
                <div className="w-full h-2 bg-white/20 rounded-full"></div>
                <div className="w-3/4 h-2 bg-white/20 rounded-full"></div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

export default Home;