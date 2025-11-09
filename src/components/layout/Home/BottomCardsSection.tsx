import React from 'react';
import { modelCardsDetails } from '../../../global/data';
import BottomCard from './BottomCard';

import { 
  SiMeta as Llama,
  SiHuggingface as Huggingface,
} from 'react-icons/si';

function BottomCardsSection() {
  const ArrayModels = [
    <Llama className="text-purple-500" size={24} />,
    <Huggingface className="text-yellow-600" size={24} />,
    <Huggingface className="text-yellow-600" size={24} />,
    <Llama className="text-purple-500" size={24} />,
    <Huggingface className="text-yellow-600" size={24} />,
    <Huggingface className="text-yellow-600" size={24} />
  ];
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 w-full max-w-7xl mt-10">
      {modelCardsDetails.map((item, index) => (
        
        <BottomCard 
        key={index} 
        item={item} 
        index={index}
        icon={ArrayModels[index]}
        />
      ))}
    </div>
  );
}

export default BottomCardsSection;
