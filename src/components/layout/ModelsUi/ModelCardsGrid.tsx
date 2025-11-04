import React, { useState, useContext } from 'react';
import ModelCard , {THEME } from './ModelCard';
import {modelDetails} from './modelDetails';
import {BackBtn} from '../../shared/WindowsComponents';
import { AppContext } from '../../../global/AppProvider';

const ModelCardsGrid: React.FC = () => {
  const { getDownloadState } = useContext(AppContext);
  const [expandedCard, setExpandedCard] = useState<number | null>(null);
  return (
    
    <div className={`min-h-screen ${THEME.cardBg} p-8`}>
      <BackBtn/>
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">

        </div>

        <div className="flex flex-wrap gap-6">
          {modelDetails.filter((model, index) => getDownloadState(model.fullModelName).status === 'downloaded').map((model, index) => (
            <ModelCard
              key={`model-${index}`}
              model={model}
              isExpanded={expandedCard === index}
              onHover={() => setExpandedCard(index)}
              onLeave={() => setExpandedCard(null)}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default ModelCardsGrid;