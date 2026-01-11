import { useState, useEffect, useRef, useCallback } from 'react';
import { SiHuggingface as Hf} from 'react-icons/si';
import Chat from '@/components/layout/chat/Chat';
import { HandGrab } from 'lucide-react' ;

// SIZE CONSTANTS
const MIN_HEIGHT = 300;
const MAX_HEIGHT = 800;
const MIN_WIDTH = 188;
const MAX_WIDTH = 500;

// CONTROL COMPONENT
const Control = () => {
  const [isMinimized, setIsMinimized] = useState(false);
  const api = (window as any).api;
  const containerRef = useRef<HTMLDivElement>(null);
  const [chat, setChat] = useState<boolean>(false);

  // DIMENSION STATE
  const [size, setSize] = useState({
    height: MAX_HEIGHT,
    width: MAX_WIDTH,
  });

  // DRAGGING REFERENCES
  const isDragging = useRef(false);
  const dragStartX = useRef(0);
  const dragStartY = useRef(0);
  const startSize = useRef({ height: MAX_HEIGHT, width: MAX_WIDTH });
  const dragSensitivity = useRef(0.5);

  const buttons = [
    { id: 1, action: 'chat' },
    { id: 2, action: 'maximize' },
    { id: 3, action: 'model' },
  ];

  const roundedDecoration = [1, 2, 3];

  const handleBallClick = () => {
    setChat(false);
    setIsMinimized(!isMinimized);
  };

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();

      if (!isMinimized && containerRef.current) {
        const target = e.target as HTMLElement;
        const isControlButton = target.closest('.window-control-button');
        const isBallButton = target.closest('.cursor-move');

        if (!isControlButton && !isBallButton) {
          isDragging.current = true;
          dragStartX.current = e.clientX;
          dragStartY.current = e.clientY;
          startSize.current = { ...size };

          document.addEventListener('mousemove', handleMouseMove);
          document.addEventListener('mouseup', handleMouseUp);

          containerRef.current.style.cursor = 'grabbing';
          document.body.style.userSelect = 'none';
        }
      }
    },
    [isMinimized, size],
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging.current) return;

      const deltaX = e.clientX - dragStartX.current;
      const deltaY = e.clientY - dragStartY.current;

      let newHeight = startSize.current.height;
      let newWidth = startSize.current.width;

      // HEIGHT CALCULATION
      if (deltaY !== 0) {
        newHeight = Math.max(
          MIN_HEIGHT,
          Math.min(MAX_HEIGHT, startSize.current.height + deltaY * dragSensitivity.current),
        );
      }

      // WIDTH CALCULATION
      if (deltaX !== 0) {
        newWidth = Math.max(
          MIN_WIDTH,
          Math.min(MAX_WIDTH, startSize.current.width - deltaX * dragSensitivity.current),
        );
      }

      if (newHeight !== size.height || newWidth !== size.width) {
        setSize({ height: newHeight, width: newWidth });
      }
    },
    [size],
  );

  const handleMouseUp = useCallback(() => {
    if (isDragging.current) {
      isDragging.current = false;
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);

      if (containerRef.current) {
        containerRef.current.style.cursor = '';
      }
      document.body.style.userSelect = '';
    }
  }, []);

  // CLEANUP EFFECT
  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = '';
    };
  }, []);

  // RESIZE OBSERVER EFFECT
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
  }, [isMinimized, api, size]);

  const calculateProportionalSizes = () => { // PROPORTIONAL SIZE CALCULATION
    const widthRatio = size.width / MAX_WIDTH;
    const heightRatio = size.height / MAX_HEIGHT;
    const controlBarWidth = Math.max(200, Math.min(440, size.width * 0.88));
    const buttonWidth = Math.max(40, Math.min(56, 56 * widthRatio));
    const buttonHeight = Math.max(32, Math.min(48, 48 * widthRatio));
    const buttonMargin = Math.max(8, Math.min(12, 12 * widthRatio));
    const decorationSize = Math.max(20, Math.min(32, 32 * widthRatio));
    const controlBarHeight = Math.max(56, Math.min(70, 70 * heightRatio));
    const ballSize = Math.max(40, Math.min(48, 48 * widthRatio));
    const ballIconSize = Math.max(20, Math.min(24, 24 * widthRatio));
    const buttonTranslateX = Math.max(90, Math.min(112, 112 * widthRatio));

    return {
      controlBarWidth,
      buttonWidth,
      buttonHeight,
      buttonMargin,
      decorationSize,
      controlBarHeight,
      ballSize,
      ballIconSize,
      buttonTranslateX,
    };
  };

  const proportionalSizes = calculateProportionalSizes();

  return (
    <div
      ref={containerRef}
      className="rounded-xl "
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
        transition: isDragging.current ? 'none' : 'all 300ms ease-in-out',
        height: isMinimized ? '65px' : chat ? `${size.height}px` : 'auto',
        width: isMinimized ? '90px' : `${size.width}px`,
      }}
      onMouseDown={handleMouseDown}
    >
      {/* CONTROL BAR SECTION */}
      <div
        className={`
          flex 
          flex-row 
          items-center 
          border-2 
          border-black/5
          drag-handle 
          bg-white/5`}
        style={{
          width: isMinimized ? '0px' : `${proportionalSizes.controlBarWidth}px`,
          height: `${proportionalSizes.controlBarHeight}px`,
          borderRadius: isMinimized ? '50%' : '0.75rem',
          transition:
            `width 
            300ms 
            ease-in-out, 
            border-radius 
            300ms ease-in-out, 
            opacity 300ms 
            ease-in-out`,
          boxSizing: 'border-box',
          padding: 0,
          margin: 0,
          overflow: 'hidden',
          opacity: isMinimized ? 0 : 1,
          background: '',
        }}
      >
        {/* DECORATION CIRCLES */}
        {!isMinimized &&
          roundedDecoration.map((rd) => (
            <div
              key={rd}
              className={`rounded-full ml-1 ${rd === 1 ? 'bg-red-500' : rd === 2 ? 'bg-yellow-500' : rd === 3 && 'bg-green-500'}`}
              style={{
                width: `${proportionalSizes.decorationSize}px`,
                height: `${proportionalSizes.decorationSize}px`,
                marginLeft: `${proportionalSizes.buttonMargin / 2}px`,
                transition: 'all 300ms ease-in-out',
              }}
            ></div>
          ))}

        {/* CONTROL BUTTONS */}
        {!isMinimized &&
          buttons.map((op) => (
            <button
              key={op.id}
              className={`
                no-drag-handle 
                rounded-full 
                flex-shrink-0 
                flex items-center 
                justify-center 
                bg-white/5 
                hover:bg-white/75`}
              style={{
                width: `${proportionalSizes.buttonWidth}px`,
                height: `${proportionalSizes.buttonHeight}px`,
                marginLeft: `${proportionalSizes.buttonMargin}px`,
                transform: `translateX(${proportionalSizes.buttonTranslateX}px)`,
                transition: 'all 300ms ease-in-out',
              }}
              onClick={() => op.id === 1 && setChat((prev) => !prev)}
              title={op.action.charAt(0).toUpperCase() + op.action.slice(1)}
            ></button>
          ))}
      </div>
      {/* MINIMIZED BALL */}
      {isMinimized && (
        <div className={`
          w-8 h-8 
          rounded-full 
          drag-handle 
          flex 
          items-center
          justify-center 
          text-yellow-500/30
          `} > <HandGrab size={25}/> </div>
      )}

      <div
        className={`
          rounded-full
          bg-black/30
          flex items-center
          justify-center 
          cursor-move 
          flex-shrink-0 
          translate-x-1 z-10`}
        style={{
          width: `${proportionalSizes.ballSize}px`,
          height: `${proportionalSizes.ballSize}px`,
          transition: 'all 300ms ease-in-out',
          display: '',
        }}
        onClick={handleBallClick}
      >
        <Hf size={33} className='text-yellow-500/50'/>

      </div>
      {chat && (
        <div
          style={{
            order: '1',
            height: `${size.height - proportionalSizes.controlBarHeight}px`,
            width: '100%',
          }}
          className="flex-wrap"
        >
          <Chat newWindow={true} adaptable={false}></Chat>
        </div>
      )}
    </div>
  );
};
export default Control;
