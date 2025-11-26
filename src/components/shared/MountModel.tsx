import { useState, useEffect, useContext } from 'react';
import { Orbit, Check, X } from 'lucide-react';
import { useStorage } from '../../hooks/useStorage';
import { AppContext } from '../../global/AppProvider';

interface MountModelProps {
  modelName: string;
  className?: string;
  testMode?: boolean;
}

// CUSTOM COLORS - CAN BE DEFINED IN THE CSS ROOT
const colors = {
  primary: 'transparent',
  success: '',
  error: 'text-err',
  loading: 'bg-gray-400 cursor-not-allowed',
  textInit: 'text-white',
  icons: `white`
};

export const MountModel = ({ modelName, className = '', testMode = false }: MountModelProps) => {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [showTooltip, setShowTooltip] = useState(false);
  const contexCurrentModel = useContext(AppContext);
  const {curretModel, setCurrentModel, downloadedModels} = contexCurrentModel;

  const isMounted = modelName === curretModel ? true : false;
  const isDownloaded = () => {
    for (let model of downloadedModels) {
      if (model === modelName) {
        return true;
      } 
    }
    return false;
  };
  
  useEffect(() => {
    if(isMounted){
      setStatus('success');
    } else {
      setStatus('idle');
    }
  }, [curretModel]);
  const handleMount = async () => {
    setStatus('loading');
    setErrorMessage('');
    setShowTooltip(false);

    try {
      // TEST MODE - WAITS 10 SECONDS TO SEE THE ANIMATION
      if (testMode) {
        await new Promise(resolve => setTimeout(resolve, 10000));
        // SIMULATES SUCCESS AFTER 10S IN TEST MODE
        setStatus('success');
        return;
      }

      const response = await fetch('http://localhost:8001/switch-model', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ model_name: modelName }),
      });

      // CHECKS IF THE HTTP RESPONSE IS OK (STATUS 200-299)
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Erro HTTP: ${response.status}`);
      }

      const data = await response.json();

      // CHECKS IF THE OPERATION WAS SUCCESSFUL ON THE BACKEND
      if (data.status === 'success') {
        setStatus('success');
        setCurrentModel(modelName);
      } else {
        setStatus('error');
        setErrorMessage(data.message || 'Operation was not completed successfully');
      }
    } catch (error) {
      setStatus('error');
      setErrorMessage(
        error instanceof Error 
          ? error.message 
          : 'Failed to communicate with the server'
      );
    }
  };

  if (!isDownloaded()) {
    return null;
  }
  return (
    <div className="relative flex items-center justify-center">
      {/* ERROR TOOLTIP - LEFT SIDE */}
      {status === 'error' && showTooltip && errorMessage && (
        <div className="absolute right-full mr-2 top-1/2 transform -translate-y-1/2 z-50">
          <div className="bg-red-600 text-white text-xs px-2 py-1 rounded shadow-lg max-w-xs border border-red-700">
            <div className="whitespace-nowrap font-medium">{errorMessage}</div>
            <div className="absolute left-full top-1/2 transform -translate-y-1/2 border-4 border-transparent border-l-red-600"></div>
          </div>
        </div>
      )}

      {/* NORMAL BUTTON - APPEARS IN IDLE, SUCCESS AND ERROR STATES */}
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
          {status === 'success' && <Check stroke={colors.icons} className="w-4 h-4" />}
          {status === 'error' && <X stroke={colors.icons} className="w-4 h-4" />}
          {status === 'success' ? 'Mounted' : status === 'error' ? 'Mount failed' : 'Mount'}
        </button>
      )}

      {/* ONLY THE GEAR - NO BUTTON DURING LOADING */}
      {status === 'loading' && (
        <div className="flex items-center justify-center">
          <Orbit 
          stroke={colors.icons}
          className="w-8 h-8 dark-text-primary animate-spin" />
        </div>
      )}
    </div>
  );
};