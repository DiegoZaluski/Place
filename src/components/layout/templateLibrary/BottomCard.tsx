import React from 'react';
import { Download } from 'lucide-react';


interface BottomCardProps {
  item: {
    title: string;
    detail: string;
  };
  index: number;
}

function BottomCard({ item, index }: BottomCardProps) {
  return (
    <div
      key={`bottom-card-${index + 5}`}
      className="bg-n-900 dark:bg-c-50 h-92 border border-n-700 dark:border-n-200 rounded-3xl px-4 py-4 shadow-2xl flex flex-col justify-center items-center transition-all duration-300 hover:translate-y-[-4px] hover:shadow-xl cursor-pointer"
    >
      {/* INTERNO: FUNDO EM COR BRAND PARA DESTACAR COMO PRINCIPAL COR DE DETALHE */}
      <div className="w-full h-full bg-b-600 dark:bg-b-100 rounded-2xl p-6 space-y-3 flex flex-col justify-start transition-colors duration-200">
        <div className='w-8 h-8 border border-n-700 rounded-full flex items-center justify-center hover:bg-white/20 '>
          <Download className="w-4 h-4 text-white" />
        </div>
        <h4 className="text-white dark:text-n-900 text-lg font-bold mb-2 border-b border-n-700 pb-1 leading-tight font-playfair">{item.title}</h4>

        {/* DETALHES PREENCHENDO O ESPAÇO INTERNO */}
        <p className="text-white/95 dark:text-n-800 text-sm leading-relaxed">{item.detail.split('.')[0]}.</p>
        <p className="text-white/80 dark:text-n-700 text-xs leading-relaxed">{item.detail.split('.')[1] ? item.detail.split('.')[1].trim() : ""}</p>

        {/* PLACEHOLDERS DE LINHAS ORIGINAIS (DECORATIVAS) NO RODAPÉ DO BLOCO */}
        <div className="flex-grow"></div>
        <div className="w-4/5 h-2 bg-n-700 dark:bg-n-200 rounded-full"></div>
        <div className="w-full h-2 bg-n-700 dark:bg-n-200 rounded-full"></div>
        <div className="w-3/4 h-2 bg-n-700 dark:bg-n-200 rounded-full"></div>
      </div>
    </div>
  );
}

export default BottomCard;
