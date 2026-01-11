import React, { useState, useRef, useEffect } from 'react';
import Header from '../../shared/header/Header.js';
import TopCardsModel from './TopCardsModel.tsx';
import { useTranslation } from 'react-i18next';
import Chat from '../chat/Chat.tsx';
import SearchBar from '../../shared/search/SearchBar.tsx';
import SearchController from '../../shared/search/SearchController.tsx';
import { modelCardsDetails } from '../../../global/data.js';
import BottomCard from './BottomCard.tsx';
import { SiHuggingface as Huggingface } from 'react-icons/si';


function Home() {
  const [searchQuery, setSearchQuery] = useState('');  
  const [widthPercent, setWidthPercent] = useState(20);
  const draggingRef = useRef(false);
  const pointerIdRef = useRef<number | null>(null);
  const startXRef = useRef(0);
  const startWidthRef = useRef(20);
  const { t } = useTranslation('common');

  const onPointerDown = (e: React.PointerEvent) => {
    const clientX = e.clientX;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch { null; }
    pointerIdRef.current = e.pointerId;
    draggingRef.current = true;
    startXRef.current = clientX;
    startWidthRef.current = widthPercent;
    document.body.style.userSelect = 'none';
    document.body.style.touchAction = 'none';
  };

  useEffect(() => {
    const onPointerMove = (ev: PointerEvent) => {
      if (!draggingRef.current) return;
      if (pointerIdRef.current != null && ev.pointerId !== pointerIdRef.current) return;
      const clientX = ev.clientX;
      const screenWidth = window.innerWidth;
      const deltaPx = clientX - startXRef.current;
      const deltaPercent = (deltaPx / screenWidth) * 100;
      const next = startWidthRef.current + deltaPercent;
      const clamped = Math.max(5, Math.min(40, next));
      setWidthPercent((prev) => {
        if (Math.abs(prev - clamped) < 0.01) return prev;
        return clamped;
      });
    };

    const onPointerUp = (ev: PointerEvent) => {
      if (!draggingRef.current) return;
      if (pointerIdRef.current != null && ev.pointerId !== pointerIdRef.current) return;
      draggingRef.current = false;
      pointerIdRef.current = null;
      document.body.style.userSelect = '';
      document.body.style.touchAction = '';
    };

    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);

    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
    };
  }, []);

  const isCollapsed = widthPercent <= 10;
  return (
    <div
      className={`
        min-h-screen
        bg-p-50
        dark-bg-primary
        font-sans
        transition-colors
        duration-200
        grid
        grid-rows-[auto_1fr]
        grid-cols-[20%_1fr]
        scrollbar-hide
        overflow-hidden
        z-50`}
      style={{ gridTemplateColumns: `${widthPercent}% 1fr` }}
    >
      <header
        className={`
          col-span-2
          fixed
          top-0
          left-0
          right-0
          h-16
          z-20
        `}
      >
        <Header isHome={true} />
      </header>
      <section
        className={`
          row-start-2
          row-end-3
          col-start-1
          col-end-2
          translate-y-4
          -translate-x-0
          fixed
          top-16
          left-0
          bottom-0
          z-50
        `}
        style={{ width: `${widthPercent}%`, height: 'calc(100vh - 5rem)', overflow: 'hidden' }}
      >
        {isCollapsed ? (
          <div className="bg-chat w-full h-full"></div>
        ) : (
          <div className={'w-full h-full overflow-auto'}>
            <Chat adaptable={true} />
          </div>
        )}

        <span
          onPointerDown={onPointerDown}
          className={`
            absolute
            right-0
            top-1/2
            translate-y-[-50%]
            translate-x-[50%]
            w-1
            h-full
            flex
            cursor-ew-resize
            z-10
            bg-black 
          `}
        ></span>
      </section>

      <main
        className={`
          container
          mx-auto
          p-10
          flex
          flex-col
          items-center
          row-start-2
          row-end-3
          col-start-2
          col-end-3
          w-full
          max-w-none
          mt-16
          -translate-x-10`}
      >
        <TopCardsModel />
        <div
          className={`
            local
            fixed 
            left-1 
            top-[50%] 
            translate-y-[-50%] 
            w-[17rem] 
            h-[77vh]
          `}
          style={{ backgroundAttachment: 'fixed' }}
        ></div>
        <SearchBar
          onSearchChange={(query) => setSearchQuery(query)}
          placeholder={t('search', { returnObjects: false })}
          className={`
            mb-4 mt-6 
            shadow 
            rounded-xl
            `}
        />

        <SearchController
          items={modelCardsDetails}
          searchKeys={[
            'modelName', 
            'memoryUsage', 
            'intelligenceLevel', 
            'fullModelName'
          ]}
          threshold={0.05}
          searchQuery={searchQuery}
        >
          {({ filteredItems }) => (
            <div className={`
              grid 
              grid-cols-1 
              md:grid-cols-2 
              lg:grid-cols-5 
              gap-8 
              w-full 
              max-w-7xl 
              mt-10
            `}>
              {filteredItems.map((item, index) => (
                <BottomCard 
                  key={index} 
                  item={item} 
                  index={index} 
                  icon={
                    <Huggingface 
                      key={'huggingface'} 
                      className="text-yellow-600" 
                      size={24} />
                  } />
              ))}
            </div>
          )}
        </SearchController>
      </main>
    </div>
  );
}
export default Home;
