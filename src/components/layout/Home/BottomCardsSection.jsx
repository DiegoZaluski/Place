import React from 'react';
import { modelCardsDetails } from '../../../global/data';
import BottomCard from './BottomCard';

function BottomCardsSection() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 w-full max-w-7xl mt-10">
      {modelCardsDetails.map((item, index) => (
        <BottomCard key={`bottom-card-${index + 5}`} item={item} index={index} />
      ))}
    </div>
  );
}

export default BottomCardsSection;
