import React from "react";
import { Eraser } from "lucide-react";
interface ClearButtonProps {
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onClick: () => void;
  className?: string;
}

const ClearButton = React.memo(({ onMouseEnter, onMouseLeave, onClick, className }: ClearButtonProps) => (
  <button
    onMouseEnter={onMouseEnter}
    onMouseLeave={onMouseLeave}
    onClick={onClick}
    className={`
      ${className} 
      flex w-14 h-12 
      rounded-md bottom-2 
      transform 
      -translate-y-1/2 
      items-center 
      justify-center 
      self-center 
      relative`}
    aria-label="Clear message"
    type="button"
    >
    <Eraser className="text-white active:opacity-50" />
  </button>
));
export default ClearButton;