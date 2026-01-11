import { useTranslation } from 'react-i18next';

const STYLES = {
  container: 'justify-self-start ml-4 transform translate-x-8',
  wrapper: 'p-3 rounded-xl bg-2 shadow-inner min-h-[4rem] flex items-center',
  tabsContainer: 'flex space-x-3',
  tab: 'min-w-[7rem] px-3 py-3 rounded-xl bg-color  transition-all duration-200 hover:bg-n-900 hover:dark-text-primary hover:scale-105 active:scale-95 cursor-pointer shadow-lg flex flex-col items-center justify-center',
  text: 'text-n-900 dark-text-primary font-semibold tracking-tighter text-center leading-none whitespace-nowrap font-thin',
};
interface HC {
  Config: string;
  Doc: string;
  Contributions: string;
}

type ArrHC = Array<HC[keyof HC]>;

function HeaderTabs() {
  const { t } = useTranslation('common');
  const headerTabsContent = t('headerTabsContent', { returnObjects: true }) as ArrHC;
  return (
    <nav className={STYLES.container} aria-label="Navegação principal">
      <div className={STYLES.wrapper}>
        <div className={STYLES.tabsContainer}>
          {headerTabsContent.map((name, index) => (
            <button
              key={`tab-${index}-${name.toLowerCase().replace(/\s+/g, '-')}`}
              className={`${STYLES.tab} no-drag-handle`}
              aria-label={`Acessar ${name}`}
            >
              {name.split(' ').map((word, i) => (
                <span
                  key={`${word}-${i}`}
                  className={STYLES.text}
                  style={{
                    fontSize: '0.9rem',
                    lineHeight: '1.1rem',
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
