import React, { useState } from 'react';
import Header from './Header';
import TopCardsModel from './TopCardsModel.tsx';
import BottomCardsSection from './BottomCardsSection';
import Chat from '../Chat/Chat.tsx';
import { Bot } from 'lucide-react'

const styles = {
  // add: styles here
}

function Home() {
  const [ShowChat, setShowChat]= useState(false);
  return (
    <div className={`
      min-h-screen
      bg-p-50
      dark-bg-primary
      font-sans
      transition-colors
      duration-200`}>
      <Header />
      <main className={`
      container
      mx-auto
      p-10
      flex
      flex-col
      items-center`}>
      <TopCardsModel />
      <div className={`
      local
      fixed 
      left-1 
      top-[50%] 
      translate-y-[-50%] 
      w-[17rem] 
      h-[77vh]`}
        style={{backgroundAttachment: 'fixed'}}
      >
      <button 
        onClick={() => ShowChat ? setShowChat(false) : setShowChat(true)} 
        className={`
          w-8
          h-8 
          rounded-full 
          bg-pur-400 
          bg-pur-500 
          hover:bg-pur-600
          flex 
          items-center 
          justify-center 
          transition-all 
          duration-200
          transform 
          hover:scale-110 
          active:scale-95
          shadow-md 
          hover:shadow-lg 
          relative 
          overflow-hidden
        `}
      >
        <span className="absolute inset-0 bg-white opacity-0 active:opacity-30 transition-opacity duration-150 rounded-full"></span>
        
        <Bot className={`w-6 h-6 text-white transition-transform duration-300 ${ShowChat ? 'rotate-12' : ''}`} />
      </button>

        {ShowChat && <Chat adaptable={true}/>}

      </div>
      <h1 className={`
      text-2xl
      font-bold
      mb-4
      dark-text-primary
      font-playfair
      ${styles.translate}
      `}>Download Models</h1>
      <BottomCardsSection />
    </main>
  </div>
  );
}

export default Home;