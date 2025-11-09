import React, { useContext } from 'react';
import { AppContext } from '../../../global/AppProvider';
import { useRef } from 'react';
import HeaderTabs from './HeaderTabs';
import StatusBox from './StatusBox';
import LogoBox from '../../shared/LogoBox';
import ButtonTheme from '../../shared/ButtonTheme';
import { MinimizeBtn, MaximizeBtn, CloseBtn, BackBtn } from '../../shared/WindowsComponents';
import ButtonI18n from '../../shared/ButtonI18n';

function Header() {
   const appContext = useContext(AppContext);
   
   if (!appContext) {
     throw new Error('Header deve ser usado dentro do AppProvider');
   }
   
   const { isDark } = appContext;
  return (
    <header className="w-full h-20 border-b border-n-700  px-8 bg-c-50 dark-bg-primary shadow-2xl sticky top-0 z-10 transition-colors duration-200">
      <div className="h-full grid grid-cols-3 items-center">
        <BackBtn whiteFixed={isDark}/>
        {/* 1. Left Section: Tabs */}
        <HeaderTabs/>

        {/* Central Section: Empty */}
        <div className="justify-self-center flex items-center space-x-2 flex-row font-playfair"> 
            <LogoBox size={30}/>
            <h1 className='text-2xl font-bold text-n-900 dark-text-primary '>Place</h1>
        </div>

        {/* Right Section: Status, Notifications, and User Profile */}
        <div className="justify-self-end mr-4">
          <div className="flex items-center space-x-4">

            {/* Status Box (GitHub) */}
            <StatusBox />
            {/* Avatar User */}
            <ButtonI18n className='text-n-900 dark-text-primary'/>
            <ButtonTheme className='p-6'/>
            <MinimizeBtn whiteFixed={isDark}/>
            <MaximizeBtn whiteFixed={isDark}/>
            <CloseBtn whiteFixed={isDark}/>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;
