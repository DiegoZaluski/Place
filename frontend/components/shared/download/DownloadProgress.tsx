import React, { useContext, useEffect, useState } from 'react';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { AppContext } from '../../../global/AppProvider';

const COLORS = {
  spinnerPrimary: '#3b82f6',
  progressBackground: '#e5e7eb',
  progressFill: 'var(--pur-300)',
  progressBorder: '#d1d5db',
  textPrimary: '#1f2937',
  textSecondary: '#6b7280',
  blinkLight: '#ffffff',
  blinkDark: '#d1d5db',
};

const STALL_TIMEOUT = 15000; // 15 seconds without progress

interface DownloadProgressProps {
  modelId: string;
  size?: 'sm' | 'md' | 'lg';
}

const DownloadProgress: React.FC<DownloadProgressProps> = ({ modelId, size = 'md' }) => {
  const context = useContext(AppContext);
  if (!context) throw new Error('DownloadProgress must be used within AppProvider');

  const { getDownloadState } = context;
  const { status, progress, error } = getDownloadState(modelId);

  const [isStalled, setIsStalled] = useState(false);
  const [lastProgress, setLastProgress] = useState(0);
  const [lastUpdate, setLastUpdate] = useState(Date.now());

  useEffect(() => {
    if (status === 'downloading') {
      if (progress !== lastProgress && progress > 0) {
        setLastProgress(progress);
        setLastUpdate(Date.now());
        setIsStalled(false);
      } else {
        const timer = setTimeout(() => {
          const timeSinceUpdate = Date.now() - lastUpdate;
          if (timeSinceUpdate >= STALL_TIMEOUT && progress === lastProgress) {
            setIsStalled(true);
          }
        }, STALL_TIMEOUT);

        return () => clearTimeout(timer);
      }
    } else {
      setIsStalled(false);
      setLastProgress(0);
    }
  }, [status, progress, lastProgress, lastUpdate]);

  const sizes = {
    sm: {
      spinner: 20,
      progressHeight: 'h-1.5',
      fontSize: 'text-xs',
    },
    md: {
      spinner: 24,
      progressHeight: 'h-2',
      fontSize: 'text-sm',
    },
    lg: {
      spinner: 32,
      progressHeight: 'h-3',
      fontSize: 'text-base',
    },
  };

  const currentSize = sizes[size];

  if (status === 'idle' || status === 'checking') {
    return null;
  }

  return (
    <div className="w-full">
      {status === 'connecting' && (
        <div className="flex flex-col items-center gap-3">
          <Loader2
            size={currentSize.spinner}
            className="animate-spin"
            style={{ color: COLORS.spinnerPrimary }}
          />
          <p
            className={`${currentSize.fontSize} font-medium`}
            style={{ color: COLORS.textSecondary }}
          >
            Connecting to server...
          </p>
        </div>
      )}

      {status === 'downloading' && !isStalled && (
        <div className="w-full space-y-2">
          <div className="flex justify-between items-center">
            <p
              className={`${currentSize.fontSize} font-medium`}
              style={{ color: COLORS.textPrimary }}
            >
              Downloading...
            </p>
            <p
              className={`${currentSize.fontSize} font-semibold`}
              style={{ color: COLORS.textPrimary }}
            >
              {Math.round(progress)}%
            </p>
          </div>
          <div
            className={`w-full ${currentSize.progressHeight} rounded-full overflow-hidden`}
            style={{
              backgroundColor: COLORS.progressBackground,
              border: `1px solid ${COLORS.progressBorder}`,
            }}
          >
            <div
              className={`${currentSize.progressHeight} rounded-full transition-all duration-300 ease-out`}
              style={{
                width: `${progress}%`,
                backgroundColor: COLORS.progressFill,
              }}
            />
          </div>
        </div>
      )}

      {status === 'downloading' && isStalled && (
        <div className="flex flex-col items-center gap-2">
          <p
            className={`${currentSize.fontSize} font-medium animate-pulse`}
            style={{
              color: COLORS.textSecondary,
              animationDuration: '1.5s',
            }}
          >
            downloading
          </p>
        </div>
      )}

      {status === 'downloaded' && (
        <div className="flex flex-col items-center gap-2">
          <CheckCircle2 size={currentSize.spinner} style={{ color: COLORS.progressFill }} />
          <p
            className={`${currentSize.fontSize} font-medium`}
            style={{ color: COLORS.textPrimary }}
          >
            model available!
          </p>
        </div>
      )}

      {status === 'error' && (
        <div className="flex flex-col items-center gap-2">
          <AlertCircle size={currentSize.spinner} style={{ color: '#ef4444' }} />
          <p className={`${currentSize.fontSize} font-medium text-red-600`}>
            Error: {error || 'Unknown error'}
          </p>
        </div>
      )}
    </div>
  );
};

export default DownloadProgress;

