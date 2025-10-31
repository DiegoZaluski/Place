import { Download as DownloadIcon } from 'lucide-react';
import React, { ButtonHTMLAttributes } from 'react';

interface DownloadButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  size?: number;
  iconSize?: number;
}

export const Download = ({
  size = 8,
  iconSize = 4,
  className = '',
  ...props
}: DownloadButtonProps) => {
  return (
    <button
      type="button"
      className={`
        border
        border-n-700
        rounded-full 
        flex items-center
        justify-center 
        hover:bg-white/20
        focus:outline-none
        focus:ring-2
        focus:ring-offset-2
        focus:ring-offset-n-900
        focus:ring-white/50
        transition-colors duration-200
        absolute
        p-1
        top-6
        right-6
        ${className}
      `}
      aria-label="Baixar"
      {...props}
    >
      <DownloadIcon className={`
        w-${iconSize}
        h-${iconSize}
        text-white`} />
    </button>
  );
};