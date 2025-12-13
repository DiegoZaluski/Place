import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";

interface Language {
  id: string;
}

const ButtonI18n = ({className}: {className?: string}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false); 
  const [language, setLanguage] = useState<string>('en'); 
  
  const { i18n } = useTranslation();

  const languages: Language[] = [
    { id: 'ar' }, { id: 'de' }, { id: 'en' }, { id: 'es' },
    { id: 'fr' }, { id: 'it' }, { id: 'ja' }, { id: 'ko' },
    { id: 'pt' }, { id: 'ru' }, { id: 'zh' },
  ];

  useEffect(() => {    
    switch (language) {
      case 'ar': i18n.changeLanguage('ar'); break;
      case 'de': i18n.changeLanguage('de'); break;
      case 'en': i18n.changeLanguage('en'); break;
      case 'es': i18n.changeLanguage('es'); break;
      case 'fr': i18n.changeLanguage('fr'); break;
      case 'it': i18n.changeLanguage('it'); break;
      case 'ja': i18n.changeLanguage('ja'); break;
      case 'ko': i18n.changeLanguage('ko'); break;
      case 'pt': i18n.changeLanguage('pt'); break;
      case 'ru': i18n.changeLanguage('ru'); break;
      case 'zh': i18n.changeLanguage('zh'); break;
    }    
  }, [language, i18n]); 

  return(
<div className="flex flex-col">
<button 
  onClick={() => setIsOpen(!isOpen)} 
  className={
    `
    flex
    items-center
    justify-center
    bg-none
    text-[#f0f6fc]
    text-2xl
    font-['Franklin_Gothic_Medium','Arial_Narrow',Arial,sans-serif]
    cursor-pointer
    transition-all
    duration-300
    ease-out
    opacity-30
    border
    border-[#605c4e]
    p-2.5
    rounded-full
    w-[50px]
    h-[50px]
    hover:opacity-80
    hover:outline
    hover:outline-1
    hover:outline-[#605c4e]
    decoration-none
    shadow-md
    no-drag-handle
    `
  }
  
  
  aria-label="Change language"
  title="Change language"
>
  <span className={
    `
    block
    text-[1.1em]
    font-medium
    leading-none
    -tracking-[0.5px]
    transition-transform
    duration-300
    ease-out
    hover:scale-125
    text-n-900
    ${className} 
    `
  }>
    Aあ
  </span>
</button>

  {isOpen && (
    <div className="grid fixed top-16 mt-2 z-100 translate-x-1 gap-2">
      {languages.map((l: Language) => (
        <button 
          key={l.id} 
          onClick={() => setLanguage(l.id)}
          className="
            flex
            items-center
            justify-center
            bg-none
            text-[#f0f6fc]
            text-2xl
            font-['Franklin_Gothic_Medium','Arial_Narrow',Arial,sans-serif]
            cursor-pointer
            transition-all
            duration-200
            ease-in-out
            opacity-30
            border
            border-[#605c4e]
            p-2.5
            rounded-xl
            w-[45px]
            h-[45px]
            hover:outline
            hover:outline-1
            hover:outline-[#605c4e]
            decoration-none
            shadow-md
            color-black 
          "
        >
          {l.id.toUpperCase()}
        </button>
      ))}
    </div>
  )}
</div>
  );
};

export default ButtonI18n;