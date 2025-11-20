import React from 'react';
import Header from './Header';
import TopCardsModel from './TopCardsModel.tsx';
import BottomCardsSection from './BottomCardsSection';

const styles = {
  // add: styles here
}

function Home() {
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