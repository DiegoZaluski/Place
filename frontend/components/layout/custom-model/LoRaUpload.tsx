import { useCallback } from 'react';
import { Upload, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

// LORA UPLOAD COMPONENT
interface LoRaUploadProps {
  files: LoRaFile[];
  onAdd: (file: LoRaFile) => void;
  onRemove: (fileId: number) => void;
}

export interface LoRaFile {
  id: number;
  name: string;
  size: number;
}

export const LoRaUpload: React.FC<LoRaUploadProps> = ({ files, onAdd, onRemove }) => {
  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file && files.length < 5) {
        onAdd({
          id: Date.now(),
          name: file.name,
          size: file.size,
        });
        e.target.value = '';
      }
    },
    [files.length, onAdd],
  );
  const { t } = useTranslation('common');
  return (
    <div className="space-y-2">
      <div className={'p-4 border-b border-white/30'}>
        <div
          className="
        flex 
        items-center 
        gap-2 
        mb-2"
        >
          <label
            className="
          text-xs 
          font-semibold 
          dark-text-primary
          uppercase 
          tracking-widest"
          >
            LoRa
          </label>
        </div>
        <p
          className="
        text-xs 
        dark-text-primary 
        mb-4"
        >
          {t('loraAdjust', { returnObjects: false })}
        </p>

        {files.length < 5 && (
          <label
            className="
          flex 
          items-center 
          justify-center 
          gap-2 
          px-4 
          py-2.5 
          bg-neutral-900 
          dark-text-primary 
          rounded-md 
          font-medium 
          text-sm 
          cursor-pointer 
          hover:bg-neutral-800 
          transition-colors 
          border 
          border-neutral-900"
          >
            <Upload size={14} />
            Upload LoRa
            <input
              type="file"
              onChange={handleFileChange}
              className="hidden"
              accept=".bin,.pt,.safetensors"
            />
          </label>
        )}

        {files.length > 0 && (
          <div className="mt-3 space-y-2">
            {files.map((file) => (
              <div
                key={file.id}
                className="flex items-center justify-between bg-white p-2 rounded border border-neutral-200 text-xs"
              >
                <span className="text-c-50 truncate font-medium flex-1 mr-2">{file.name}</span>
                <button
                  onClick={() => onRemove(file.id)}
                  className="p-1 hover:bg-red-50 rounded text-neutral-500 hover:text-red-600 transition-colors flex-shrink-0"
                  aria-label={`Remover ${file.name}`}
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        )}
        <p className="text-xs text-c-50 mt-2 font-medium">{files.length}/5</p>
      </div>
    </div>
  );
};
