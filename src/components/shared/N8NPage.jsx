// N8NPage.jsx - COM TAILWIND
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BackBtn, MinimizeBtn, MaximizeBtn, CloseBtn } from './WindowsComponents';
import BubbleLoading  from './BubbleLoading';
function N8NPage() {
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  return (
    <div className="w-full h-screen flex flex-col">
      {/* Header transparente com Tailwind */}
      <div className="px-4 py-3 bg-[#2d2e2e] border-b border-white/5 flex justify-between items-center">
        {/* Lado esquerdo - BackBtn e título */}
        <div className="flex items-center gap-4">
          <BackBtn whiteFixed = {true}/>
        </div>

        {/* Lado direito - Controles de janela */}
        <div className="flex items-center gap-2">
          <MinimizeBtn whiteFixed = {true}/>
          <MaximizeBtn whiteFixed = {true}/>
          <CloseBtn whiteFixed = {true}/>
        </div>
      </div>

      {/* Iframe ocupa o resto da tela */}
      <div className="flex-1 relative">
        {isLoading && (
          <div className="absolute inset-0 flex flex-colum items-center justify-center bg-black background-color">
          <BubbleLoading size={500} speed={2}/>
          </div>
        )}
        
        <iframe 
          src="http://localhost:5678"
          className="w-full h-full border-none"
          onLoad={() => setIsLoading(false)}
          title="N8N Workflow Editor"
          sandbox="allow-scripts allow-forms allow-same-origin allow-popups"
        />
      </div>
    </div>
  );
}

export default N8NPage;