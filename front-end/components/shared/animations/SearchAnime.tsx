import React from 'react';
import { Search } from 'lucide-react';

interface SearchAnimeProps {
  color?: string;
  backgroundColor?: string;
}
const SearchAnime: React.FC<SearchAnimeProps> = ({ 
  color = 'black', 
  backgroundColor = 'transparent' 
}) => {
  const ANIMATION_SPEED = 15;
  return (
    <div 
      className="relative rounded-lg w-full h-[200px] p-4"
      style={{ backgroundColor }}
    >
      <div
        className="absolute"
        style={{
          animation: `readingMotion ${ANIMATION_SPEED}s cubic-bezier(0.4, 0, 0.2, 1) infinite`,
          left: 0,
          transformOrigin: 'center center',
        }}
      >
        <div style={{ color }}>
          <Search size={40} strokeWidth={2.5} />
        </div>
      </div>
      <style>{`
      @keyframes readingMotion {
        0%,100% { top: 24px; left: 0; opacity: 1; transform: rotate(15deg) scale(1); }
        6% { left: 30%; transform: rotate(15deg) scale(1.3); }
        7% { transform: rotate(15deg) scale(1); }
        8%,11% { left: calc(100% - 40px); }
        11.1% { opacity: 0.8; transform: rotate(10deg); }
        11.5% { top: 44px; opacity: 0.6; transform: rotate(0deg); }
        12% { top: 64px; opacity: 0.8; transform: rotate(-10deg); }
        12.5%,18% { opacity: 1; transform: rotate(-15deg); }
        18% { left: 60%; transform: rotate(-15deg) scale(1.4); }
        19% { transform: rotate(-15deg) scale(1); }
        20%,23% { left: 0; }
        23.1% { opacity: 0.8; transform: rotate(-10deg); }
        23.5% { top: 84px; opacity: 0.6; transform: rotate(0deg); }
        24% { top: 104px; opacity: 0.8; transform: rotate(10deg); }
        24.5%,30% { opacity: 1; transform: rotate(15deg); }
        30% { left: 45%; transform: rotate(15deg) scale(1.3); }
        31% { transform: rotate(15deg) scale(1); }
        32%,35% { left: calc(100% - 40px); }
        35.1% { opacity: 0.8; transform: rotate(10deg); }
        35.5% { top: 124px; opacity: 0.6; transform: rotate(0deg); }
        36% { top: 144px; opacity: 0.8; transform: rotate(-10deg); }
        36.5%,42% { opacity: 1; transform: rotate(-15deg); }
        42% { left: 70%; transform: rotate(-15deg) scale(1.4); }
        43% { transform: rotate(-15deg) scale(1); }
        44%,47% { left: 0; }
        47% { transform: rotate(-15deg) scale(1.3); }
        48% { transform: rotate(-15deg) scale(1); }
        50% { left: calc(100% - 40px); }
        50.1% { opacity: 0.8; transform: rotate(-10deg); }
        50.5% { top: 124px; opacity: 0.6; transform: rotate(0deg); }
        51% { top: 104px; opacity: 0.8; transform: rotate(10deg); }
        52%,55% { opacity: 1; transform: rotate(15deg); }
        55% { left: 55%; transform: rotate(15deg) scale(1.4); }
        56% { transform: rotate(15deg) scale(1); }
        58% { left: 0; }
        58.1% { opacity: 0.8; transform: rotate(10deg); }
        58.5% { top: 84px; opacity: 0.6; transform: rotate(0deg); }
        59% { top: 64px; opacity: 0.8; transform: rotate(-10deg); }
        60%,63% { opacity: 1; transform: rotate(-15deg); }
        63% { left: 40%; transform: rotate(-15deg) scale(1.3); }
        64% { transform: rotate(-15deg) scale(1); }
        66% { left: calc(100% - 40px); }
        66.1% { opacity: 0.8; transform: rotate(-10deg); }
        66.5% { top: 44px; opacity: 0.6; transform: rotate(0deg); }
        67% { top: 24px; opacity: 0.8; transform: rotate(10deg); }
        68%,71% { opacity: 1; transform: rotate(15deg); }
        71% { left: 20%; transform: rotate(15deg) scale(1.5); }
        72% { transform: rotate(15deg) scale(1); }
        74%,80% { left: 0; }
        80% { left: 30%; transform: rotate(15deg) scale(1.3); }
      }
      `}</style>
    </div>
  );
};
export default SearchAnime;