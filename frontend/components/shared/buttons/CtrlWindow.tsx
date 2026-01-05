import { ArrowLeft, Minus, Square, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface WindowControlsProps {
  stroke: string;
  className?: string;
}

// EXTEND WINDOW INTERFACE
declare global {
  interface Window {
    api?: {
      invoke: (channel: string, ...args: any[]) => Promise<any>;
    };
  }
}

// BACK BUTTON COMPONENT
export function BackBtn({ className, stroke }: WindowControlsProps) {
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
      className={`w-8 h-8 flex items-center justify-center hover:bg-black/10 dark:hover:bg-white/10 transition-colors rounded absolute no-drag-handle ${className}`}
      aria-label="Voltar"
    >
      <ArrowLeft size={16} stroke={stroke} className={stroke} />
    </button>
  );
}

// MINIMIZE BUTTON COMPONENT
export function MinimizeBtn({ stroke }: WindowControlsProps) {
  return (
    <button
      onClick={() => window.api?.invoke('window:minimize')}
      className="w-8 h-8 flex items-center justify-center hover:bg-black/10 dark:hover:bg-white/10 transition-colors rounded no-drag-handle"
      aria-label="Minimizar"
    >
      <Minus size={16} stroke={stroke} />
    </button>
  );
}

// MAXIMIZE BUTTON COMPONENT
export function MaximizeBtn({ stroke }: WindowControlsProps) {
  return (
    <button
      onClick={() => window.api?.invoke('window:maximize')}
      className="w-8 h-8 flex items-center justify-center hover:bg-black/10 dark:hover:bg-white/10 transition-colors rounded no-drag-handle"
      aria-label="Maximizar"
    >
      <Square size={14} stroke={stroke} />
    </button>
  );
}

// CLOSE BUTTON COMPONENT
export function CloseBtn({ stroke }: WindowControlsProps) {
  return (
    <button
      onClick={() => window.api?.invoke('window:close')}
      className="w-8 h-8 flex items-center justify-center hover:bg-red-500 dark:hover:bg-red-600 transition-colors rounded group no-drag-handle"
      aria-label="Fechar"
    >
      <X size={16} stroke={stroke} />
    </button>
  );
}
