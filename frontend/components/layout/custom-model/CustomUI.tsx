import { useCallback, useContext, useState, useEffect } from 'react';
import { ControlCard, COLORS } from './ControlCard';
import Header from '../../shared/header/Header';
import { AppContext } from '../../../global/AppProvider';
import { modelCardsDetails } from '../../../global/data';
import { config_model } from '@/global/global'

interface Model {
  id: string;
  name: string;
}
export default function CustomUI() {
  const [MODELS, setMODELS] = useState<Model[]>([]);
  const CONTEXT = useContext(AppContext);
  const downloadedModels = CONTEXT.downloadedModels;
  useEffect(() => {
    if (downloadedModels?.length > 0) {
      const transformed = downloadedModels.map((modelFileName) => {
        const found = modelCardsDetails.find((m) => m.fullModelName === modelFileName);
        return {
          id: modelFileName,
          name: found?.modelName || modelFileName,
        };
      });
      setMODELS(transformed);
    }
  }, [downloadedModels]);

  const handleModelUpdate = useCallback((modelId: string, state: config_model) => {
    console.log(`Model ${modelId}:`, state);
  }, []);

  return (
    <div className={`min-h-screen ${COLORS.PRIMARY_THEMA} scrollbar-hide w-full`}>
      <Header />
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
          {MODELS.map((model) => (
            <ControlCard key_model={model.id} model={model} onUpdate={handleModelUpdate} />
          ))}
        </div>
      </div>
    </div>
  );
}
