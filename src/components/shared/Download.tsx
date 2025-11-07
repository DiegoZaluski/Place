import { Download as DownloadIcon, X, Check, AlertCircle } from 'lucide-react';
import React, { useState, useEffect, useContext, useRef } from 'react';
import { AppContext } from '../../global/AppProvider';

interface DownloadButtonProps {
  modelId: string;
  className?: string;
}

type DownloadStatus = 'checking' | 'idle' | 'connecting' | 'downloading' | 'downloaded' | 'error';

// EXTEND WINDOW INTERFACE FOR ELECTRON API
declare global {
  interface Window {
    api?: {
      downloadServer?: {
        getStatus: () => Promise<{ success: boolean; status?: any; error?: string }>;
        start: () => Promise<{ success: boolean; info?: any; error?: string }>;
        getInfo: () => Promise<{ success: boolean; info?: { url: string; isRunning: boolean } }>;
      };
    };
  }
}

// CHECK MODEL STATUS FROM SERVER - MOVED TO TOP
const checkModelStatus = async (
  url: string,
  modelId: string,
  setStatus: (status: DownloadStatus) => void,
  setProgress: (progress: number) => void,
  isMounted: () => boolean,
  addDownloadedModel: (modelId: string) => void
): Promise<void> => {
  try {
    console.log(`[Download] Checking model status for: ${modelId}`);
    const response = await fetch(`${url}/api/models/${modelId}/status`);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log(`[Download] Status response for ${modelId}:`, data);
    
    if (isMounted()) {
      const newStatus: DownloadStatus = data.is_downloaded 
        ? 'downloaded' 
        : data.is_downloading 
        ? 'downloading' 
        : 'idle';
      
      console.log(`[Download] Setting status to: ${newStatus}`);
      setStatus(newStatus);
      
      if (data.is_downloaded) {
        setProgress(100);
        addDownloadedModel(modelId);
      } else if (data.is_downloading && typeof data.progress === 'number') {
        setProgress(data.progress);
      }
    }
  } catch (error) {
    console.error(`[Download] Model status check failed for ${modelId}:`, error);
    if (isMounted()) {
      setStatus('idle');
    }
  }
};

export const Download = ({ modelId, className = '' }: DownloadButtonProps) => {
  // STATE DECLARATIONS
  const [status, setStatus] = useState<DownloadStatus>('checking');
  const [progress, setProgress] = useState(0);
  const [serverUrl, setServerUrl] = useState<string | null>(null);
  
  // REFS
  const eventSourceRef = useRef<EventSource | null>(null);
  const prevStateRef = useRef({ status, progress });
  const mountedRef = useRef(true);

  // CONTEXT
  const context = useContext(AppContext);
  if (!context) throw new Error('Download must be used within AppProvider');
  const { setDownloadState, addDownloadedModel } = context;

  // HELPER FUNCTIONS
  const getIcon = (): JSX.Element => {
    if (status === 'downloaded') return <Check className="w-4 h-4 text-current" />;
    if (status === 'downloading' || status === 'connecting') return <X className="w-4 h-4" />;
    if (status === 'error') return <AlertCircle className="w-4 h-4" />;
    if (status === 'checking') return <DownloadIcon className="w-4 h-4 animate-pulse" />;
    return <DownloadIcon className="w-4 h-4 text-current" />;
  };

  // SYNC WITH CONTEXT - UPDATE ONLY WHEN CHANGED
  useEffect(() => {
    if (prevStateRef.current.status !== status || prevStateRef.current.progress !== progress) {
      console.log(`[Download] Syncing state for ${modelId}:`, { 
        from: prevStateRef.current, 
        to: { status, progress }
      });
      
      setDownloadState(modelId, { status, progress });
      prevStateRef.current = { status, progress };
    }
  }, [status, progress, modelId, setDownloadState]);

  // CLEANUP EVENTSOURCE ON UNMOUNT
  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        console.log(`[Download] Cleaning up EventSource for: ${modelId}`);
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, [modelId]);

  // INITIALIZE: GET SERVER URL AND CHECK MODEL STATUS
  useEffect(() => {
    mountedRef.current = true;
    let initTimeout: NodeJS.Timeout;

    const initialize = async () => {
      try {
        console.log(`[Download] Initializing for model: ${modelId}`);

        // 1. CHECK IF ELECTRON API IS AVAILABLE
        if (typeof window === 'undefined' || !window.api?.downloadServer) {
          console.error('[Download] Electron API not available');
          if (mountedRef.current) {
            setStatus('error');
            setDownloadState(modelId, { 
              status: 'error', 
              progress: 0,
              error: 'Electron API not available' 
            });
          }
          return;
        }

        // 2. GET SERVER STATUS OR START IT
        console.log('[Download] Checking SSE server status...');
        let url: string | null = null;

        try {
          const statusResult = await window.api.downloadServer.getStatus();
          
          if (statusResult.success && statusResult.status?.healthy && statusResult.status?.url) {
            url = statusResult.status.url;
            console.log('[Download] SSE server is healthy:', url);
          } else {
            // TRY TO START SERVER
            console.log('[Download] SSE server not ready, attempting to start...');
            const startResult = await window.api.downloadServer.start();
            
            if (startResult.success) {
              const infoResult = await window.api.downloadServer.getInfo();
              if (infoResult.success && infoResult.info?.url) {
                url = infoResult.info.url;
                console.log('[Download] SSE server started:', url);
              }
            }
          }
        } catch (error) {
          console.error('[Download] Failed to get/start server:', error);
        }

        if (!url) {
          console.error('[Download] Could not establish server URL');
          if (mountedRef.current) {
            setStatus('error');
            setDownloadState(modelId, { 
              status: 'error', 
              progress: 0,
              error: 'Server not available' 
            });
          }
          return;
        }

        setServerUrl(url);

        // 3. CHECK MODEL STATUS USING EXTRACTED FUNCTION
        await checkModelStatus(
          url, 
          modelId, 
          setStatus, 
          setProgress, 
          () => mountedRef.current,
          addDownloadedModel
        );

      } catch (error) {
        console.error('[Download] Initialization failed:', error);
        if (mountedRef.current) {
          setStatus('error');
          setDownloadState(modelId, { 
            status: 'error', 
            progress: 0,
            error: error instanceof Error ? error.message : 'Initialization failed' 
          });
        }
      }
    };

    // DELAY TO ENSURE MAIN PROCESS SERVER IS READY
    initTimeout = setTimeout(initialize, 1500);

    return () => {
      mountedRef.current = false;
      clearTimeout(initTimeout);
      console.log(`[Download] Cleanup for: ${modelId}`);
    };
  }, [modelId]);

  // HANDLE DOWNLOAD BUTTON CLICK
  const handleDownload = async () => {
    console.log(`[Download] Button clicked for: ${modelId}, status: ${status}`);

    if (!serverUrl) {
      console.error('[Download] Cannot proceed: server URL not available');
      setStatus('error');
      setDownloadState(modelId, { 
        status: 'error', 
        progress: 0,
        error: 'Server not available' 
      });
      return;
    }

    // CANCEL DOWNLOAD
    if (status === 'downloading') {
      console.log(`[Download] Cancelling download for: ${modelId}`);
      
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      
      try {
        await fetch(`${serverUrl}/api/models/${modelId}/download`, { method: 'DELETE' });
        setStatus('idle');
        setProgress(0);
      } catch (error) {
        console.error('[Download] Failed to cancel:', error);
        setStatus('error');
        setDownloadState(modelId, { 
          status: 'error', 
          progress: 0,
          error: 'Failed to cancel download' 
        });
      }
      return;
    }

    // ALREADY DOWNLOADED
    if (status === 'downloaded') {
      console.log(`[Download] Model already downloaded: ${modelId}`);
      return;
    }

    // START DOWNLOAD
    console.log(`[Download] Starting download for: ${modelId}`);
    setStatus('connecting');
    setProgress(0);

    setTimeout(() => {
      console.log(`[Download] Establishing SSE connection for: ${modelId}`);
      setStatus('downloading');
      
      const eventSource = new EventSource(`${serverUrl}/api/models/${modelId}/download`);
      eventSourceRef.current = eventSource;

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log(`[Download] SSE message for ${modelId}:`, data);
          
          if (eventSourceRef.current === eventSource && mountedRef.current) {
            if (data.type === 'progress' && typeof data.progress === 'number') {
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
              setDownloadState(modelId, { 
                status: 'error', 
                progress: 0,
                error: data.message || 'Download failed' 
              });
              eventSource.close();
              eventSourceRef.current = null;
            }
          }
        } catch (error) {
          console.error('[Download] Failed to parse SSE message:', error);
        }
      };

      eventSource.onerror = (error) => {
        console.error(`[Download] EventSource error for ${modelId}:`, error);
        if (eventSourceRef.current === eventSource && mountedRef.current) {
          setStatus('error');
          setDownloadState(modelId, { 
            status: 'error', 
            progress: 0,
            error: 'Connection lost' 
          });
          eventSource.close();
          eventSourceRef.current = null;
        }
      };

      eventSource.onopen = () => {
        console.log(`[Download] EventSource connected for: ${modelId}`);
      };

    }, 500);
  };

  // RENDER
  return (
    <button
      onClick={handleDownload}
      disabled={status === 'checking' || status === 'downloaded'}
      className={`
        border border-n-1000 rounded-full 
        flex items-center justify-center 
        hover:bg-white/20
        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-n-900 focus:ring-white/50
        transition-colors duration-200
        absolute p-1 top-6 right-6
        ${status === 'checking' || status === 'downloaded' ? 'cursor-not-allowed opacity-50' : ''}
        ${status === 'error' ? 'border-red-500/50' : ''}
        ${className}
      `}
      aria-label={status === 'downloading' ? 'Cancelar' : 'Baixar'}
      title={
        status === 'checking' ? 'Verificando...' :
        status === 'error' ? 'Erro - Clique para tentar novamente' :
        status === 'connecting' ? 'Conectando...' :
        status === 'downloading' ? `Baixando: ${Math.round(progress)}%` :
        status === 'downloaded' ? 'Download concluído' :
        'Baixar modelo'
      }
    >
      {(status === 'downloading' || status === 'connecting') && (
        <svg className="absolute inset-0 w-full h-full -rotate-90">
          <circle 
            cx="50%" 
            cy="50%" 
            r="40%" 
            stroke="currentColor" 
            strokeWidth="2" 
            fill="none" 
            className="text-white/20" 
          />
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
            style={{ transition: 'stroke-dashoffset 0.3s ease-out' }}
          />
        </svg>
      )}
      {getIcon()}
    </button>
  );
};