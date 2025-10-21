import React from 'react';

// --- Variáveis de Configuração (Baseado no seu :root) ---
const RED_PRIMARY = 'tomato';
const RED_TRANSPARENT = 'rgba(255, 99, 71, 0.75)';
const OUTLINE_COLOR = '#000';

// --- Componente Principal Renomeado para LogoBox ---
const LogoBox = ({ size = 40 }) => {
  // Define o tamanho base e metade do tamanho baseado na prop
  const cubeSize = size;
  const halfSize = size / 2;

  // Estilos CSS complexos (Keyframes e Base das Faces)
  const customStyles = `
    @media (max-width: 800px) {
      .isometric-cube-base {
        width: ${Math.min(size, 30)}px !important;
        height: ${Math.min(size, 30)}px !important;
      }
    }
    
    .cube-face-base {
      position: absolute;
      width: ${cubeSize}px;
      height: ${cubeSize}px;
      box-sizing: border-box;
      border: 1px solid ${OUTLINE_COLOR};
      background-color: transparent;
    }

    @keyframes rotateCubeSmooth {
      0% { transform: rotateX(-30deg) rotateY(45deg); }
      100% { transform: rotateX(330deg) rotateY(765deg); }
    }
    
    .animated-cube {
      animation: rotateCubeSmooth 12s linear infinite;
    }
  `;

  // Estilo do Cubo Principal (transform-style: preserve-3d)
  const cubeStyle = {
    width: cubeSize,
    height: cubeSize,
    position: 'relative',
    transformStyle: 'preserve-3d',
    transform: 'rotateX(-30deg) rotateY(45deg)',
  };

  return (
    // Fundo removido - apenas o container necessário para centralizar
    <div className="flex items-center justify-center w-full p-4">
      {/* Bloco de estilo necessário para Keyframes e classes base */}
      <style>{customStyles}</style>

      {/* Container de Perspectiva */}
      <div id="cube-container" style={{ perspective: '1000px' }} className="m-0">
        
        {/* Elemento 3D Principal */}
        <div
          className="animated-cube isometric-cube-base"
          style={cubeStyle}
        >
          {/* FACE FRONTAL (Clip-Path) */}
          <div
            className="cube-face-base"
            style={{
              transform: `rotateY(0deg) translateZ(${halfSize}px)`,
              clipPath: 'polygon(50% 0%, 100% 0%, 100% 100%, 50% 100%, 50% 50%, 75% 25%, 75% 75%)',
              backgroundColor: 'transparent',
            }}
          />

          {/* FACE TRASEIRA */}
          <div
            className="cube-face-base"
            style={{ transform: `rotateY(180deg) translateZ(${halfSize}px)` }}
          />

          {/* FACE SUPERIOR (Vermelho Transparente) */}
          <div
            className="cube-face-base"
            style={{
              transform: `rotateX(90deg) translateZ(${halfSize}px)`,
              background: RED_TRANSPARENT,
            }}
          />

          {/* FACE INFERIOR */}
          <div
            className="cube-face-base"
            style={{ transform: `rotateX(-90deg) translateZ(${halfSize}px)` }}
          />

          {/* FACE ESQUERDA */}
          <div
            className="cube-face-base"
            style={{ transform: `rotateY(-90deg) translateZ(${halfSize}px)` }}
          />

          {/* FACE DIREITA (Vermelho Primário) */}
          <div
            className="cube-face-base"
            style={{
              transform: `rotateY(90deg) translateZ(${halfSize}px)`,
              backgroundColor: RED_PRIMARY,
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default LogoBox;