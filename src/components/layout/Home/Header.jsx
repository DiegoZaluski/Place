import React, { useContext } from 'react';
import { AppContext } from '../../../global/AppProvider';
import { useRef } from 'react';
import HeaderTabs from './HeaderTabs';
import StatusBox from './StatusBox';
import ButtonTheme from '../../shared/ButtonTheme';
import { MinimizeBtn, MaximizeBtn, CloseBtn, BackBtn } from '../../shared/WindowsComponents';
import ButtonI18n from '../../shared/ButtonI18n';
import logo from '../../../../public/images/logo.png';

function Header() {
   const appContext = useContext(AppContext);
   
   if (!appContext) {
     throw new Error('Header deve ser usado dentro do AppProvider');
   }
   
   const { isDark } = appContext;
  return (
    <header className="w-full h-20 px-8 bg-p-50 dark-bg-primary shadow-2xl sticky top-0 z-10 transition-colors duration-200">
      <div className="h-full grid grid-cols-3 items-center">
        {/* 1. Left Section: Tabs */}
        <HeaderTabs/>
        <div className="justify-self-center flex items-center space-x-2 flex-row"> 
            <img src={logo} className="w-16 h-16" alt="logoPlace" />
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
