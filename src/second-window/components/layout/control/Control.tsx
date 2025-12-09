import { useState, useEffect, useRef } from 'react';

const Control = () => {
  const [isMinimized, setIsMinimized] = useState(false);
  const api = (window as any).api;
  const containerRef = useRef<HTMLDivElement>(null);

  const buttons = [
    { id: 1, action: 'minimize' },
    { id: 2, action: 'maximize' },
    { id: 3, action: 'close' },
    { id: 4, action: 'custom' },
  ];

  const handleWindowAction = (action: string) => {
    api?.sendControlAction?.(action);
  };

  const handleBallClick = () => {
    setIsMinimized(!isMinimized);
  };

  // Send fixed size
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        api?.sendContentSize?.(Math.ceil(rect.width), Math.ceil(rect.height));
      }
    };

    // chama de início
    updateSize();

    // observa mudanças na div pai
    const resizeObserver = new ResizeObserver(updateSize);
    if (containerRef.current) resizeObserver.observe(containerRef.current);

    return () => resizeObserver.disconnect();
  }, [isMinimized, api]);

  return (
    <div
      ref={containerRef}
      className='rounded-xl'
      style={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        padding: 0,
        margin: 0,
        gap: 0,
        overflow: 'visible',
        background: 'rgba(255,0,0,0.5)',
        transition: 'all 300ms ease-in-out',
        height: isMinimized ? '55px' : '85px', 
        width: isMinimized ? '90px':'455px'
      }}
    >
      <div
        className="flex flex-row items-center border-2 border-white/30 drag-handle"
        style={{
          width: isMinimized ? '0px' : '400px',
          height: '80px',
          borderRadius: isMinimized ? '50%' : '24px',
          transition: 'width 300ms ease-in-out, border-radius 300ms ease-in-out, opacity 300ms ease-in-out',
          boxSizing: 'border-box',
          padding: 0,
          margin: 0,
          overflow: 'hidden',
          opacity: isMinimized ? 0 : 1,
          background: 'rgba(0,255,0,0.5)',
        }}
      >
        {!isMinimized && buttons.map((op) => (
          <button
            key={op.id}
            className="window-control-button w-20 h-16 border border-white/30 ml-3 rounded-2xl flex-shrink-0"
            onClick={() => handleWindowAction(op.action)}
            title={op.action.charAt(0).toUpperCase() + op.action.slice(1)}
          />
        ))}
      </div>

      {isMinimized && (
        <div
          className="w-8 h-8 rounded-full border-2 border-white/40 drag-handle flex-shrink-0"
          style={{ background: 'rgba(0,0,255,0.5)' }}
        />
      )}

      <div
        className="w-12 h-12 rounded-full border-4 border-white/50 cursor-move flex-shrink-0 translate-x-1"
        style={{ background: 'rgba(255,255,0,0.5)' }}
        onClick={handleBallClick}
      />
    </div>
  );
};

export default Control;
