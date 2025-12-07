import { useState, useRef } from 'react';
import { useGesture } from '../../../hooks/useGesture';

const Control = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isMinimized, setIsMinimized] = useState(false);
  
  const gesture = useGesture({
    BASE_SIZE: 400,
    ELEMENT_HEIGHT: 80,
    MIN_SCALE: 0.8,
    MAX_SCALE: 1.5,
    SCALE_STEP: 0.05
  });

  const [buttons] = useState([
    { id: 1 },
    { id: 2 },
    { id: 3 },
    { id: 4 },
  ]);

  const handleBallClick = () => {
    setIsMinimized(!isMinimized);
  };

  return (
    <div 
      ref={containerRef}
      className="flex flex-row items-center border-2 border-white/30"
      style={{
        transform: `translate(${gesture.position.x}px, ${gesture.position.y}px) scale(${gesture.scale})`,
        width: isMinimized ? '48px' : '400px',
        height: isMinimized ? '48px' : '80px',
        borderRadius: isMinimized ? '50%' : '24px',
        transition: 'width 300ms ease-in-out, height 300ms ease-in-out, border-radius 300ms ease-in-out',
      }}
      onWheel={(e) => gesture.handleWheel(e, containerRef)}
      onTouchMove={gesture.handleTouchMove}
      onTouchEnd={gesture.handleTouchEnd}
    > 
      {!isMinimized && buttons.map((op) => (
        <button 
          key={op.id} 
          className="w-20 h-16 border border-white/30 ml-3 rounded-2xl"
          style={{
            opacity: isMinimized ? 0 : 1,
            visibility: isMinimized ? 'hidden' : 'visible',
            transition: 'opacity 300ms ease-in-out, visibility 300ms ease-in-out'
          }}
        />
      ))}
      
      <div 
        className="w-12 h-12 rounded-full absolute border-4 border-white/50 cursor-move"
        style={{
          left: isMinimized ? '50%' : '101%',
          top: isMinimized ? '50%' : '-32px',
          transform: isMinimized ? 'translate(-50%, -50%)' : 'translate(0, 0)',
          transition: 'left 300ms ease-in-out, top 300ms ease-in-out',
        }}
        onClick={handleBallClick}
        onMouseDown={(e) => {
          e.stopPropagation();
          gesture.handleMouseDown(e);
        }}
        onTouchStart={(e) => {
          e.stopPropagation();
          gesture.handleMouseDown(e as any);
        }}
        onTouchMove={(e) => {
          e.stopPropagation();
          gesture.handleTouchMove(e);
        }}
        onTouchEnd={(e) => {
          e.stopPropagation();
          gesture.handleTouchEnd();
        }}
      />
    </div>
  );
};

export default Control;