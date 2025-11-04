import { useState } from 'react';
import { Settings, Check, X } from 'lucide-react';

interface MountModelProps {
  modelName: string;
  className?: string;
  testMode?: boolean;
}

// Cores customizadas - podem ser definidas no root do CSS
const colors = {
  primary: 'transparent border border-gray-400',
  success: 'bg-green-600 hover:bg-green-700',
  error: 'text-err',
  loading: 'bg-gray-400 cursor-not-allowed',
  textInit: 'dark-text-brand-light',
};

export const MountModel = ({ modelName, className = '', testMode = false }: MountModelProps) => {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [showTooltip, setShowTooltip] = useState(false);

  const handleMount = async () => {
    setStatus('loading');
    setErrorMessage('');
    setShowTooltip(false);

    try {
      // Modo teste - espera 10 segundos para ver animação
      if (testMode) {
        await new Promise(resolve => setTimeout(resolve, 10000));
        // Simula sucesso após 10s no modo teste
        setStatus('success');
        return;
      }

      const response = await fetch('http://localhost:8000/switch-model', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ model_name: modelName }),
      });

      // Verifica se a resposta HTTP é ok (status 200-299)
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Erro HTTP: ${response.status}`);
      }

      const data = await response.json();

      // Verifica se a operação foi bem sucedida no backend
      if (data.status === 'success') {
        setStatus('success');
      } else {
        setStatus('error');
        setErrorMessage(data.message || 'Operação não foi completada com sucesso');
      }
    } catch (error) {
      setStatus('error');
      setErrorMessage(
        error instanceof Error 
          ? error.message 
          : 'Falha na comunicação com o servidor'
      );
    }
  };

  return (
    <div className="relative flex items-center justify-center">
      {/* Tooltip de erro - LADO ESQUERDO */}
      {status === 'error' && showTooltip && errorMessage && (
        <div className="absolute right-full mr-2 top-1/2 transform -translate-y-1/2 z-50">
          <div className="bg-red-600 text-white text-xs px-2 py-1 rounded shadow-lg max-w-xs border border-red-700">
            <div className="whitespace-nowrap font-medium">{errorMessage}</div>
            <div className="absolute left-full top-1/2 transform -translate-y-1/2 border-4 border-transparent border-l-red-600"></div>
          </div>
        </div>
      )}

      {/* BOTÃO NORMAL - APARECE EM IDLE, SUCCESS E ERROR */}
      {status !== 'loading' && (
        <button
          onClick={handleMount}
          disabled={status === 'success'}
          onMouseEnter={() => status === 'error' && setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
          className={`
            flex items-center gap-2 px-4 py-2font-medium rounded-lg
            transition-all duration-200 ease-in-out relative z-10
            ${colors.textInit}
            ${status === 'idle' ? colors.primary : ''}
            ${status === 'success' ? colors.success : ''}
            ${status === 'error' ? colors.error : ''}
            ${className}
            ${status === 'idle' || status === 'error' ? 'transform hover:scale-105 active:scale-95' : ''}
            ${testMode ? 'ring-2 ring-yellow-400' : ''}
          `}
        >
          {status === 'success' && <Check className="w-4 h-4" />}
          {status === 'error' && <X className="w-4 h-4" />}
          {status === 'success' ? 'Montado': status === 'error' ? 'Montagem falhou' : 'Montar'}
        </button>
      )}

      {/* APENAS A ENGRENAGEM - SEM BOTÃO DURANTE LOADING */}
      {status === 'loading' && (
        <div className="flex items-center justify-center">
          <Settings className="w-8 h-8 text-gray-600 animate-spin" />
        </div>
      )}
    </div>
  );
};