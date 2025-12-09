import { useState, useEffect, useRef } from 'react';
import Chat from '@/components/layout/Chat/Chat'
const Control = () => {
  const [isMinimized, setIsMinimized] = useState(false);
  const api = (window as any).api;
  const containerRef = useRef<HTMLDivElement>(null);
  const [chat, setChat] = useState<boolean>(false); 

  const buttons = [
    { id: 1, action: '!setChat' },
    { id: 2, action: 'maximize' },
    { id: 3, action: 'close'},
  ];

  const roundedDecoration = [1,2,3]


  const handleBallClick = () => {
    setChat(!setChat)
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

    updateSize();

    const resizeObserver = new ResizeObserver(updateSize);
    if (containerRef.current) resizeObserver.observe(containerRef.current);

    return () => resizeObserver.disconnect();
  }, [isMinimized, api]);
  // Values ​​sent to the backend for dynamic redirection. 75px w 355px
  return (
    <div
      ref={containerRef}
      className='rounded-xl'
      style={{
        display: 'flex',
        flexDirection: 'row',
        flexWrap: 'wrap',
        alignItems: 'start',
        alignContent: 'start',
        padding: 0,
        margin: 0,
        gap: 0,   
        overflow: 'visible',
        transition: 'all 300ms ease-in-out',
        height: isMinimized ? '55px' : chat ? '800px':' auto', 
        width: isMinimized ? '90px':'500px'
      }}
    >
      <div
        className={`flex flex-row items-center border-2 border-black/5 drag-handle bg-white/30`}
        style={{
          width: isMinimized ? '0px' : '440px',
          height: '70px',
          borderRadius: isMinimized ? '50%' : '0.75rem',
          transition: 'width 300ms ease-in-out, border-radius 300ms ease-in-out, opacity 300ms ease-in-out',
          boxSizing: 'border-box',
          padding: 0,
          margin: 0,
          overflow: 'hidden',
          opacity: isMinimized ? 0 : 1,
          background: '',
        }}
      >
        {!isMinimized && roundedDecoration.map((rd) => (
          <div className={`w-8 h-8 rounded-full ml-1 ${rd === 1 ? 'bg-red-500': rd === 2 ? 'bg-yellow-500': rd === 3 && 'bg-green-500'}`}></div>
        ))}

        {!isMinimized && buttons.map((op) => (
          <button
            key={op.id}
            className="window-control-button w-14 h-12 border border-white/30 ml-3 rounded-2xl flex-shrink-0 bg-white/50 translate-x-28"
            onClick={() => op.id === 1 && setChat(prev => !prev)}
            title={op.action.charAt(0).toUpperCase() + op.action.slice(1)}
          />
        ))}
      </div>

      {isMinimized && (
        <div
          className="w-8 h-8 rounded-full border-2 border-white/40 drag-handle flex-shrink-0 bg-black/30"
        />
      )}

      <div
        className={`
        w-12 h-12 rounded-full border-4 border-white/50
        cursor-move flex-shrink-0 translate-x-1 bg-black/30`}
        onClick={handleBallClick}
      />
      { chat && <div        
        style={{ 
          order: '1'
          }} 
        className='flex-wrap h-[730px] w-full'><Chat newWindow={true} adaptable={false}></Chat></div>}
      </div>
   
  );
};

export default Control;
