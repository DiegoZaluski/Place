import React from 'react';

// CONFIGURATION VARIABLES (Based on your :root)
const RED_PRIMARY = '#585191';
const RED_TRANSPARENT = '#59519186';
const OUTLINE_COLOR = '#000';

// MAIN COMPONENT RENAMED TO LOGOBOX
const LogoBox = ({ size = 40 }) => {
  // Define the base size and half size based on the prop
  const cubeSize = size;
  const halfSize = size / 2;

  // CSS STYLES (KEYFRAMES AND FACE BASE)
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

  // MAIN CUBE STYLE (transform-style: preserve-3d)
  const cubeStyle = {
    width: cubeSize,
    height: cubeSize,
    position: 'relative',
    transformStyle: 'preserve-3d',
    transform: 'rotateX(-30deg) rotateY(45deg)',
  };

  return (
    // BACKGROUND REMOVED - ONLY THE NEEDED CONTAINER TO CENTER
    <div className="flex items-center justify-center w-full p-4">
      {/* Style block needed for Keyframes and base classes */}
      <style>{customStyles}</style>

      {/* PERSPECTIVE CONTAINER */}
      <div id="cube-container" style={{ perspective: '1000px' }} className="m-0">
        {/* MAIN 3D ELEMENT */}
        <div className="animated-cube isometric-cube-base" style={cubeStyle}>
          {/* FRONT FACE (Clip-Path) */}
          <div
            className="cube-face-base"
            style={{
              transform: `rotateY(0deg) translateZ(${halfSize}px)`,
              clipPath: 'polygon(50% 0%, 100% 0%, 100% 100%, 50% 100%, 50% 50%, 75% 25%, 75% 75%)',
              backgroundColor: 'transparent',
            }}
          />

          {/* BACK FACE */}
          <div
            className="cube-face-base"
            style={{ transform: `rotateY(180deg) translateZ(${halfSize}px)` }}
          />

          {/* TOP FACE (Transparent Red) */}
          <div
            className="cube-face-base"
            style={{
              transform: `rotateX(90deg) translateZ(${halfSize}px)`,
              background: RED_TRANSPARENT,
            }}
          />

          {/* BOTTOM FACE */}
          <div
            className="cube-face-base"
            style={{ transform: `rotateX(-90deg) translateZ(${halfSize}px)` }}
          />

          {/* LEFT FACE */}
          <div
            className="cube-face-base"
            style={{ transform: `rotateY(-90deg) translateZ(${halfSize}px)` }}
          />

          {/* RIGHT FACE (Primary Red) */}
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
