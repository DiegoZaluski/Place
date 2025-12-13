import React from 'react';
import { Download } from '../../shared/download/Download';
import DownloadProgress from '../../shared/download/DownloadProgress';
import {MountModel} from '../../shared/buttons/MountModel';
const COLORS = {
  text: `text-white`,
} as const;

interface BottomCardProps {
  item: {
    modelName: string;
    memoryUsage: string;
    intelligenceLevel: string;
    fullModelName: string;
  };
  index: number;
  icon: React.ReactNode;
}

function BottomCard({ item, index, icon }: BottomCardProps) {
  return (
    <div
      key={`bottom-card-${index + 5}`}
      className=" 
        h-92 border 
        dark-border-primary 
        rounded-3xl 
        shadow-2xl 
        flex 
        flex-col 
        justify-center 
        items-center 
        transition-all 
        duration-300 
        hover:translate-y-[-4px] 
        hover:shadow-xl 
        relative"
    >
      <div className="
        w-full 
        h-full 
        bg-card 
        rounded-2xl p-6 
        space-y-3 
        flex 
        flex-col 
        justify-start 
        transition-colors 
        duration-200">
        {icon}
        <Download modelId={item.fullModelName} />
        
        <h4 className={`
          ${COLORS.text} 
          text-lg 
          font-bold 
          mb-2 
          border-b 
          border-n-700 
          pb-1 
          leading-tight 
          font-playfair`}>
          {item.modelName}
        </h4>
        
        <div className="space-y-2">
          <p className={`
            ${COLORS.text} 
            text-sm`}>
            <span className="font-semibold">Uso de Memória:</span> {item.memoryUsage}
          </p>
          <p className={`
            ${COLORS.text} 
            text-sm`}>
            <span className="font-semibold">Nível de Inteligência:</span> {item.intelligenceLevel}
          </p>
        </div>
        
        <div className="flex-grow"></div>

        <DownloadProgress 
          modelId={item.fullModelName} 
          size="sm" 
        />
      
        <MountModel 
          modelName={item.fullModelName}
          className="w-full py-2 rounded-lg font-medium text-sm flex items-center justify-center gap-2"
        />   
      </div>
    </div>
  );
}

export default BottomCard;