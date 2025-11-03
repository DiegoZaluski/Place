import React from 'react';
import { CheckCircle, Info } from 'lucide-react';
import {ModelData} from './modelDetails';
// Configuração de cores do componente
export const THEME = {
  // Card Principal
  cardBg: 'dark-bg-primary',
  cardBorder: 'dark-border-light',
  cardBorderHover: 'hover:border-b-400',
  cardTitle: 'dark-text-brand-light',
  cardText: 'dark-text-brand-light ',
  cardInfoBg: 'bg-b-700',
  cardInfoLabel: 'text-n-400',
  cardInfoText: 'text-c-300',
  cardDivider: 'dark-border-light',
  cardProgressBar: 'bg-b-400',
  
  // Botão
  buttonBg: 'bg-b-500',
  buttonBgHover: 'hover:bg-b-400',
  buttonText: 'text-c-50',
  
  // Card de Detalhes
  detailsBg: 'bg-n-800',
  detailsBorder: 'dark-border-light',
  detailsTitle: 'text-c-50',
  detailsIcon: 'text-b-400',
  detailsText: 'text-n-300',
  detailsLabel: 'text-n-200',
  detailsSubtext: 'text-n-400',
  detailsDivider: 'dark-border-light',
  
  // Status
  statusSuccess: 'text-ok'
};




interface ModelCardProps {
  model: ModelData;
  isExpanded: boolean;
  onHover: () => void;
  onLeave: () => void;
  isLoading?: boolean;
}

const ModelCard: React.FC<ModelCardProps> = ({ 
  model, 
  isExpanded, 
  onHover, 
  onLeave,
  isLoading = false
}) => {
  const levelMap = {
    'Fast': 'text-info',
    'Balanced': 'text-ok',
    'High': 'text-b-300',
    'Very High': 'text-warn',
    'Maximum': 'text-err',
    'Code Specialist': 'text-b-400'
  } as const;

  const getIntelligenceBadgeClass = (level: ModelData['intelligenceLevel']): string => {
    return levelMap[level] || 'text-n-500';
  };

  return (
    <div 
      className="relative mono flex-shrink-0 w-full max-w-[320px] min-w-[280px]"
      style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      role="listitem"
    >
      {/* Card Principal - Mais retangular e responsivo */}
      <div
        className={`
          ${THEME.cardBg} rounded-xl p-4 shadow-lg border-2 ${THEME.cardBorder} 
          ${THEME.cardBorderHover} transition-all duration-300 cursor-pointer 
          relative z-10 w-full h-full min-h-[200px] flex flex-col
        `}
      >
        <div className="mb-3 flex-shrink-0">
          <h3 className={`text-lg font-bold mb-2 ${THEME.cardTitle} font-playfair line-clamp-1`}>
            {model.modelName}
          </h3>
        </div>

        <div className="space-y-2 mb-3 flex-grow">
          <div className={`text-sm ${THEME.cardText}`}>
            <span className="font-semibold">Memória:</span> {model.memoryUsage}
          </div>
          <div className={`text-sm ${THEME.cardText}`}>
            <span className="font-semibold">Inteligência:</span>{' '}
            <span className={`font-medium ${getIntelligenceBadgeClass(model.intelligenceLevel)}`}>
              {model.intelligenceLevel}
            </span>
          </div>
        </div>

        <div className={`border-t-2 ${THEME.cardDivider} pt-3 mb-3 space-y-1.5 flex-shrink-0`}>
          <div className={`h-1.5 ${THEME.cardProgressBar} rounded-full w-full opacity-60`}></div>
          <div className={`h-1.5 ${THEME.cardProgressBar} rounded-full w-3/4 opacity-40`}></div>
        </div>

        <button 
          className={`
            w-full py-2 rounded-lg font-medium text-sm ${THEME.buttonBg} 
            ${THEME.buttonBgHover} ${THEME.buttonText} transition-all duration-200 
            flex items-center justify-center gap-2 disabled:opacity-50 
            disabled:cursor-not-allowed relative z-20 flex-shrink-0
          `}
          onClick={(e) => {
            e.stopPropagation();
            console.log(`Usando modelo: ${model.modelName}`);
          }}
          disabled={isLoading}
        >
          {isLoading ? (
            <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
          ) : (
            <CheckCircle size={14} />
          )}
          {isLoading ? 'Carregando...' : 'Usar Modelo'}
        </button>
      </div>

      {/* Balão de Informações - Responsivo e reposicionável */}
      <div
        className={`
          ${THEME.detailsBg} rounded-xl p-4 shadow-xl border-2 ${THEME.detailsBorder} 
          transition-all duration-300 ease-out absolute z-30 w-[280px] max-w-[90vw]
          ${isExpanded ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}
        `}
        style={{
          // Posicionamento responsivo - ajusta conforme espaço disponível
          top: '50%',
          left: 'calc(100% + 12px)',
          transform: isExpanded ? 'translateY(-50%)' : 'translateY(-50%) translateX(10px)',
        }}
      >
        {/* Indicador do balão - lado esquerdo */}
        <div 
          className={`absolute top-1/2 -left-2 -translate-y-1/2 w-3 h-3 rounded-full ${THEME.detailsBg} border-2 ${THEME.detailsBorder} rotate-45`}
        ></div>
        
        <div className="flex items-center gap-2 mb-3">
          <Info size={14} className={THEME.detailsIcon} />
          <h4 className={`font-semibold text-sm ${THEME.detailsTitle}`}>
            Informações
          </h4>
        </div>

        <p className={`text-xs mb-3 leading-relaxed ${THEME.detailsText} line-clamp-3`}>
          {model.description}
        </p>

        {model.features && model.features.length > 0 && (
          <div className="space-y-1.5 mb-3">
            <h5 className={`text-xs font-semibold ${THEME.detailsLabel}`}>Características:</h5>
            <ul className="space-y-1">
              {model.features.map((feature, idx) => (
                <li 
                  key={idx} 
                  className={`flex items-start gap-1.5 text-xs ${THEME.detailsText}`}
                >
                  <CheckCircle 
                    size={10} 
                    className={`${THEME.statusSuccess} flex-shrink-0 mt-0.5`} 
                  />
                  <span className="leading-tight">{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className={`pt-2 border-t ${THEME.detailsDivider}`}>
          <div className="flex items-center justify-between">
            <span className={`text-xs ${THEME.detailsSubtext}`}>Memória</span>
            <span className={`text-xs font-semibold ${THEME.detailsIcon}`}>{model.memoryUsage}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModelCard;