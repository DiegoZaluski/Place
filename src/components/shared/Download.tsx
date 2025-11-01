import { Download as DownloadIcon, X, Check } from 'lucide-react';
import React, { useState, useEffect, useContext, useRef } from 'react';
import { AppContext } from '../../global/AppProvider';

interface DownloadButtonProps {
  modelId: string;
  className?: string;
}

type DownloadStatus = 'checking' | 'idle' | 'connecting' | 'downloading' | 'downloaded' | 'error';

export const Download = ({ modelId, className = '' }: DownloadButtonProps) => {
  const context = useContext(AppContext);
  if (!context) throw new Error('Download must be used within AppProvider');

  const { setDownloadState } = context;
  const [status, setStatus] = useState<DownloadStatus>('checking');
  const [progress, setProgress] = useState(0);
  const eventSourceRef = useRef<EventSource | null>(null);
  const prevStateRef = useRef({ status, progress });

  // SYNC WITH CONTEXT - SAFE IMPLEMENTATION
  useEffect(() => {
    const currentState = { status, progress };
    
    // ONLY UPDATE IF STATE ACTUALLY CHANGED
    if (prevStateRef.current.status !== status || prevStateRef.current.progress !== progress) {
      console.log(`[Download] Syncing state for ${modelId}:`, { 
        from: prevStateRef.current, 
        to: currentState 
      });
      
      setDownloadState(modelId, currentState);
      prevStateRef.current = currentState;
    }
  }, [status, progress, modelId, setDownloadState]);

  // CHECK MODEL STATUS - WITH RACE CONDITION PROTECTION
  useEffect(() => {
    let mounted = true;
    console.log(`[Download] Checking status for model: ${modelId}`);
    
    const checkModelStatus = async () => {
      try {
        const response = await fetch(`http://localhost:8000/api/models/${modelId}/status`);
        if (!response.ok) throw new Error('Network response was not ok');
        
        const data = await response.json();
        console.log(`[Download] Status response for ${modelId}:`, data);
        
        if (mounted) {
          const newStatus = data.is_downloaded ? 'downloaded' : data.is_downloading ? 'downloading' : 'idle';
          console.log(`[Download] Setting status to: ${newStatus}`);
          
          setStatus(newStatus);
          if (data.is_downloaded) setProgress(100);
        }
      } catch (error) {
        console.error(`[Download] Status check failed for ${modelId}:`, error);
        if (mounted) {
          setStatus('idle');
        }
      }
    };

    checkModelStatus();

    return () => {
      console.log(`[Download] Cleanup status check for: ${modelId}`);
      mounted = false;
    };
  }, [modelId]);

  // EVENTSOURCE CLEANUP
  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        console.log(`[Download] Cleaning up EventSource for: ${modelId}`);
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, [modelId]);

  const handleDownload = async () => {
    console.log(`[Download] Handle download clicked for: ${modelId}, current status: ${status}`);

    if (status === 'downloading') {
      console.log(`[Download] Cancelling download for: ${modelId}`);
      
      // CLOSE EVENTSOURCE BEFORE CANCELLING
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      
      await fetch(`http://localhost:8000/api/models/${modelId}/download`, { method: 'DELETE' });
      setStatus('idle');
      setProgress(0);
      return;
    }

    if (status === 'downloaded') {
      console.log(`[Download] Model already downloaded: ${modelId}`);
      return;
    }

    console.log(`[Download] Starting download for: ${modelId}`);
    setStatus('connecting');
    setProgress(0);

    setTimeout(() => {
      console.log(`[Download] Establishing SSE connection for: ${modelId}`);
      setStatus('downloading');
      
      // USE REF TO CONTROL EVENTSOURCE
      const eventSource = new EventSource(`http://localhost:8000/api/models/${modelId}/download`);
      eventSourceRef.current = eventSource;

      eventSource.onmessage = (event) => {
        const data = JSON.parse(event.data);
        console.log(`[Download] SSE message for ${modelId}:`, data);
        
        // VERIFY THIS IS STILL THE CURRENT EVENTSOURCE
        if (eventSourceRef.current === eventSource) {
          if (data.type === 'progress') {
            setProgress(data.progress);
          } else if (data.type === 'completed') {
            console.log(`[Download] Download completed for: ${modelId}`);
            setStatus('downloaded');
            setProgress(100);
            eventSource.close();
            eventSourceRef.current = null;
          } else if (data.type === 'error') {
            console.error(`[Download] Download error for ${modelId}:`, data);
            setStatus('error');
            eventSource.close();
            eventSourceRef.current = null;
          }
        } else {
          console.log(`[Download] Ignoring message from old EventSource for: ${modelId}`);
        }
      };

      eventSource.onerror = (error) => {
        console.error(`[Download] EventSource error for ${modelId}:`, error);
        if (eventSourceRef.current === eventSource) {
          setStatus('error');
          eventSource.close();
          eventSourceRef.current = null;
        }
      };

      eventSource.onopen = () => {
        console.log(`[Download] EventSource connected for: ${modelId}`);
      };

    }, 1500);
  };

  const getIcon = () => {
    if (status === 'downloaded') return <Check className="w-4 h-4 text-green-400" />;
    if (status === 'downloading' || status === 'connecting') return <X className="w-4 h-4 text-white" />;
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
        ${status === 'downloaded' ? 'cursor-not-allowed opacity-50' : ''}
        ${className}
      `}
      aria-label={status === 'downloading' ? 'Cancelar' : 'Baixar'}
    >
      {(status === 'downloading' || status === 'connecting') && (
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