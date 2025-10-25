import { ArrowLeft, Minus, Square, X } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

export function BackBtn() {
    const navigate = useNavigate();
    
    const handleBack = () => {
      try {
        navigate(-1);
      } catch (error) {
        console.error('Error navigating back:', error);
        navigate('/');
      }
    };
    
    return (
      <button
        onClick={handleBack}
        className="w-8 h-8 flex items-center justify-center hover:bg-black/10 dark:hover:bg-white/10 transition-colors rounded absolute color-black"
        aria-label="Voltar"
      >
        <ArrowLeft size={16} className="text-black dark:text-white color-black" />
      </button>
    );
  }

export function MinimizeBtn() {
  return (
    <button
      onClick={() => window.electron?.invoke('window:minimize')}
      className="w-8 h-8 flex items-center justify-center hover:bg-black/10 dark:hover:bg-white/10 transition-colors rounded"
      aria-label="Minimizar"
    >
      <Minus size={16} className="text-black dark:text-white color-black" />
    </button>
  );
}

export function MaximizeBtn() {
  return (
    <button
      onClick={() => window.electron?.invoke('window:maximize')}
      className="w-8 h-8 flex items-center justify-center hover:bg-black/10 dark:hover:bg-white/10 transition-colors rounded"
      aria-label="Maximizar"
    >
      <Square size={14} className="text-black dark:text-white color-black" />
    </button>
  );
}

export function CloseBtn() {
  return (
    <button
      onClick={() => window.electron?.invoke('window:close')}
      className="w-8 h-8 flex items-center justify-center hover:bg-red-500 dark:hover:bg-red-600 transition-colors rounded group"
      aria-label="Fechar"
    >
      <X size={16} className="text-black dark:text-white color-black forced-white" />
    </button>
  );
}