import React from 'react';
import HeaderTabs from './HeaderTabs';
import StatusBox from './StatusBox';
import LogoBox from '../../shared/LogoBox';
import ButtonTheme from '../../shared/ButtonTheme';
import { MinimizeBtn, MaximizeBtn, CloseBtn, BackBtn } from '../../shared/WindowsComponents';

function Header() {
  return (
    <header className="w-full h-20 border-b border-white/20 px-8 bg-black shadow-2xl sticky top-0 z-10">
      <div className="h-full grid grid-cols-3 items-center">
        <BackBtn/>
        {/* 1. Seção Esquerda: Tabs */}
        <HeaderTabs />

        {/* Seção Central Vazia */}
        <div className="justify-self-center flex items-center space-x-2 flex-row font-playfair"> 
            <LogoBox size={30}/>
            <h1 className='text-2xl font-bold text-white'>Place</h1>
        </div>

        {/* Seção Direita: Ícones de status, notificações e perfil do usuário */}
        <div className="justify-self-end mr-4">
          <div className="flex items-center space-x-4">

            {/* Box de Status/Contador (GitHub) */}
            <StatusBox />
            {/* Avatar do Usuário */}
            <div className="w-10 h-10 rounded-full border-2 border-white/20 bg-white/10 shadow-md cursor-pointer"></div>
            <ButtonTheme className='p-6'/>
            <MinimizeBtn/>
            <MaximizeBtn/>
            <CloseBtn/>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;
