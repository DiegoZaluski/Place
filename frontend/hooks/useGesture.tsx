import { useState, useRef, useEffect } from 'react';

/**
 * useGesture - Hook for drag, pan and zoom gestures with precise boundary control
 *
 * @param config - Configuration object
 * @param config.BASE_SIZE - Base width of the element in pixels
 * @param config.ELEMENT_HEIGHT - Base height of the element in pixels (default: 112)
 * @param config.MIN_SCALE - Minimum zoom scale (default: 0.8)
 * @param config.MAX_SCALE - Maximum zoom scale (default: 1.5)
 * @param config.SCALE_STEP - Zoom step size (default: 0.05)
 * @returns Gesture controls and state
 *
 * @example
 * const { scale, position, handleMouseDown, handleWheel } = useGesture({
 *   BASE_SIZE: 500,
 *   ELEMENT_HEIGHT: 112,
 *   MIN_SCALE: 0.8,
 *   MAX_SCALE: 1.5
 * });
 */
export const useGesture = (config: {
  BASE_SIZE: number;
  ELEMENT_HEIGHT?: number;
  MIN_SCALE?: number;
  MAX_SCALE?: number;
  SCALE_STEP?: number;
}) => {
  const {
    BASE_SIZE,
    ELEMENT_HEIGHT = 112,
    MIN_SCALE = 0.8,
    MAX_SCALE = 1.5,
    SCALE_STEP = 0.05,
  } = config;

  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);

  const dragStartPos = useRef({ x: 0, y: 0 });
  const pinchStart = useRef(0);
  const originalBodyOverflow = useRef('');

  const calculateBoundaries = (currentScale: number) => {
    const elementWidth = BASE_SIZE * currentScale;
    const elementHeight = ELEMENT_HEIGHT * currentScale;

    const maxX = Math.max(0, window.innerWidth - elementWidth);
    const maxY = Math.max(0, window.innerHeight - elementHeight);
    const minX = 0;
    const minY = 0;

    return { minX, maxX, minY, maxY, elementWidth, elementHeight };
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      e.preventDefault();

      const { minX, maxX, minY, maxY } = calculateBoundaries(scale);

      const newX = e.clientX - dragStartPos.current.x;
      const newY = e.clientY - dragStartPos.current.y;

      const clampedX = Math.max(minX, Math.min(newX, maxX));
      const clampedY = Math.max(minY, Math.min(newY, maxY));

      setPosition({ x: clampedX, y: clampedY });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      document.body.style.overflow = originalBodyOverflow.current;
    };

    originalBodyOverflow.current = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.body.style.userSelect = 'none';

    window.addEventListener('mousemove', handleMouseMove, { passive: false });
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      document.body.style.overflow = originalBodyOverflow.current;
      document.body.style.userSelect = '';
    };
  }, [isDragging, scale, BASE_SIZE, ELEMENT_HEIGHT]);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    dragStartPos.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    };
  };

  const handleWheel = (
    e: React.WheelEvent<HTMLDivElement>,
    containerRef: React.RefObject<HTMLDivElement>,
  ) => {
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const inside =
      e.clientX >= rect.left &&
      e.clientX <= rect.right &&
      e.clientY >= rect.top &&
      e.clientY <= rect.bottom;

    if (!inside) return;

    e.preventDefault();

    setScale((prev) => {
      const delta = e.deltaY > 0 ? -SCALE_STEP : SCALE_STEP;
      const newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, prev + delta));

      const { minX, maxX, minY, maxY } = calculateBoundaries(newScale);

      setPosition((pos) => ({
        x: Math.max(minX, Math.min(pos.x, maxX)),
        y: Math.max(minY, Math.min(pos.y, maxY)),
      }));

      return newScale;
    });
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    e.preventDefault();

    if (e.touches.length !== 2) return;

    const touch1 = e.touches[0];
    const touch2 = e.touches[1];
    const distance = Math.hypot(touch2.clientX - touch1.clientX, touch2.clientY - touch1.clientY);

    if (pinchStart.current === 0) {
      pinchStart.current = distance;
    } else {
      const diff = distance - pinchStart.current;
      if (Math.abs(diff) < 5) return;

      const delta = diff > 0 ? SCALE_STEP * 0.4 : -SCALE_STEP * 0.4;
      const newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, scale + delta));

      const { minX, maxX, minY, maxY } = calculateBoundaries(newScale);

      setScale(newScale);
      setPosition((pos) => ({
        x: Math.max(minX, Math.min(pos.x, maxX)),
        y: Math.max(minY, Math.min(pos.y, maxY)),
      }));

      pinchStart.current = distance;
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    dragStartPos.current = { x: 0, y: 0 };
    pinchStart.current = 0;
  };

  return {
    scale,
    position,
    isDragging,
    handleMouseDown,
    handleWheel,
    handleTouchMove,
    handleTouchEnd,
  };
};
