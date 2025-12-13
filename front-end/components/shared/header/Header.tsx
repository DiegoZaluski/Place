import { useContext } from 'react';
import { AppContext } from '../../../global/AppProvider';
import HeaderTabs from './HeaderTabs';
import StatusBox from './StatusBox';
import ButtonTheme from '../buttons/ButtonTheme';
import { MinimizeBtn, MaximizeBtn, CloseBtn, BackBtn } from '../buttons/CtrlWindow';
import ButtonI18n from '../buttons/ButtonI18n';
import logo from '../../../../public/images/logo.png';

interface headerProps { home?: boolean }

function Header({ home = true }: headerProps) {
  const appContext = useContext(AppContext);
  if (!appContext) throw new Error('The header should be used within the AppProvider');
  const { isDark } = appContext;

  return (
    <header className={`
      w-full h-20 px-8 bg-p-50 dark-bg-primary shadow-2xl
      sticky top-0 z-50 transition-colors duration-200 drag-handle`}>

      <div className="h-full grid grid-cols-3 items-center">

        {home ? <HeaderTabs /> : 
        <div className='
          justify-self-start ml-4 transform translate-x-8 
          flex items-center space-x-4'><BackBtn whiteFixed={true} /></div>}
        {home ? 
        <div 
        className="justify-self-center flex items-center 
        space-x-2 flex-row"><img src={logo} className="w-full h-16" alt="logoPlace" /></div>
          : 
        <div className='justify-self-center flex items-center space-x-2 flex-row w-full h-16'></div>}

        <div className="justify-self-end mr-4">
          <div className="flex items-center space-x-4">
            <StatusBox />
            <ButtonI18n className='text-n-900 dark-text-primary' />
            <ButtonTheme className='p-6' />
            <MinimizeBtn whiteFixed={isDark} />
            <MaximizeBtn whiteFixed={isDark} />
            <CloseBtn whiteFixed={isDark} />
          </div>
        </div>

      </div>
    </header>
  );
}

export default Header;
