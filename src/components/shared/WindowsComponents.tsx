import { CircleArrowOutUpLeft, Minus, Square, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// TYPE DEFINITIONS
interface WindowControlsProps {
  whiteFixed?: boolean;
}

// EXTEND WINDOW INTERFACE
declare global {
  interface Window {
    electron?: {
      invoke: (channel: string, ...args: any[]) => Promise<any>;
    };
  }
}

// BACK BUTTON COMPONENT
export function BackBtn({ whiteFixed = false }: WindowControlsProps) {
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
        className="w-8 h-8 flex items-center justify-center hover:bg-black/10 dark:hover:bg-white/10 transition-colors rounded absolute"
        aria-label="Voltar"
      >
        <CircleArrowOutUpLeft
          size={16} 
          className={`${whiteFixed ? 'filter invert' : 'text-black dark:text-white'}`} 
        />
      </button>
    );
}

// MINIMIZE BUTTON COMPONENT
export function MinimizeBtn({ whiteFixed = false }: WindowControlsProps) {
  return (
    <button
      onClick={() => window.electron?.invoke('window:minimize')}
      className="w-8 h-8 flex items-center justify-center hover:bg-black/10 dark:hover:bg-white/10 transition-colors rounded"
      aria-label="Minimizar"
    >
      <Minus size={16} className={`${whiteFixed ? 'filter invert' : 'text-black dark:text-white'}`} />
    </button>
  );
}

// MAXIMIZE BUTTON COMPONENT
export function MaximizeBtn({ whiteFixed = false }: WindowControlsProps) {
  return (
    <button
      onClick={() => window.electron?.invoke('window:maximize')}
      className="w-8 h-8 flex items-center justify-center hover:bg-black/10 dark:hover:bg-white/10 transition-colors rounded"
      aria-label="Maximizar"
    >
      <Square size={14} className={`${whiteFixed ? 'filter invert' : 'text-black dark:text-white'}`} />
    </button>
  );
}

// CLOSE BUTTON COMPONENT
export function CloseBtn({ whiteFixed = false }: WindowControlsProps) {
  return (
    <button
      onClick={() => window.electron?.invoke('window:close')}
      className="w-8 h-8 flex items-center justify-center hover:bg-red-500 dark:hover:bg-red-600 transition-colors rounded group"
      aria-label="Fechar"
    >
      <X size={16} className={`${whiteFixed ? 'brightness-0 invert' : 'text-black dark:text-white'}`} />
    </button>
  );
}