import React from 'react';

function BottomCard({ item, index }) {
  return (
    <div
      key={`bottom-card-${index + 5}`}
      // Aumento para h-88
      className="bg-[#151517] h-92 border border-white/10 rounded-3xl px-4 py-4 shadow-2xl flex flex-col justify-center items-center transition-transform duration-300 hover:translate-y-[-4px] hover:shadow-xl cursor-pointer"
    >
      {/* INTERNO: Fundo em #605C4E para destacar como principal cor de detalhe */}
      <div className="w-full h-full bg-[#605C4E]/95 rounded-2xl p-6 space-y-3 flex flex-col justify-start">
        <h4 className="text-white text-lg font-bold mb-2 border-b border-white/20 pb-1 leading-tight font-playfair">{item.title}</h4>

        {/* Detalhes preenchendo o espaço interno */}
        <p className="text-white/95 text-sm leading-relaxed">{item.detail.split('.')[0]}.</p>
        <p className="text-white/80 text-xs leading-relaxed">{item.detail.split('.')[1] ? item.detail.split('.')[1].trim() : ""}</p>

        {/* Placeholders de linhas originais (decorativas) no rodapé do bloco */}
        <div className="flex-grow"></div>
        <div className="w-4/5 h-2 bg-white/20 rounded-full"></div>
        <div className="w-full h-2 bg-white/20 rounded-full"></div>
        <div className="w-3/4 h-2 bg-white/20 rounded-full"></div>
      </div>
    </div>
  );
}

export default BottomCard;
