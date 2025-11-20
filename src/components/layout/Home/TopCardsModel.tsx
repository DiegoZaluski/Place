import React from 'react';
import { topCardsDetails } from '../../../global/data';
import TopCard from './TopCard';

function TopCardsModel() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-16 w-full max-w-7xl mb-10">
      {topCardsDetails.map((item, index) => (
        <TopCard key={`top-card-${index}`} item={item} index={index} />
      ))}
    </div>
  );
}

export default TopCardsModel;

