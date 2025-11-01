import React from 'react';
import { Download } from '../../shared/Download';
import DownloadProgress from '../../shared/DownloadProgress';

interface BottomCardProps {
  item: {
    modelName: string;
    memoryUsage: string;
    intelligenceLevel: string;
    fullModelName: string;
  };
  index: number;
}

function BottomCard({ item, index }: BottomCardProps) {
  return (
    <div
      key={`bottom-card-${index + 5}`}
      className="bg-n-900 dark:bg-c-50 h-92 border border-n-700 dark:border-n-200 rounded-3xl px-4 py-4 shadow-2xl flex flex-col justify-center items-center transition-all duration-300 hover:translate-y-[-4px] hover:shadow-xl cursor-pointer relative"
    >
      <div className="w-full h-full bg-b-600 dark:bg-b-100 rounded-2xl p-6 space-y-3 flex flex-col justify-start transition-colors duration-200">
        
        <Download modelId={item.fullModelName} />
        
        <h4 className="text-white dark:text-n-900 text-lg font-bold mb-2 border-b border-n-700 pb-1 leading-tight font-playfair">
          {item.modelName}
        </h4>
        
        <div className="space-y-2">
          <p className="text-white/95 dark:text-n-800 text-sm">
            <span className="font-semibold">Uso de Memória:</span> {item.memoryUsage}
          </p>
          <p className="text-white/95 dark:text-n-800 text-sm">
            <span className="font-semibold">Nível de Inteligência:</span> {item.intelligenceLevel}
          </p>
        </div>
        
        <div className="flex-grow"></div>
        
        <div className="w-full h-2 bg-n-700 dark:bg-n-200 rounded-full"></div>
        <div className="w-4/5 h-2 bg-n-700 dark:bg-n-200 rounded-full"></div>

        <DownloadProgress 
          modelId={item.fullModelName} 
          size="sm" 
        />
        
      </div>
    </div>
  );
}

export default BottomCard;