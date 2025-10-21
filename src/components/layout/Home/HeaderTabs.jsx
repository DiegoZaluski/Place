import React from 'react';
import { headerTabsContent } from './data';

// Constantes otimizadas
const STYLES = {
  container: "justify-self-start ml-4",
  wrapper: "p-3 rounded-xl bg-[#605C4E] shadow-inner min-h-[4rem] flex items-center", // Altura mínima e flex para centralizar
  tabsContainer: "flex space-x-3",
  tab: "min-w-[7rem] px-3 py-3 rounded-xl bg-black border border-white/30 transition-all duration-200 hover:bg-[#1A1A1A] hover:scale-105 active:scale-95 cursor-pointer shadow-lg flex flex-col items-center justify-center", // Padding em vez de altura fixa
  text: "text-white font-semibold tracking-tighter text-center leading-none whitespace-nowrap font-playfair color-[#605C4E]" // Evita quebra de linha
};

function HeaderTabs() {
  return (
    <nav className={STYLES.container} aria-label="Navegação principal">
      <div className={STYLES.wrapper}>
        <div className={STYLES.tabsContainer}>
          {headerTabsContent.map((name, index) => (
            <button
              key={`tab-${index}-${name.toLowerCase().replace(/\s+/g, '-')}`}
              className={STYLES.tab}
              aria-label={`Acessar ${name}`}
            >
              {name.split(' ').map((word, i) => (
                <span
                  key={`${word}-${i}`}
                  className={STYLES.text}
                  style={{ 
                    fontSize: '0.9rem',
                    lineHeight: '1.1rem'
                  }}
                >
                  {word}
                </span>
              ))}
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
}

export default HeaderTabs;
