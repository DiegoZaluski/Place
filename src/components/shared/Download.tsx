import { Download as DownloadIcon, X, Check } from 'lucide-react';
import React, { useState, useEffect } from 'react';

interface DownloadButtonProps {
  modelId: string;
  className?: string;
}

type DownloadStatus = 'checking' | 'idle' | 'downloading' | 'downloaded' | 'error';

export const Download = ({ modelId, className = '' }: DownloadButtonProps) => {
  const [status, setStatus] = useState<DownloadStatus>('checking');
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    checkModelStatus();
  }, [modelId]);

  const checkModelStatus = async () => {
    try {
      const response = await fetch(`http://localhost:8000/api/models/${modelId}/status`);
      const data = await response.json();
      
      setStatus(data.is_downloaded ? 'downloaded' : data.is_downloading ? 'downloading' : 'idle');
      if (data.is_downloaded) setProgress(100);
    } catch (error) {
      setStatus('idle');
    }
  };

  const handleDownload = async () => {
    if (status === 'downloading') {
      await fetch(`http://localhost:8000/api/models/${modelId}/download`, { method: 'DELETE' });
      setStatus('idle');
      setProgress(0);
      return;
    }

    if (status === 'downloaded') return;

    setStatus('downloading');
    
    const eventSource = new EventSource(`http://localhost:8000/api/models/${modelId}/download`);

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.type === 'progress') {
        setProgress(data.progress);
      } else if (data.type === 'completed') {
        setStatus('downloaded');
        setProgress(100);
        eventSource.close();
      } else if (data.type === 'error') {
        setStatus('error');
        eventSource.close();
      }
    };

    eventSource.onerror = () => {
      setStatus('error');
      eventSource.close();
    };
  };

  const getIcon = () => {
    if (status === 'downloaded') return <Check className="w-4 h-4 text-green-400" />;
    if (status === 'downloading') return <X className="w-4 h-4 text-white" />;
    if (status === 'error') return <DownloadIcon className="w-4 h-4 text-red-400" />;
    return <DownloadIcon className="w-4 h-4 text-white" />;
  };

  return (
    <button
      onClick={handleDownload}
      disabled={status === 'checking'}
      className={`
        border border-n-700 rounded-full 
        flex items-center justify-center 
        hover:bg-white/20
        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-n-900 focus:ring-white/50
        transition-colors duration-200
        absolute p-1 top-6 right-6
        absolute
        ${status === 'downloaded' ? 'cursor-not-allowed opacity-50' : ''}
        ${className}
      `}
      aria-label={status === 'downloading' ? 'Cancelar' : 'Baixar'}
    >
      {status === 'downloading' && (
        <svg className="absolute inset-0 w-full h-full -rotate-90">
          <circle cx="50%" cy="50%" r="40%" stroke="currentColor" strokeWidth="2" fill="none" className="text-white/20" />
          <circle 
            cx="50%" 
            cy="50%" 
            r="40%" 
            stroke="currentColor" 
            strokeWidth="2" 
            fill="none"
            strokeDasharray="251.2"
            strokeDashoffset={251.2 * (1 - progress / 100)}
            className="text-white transition-all duration-300"
          />
        </svg>
      )}
      {getIcon()}
    </button>
  );
};