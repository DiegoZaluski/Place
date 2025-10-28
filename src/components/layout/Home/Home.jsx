import React from 'react';
import Header from './Header';
import TopCardsSection from './TopCardsSection';
import BottomCardsSection from './BottomCardsSection';

function Home() {
  return (
    <div className="min-h-screen bg-color font-sans" data-theme-aware>
      <Header />
      <main className="container mx-auto p-10 flex flex-col items-center">
        <TopCardsSection />
        <div className="w-11/12 h-1 bg-white/10 my-8 rounded-full"></div>
        <BottomCardsSection />
      </main>
    </div>
  );
}

export default Home;