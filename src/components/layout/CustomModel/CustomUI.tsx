import { useCallback } from 'react';
import { ControlCard, Model, ModelState, COLORS } from './ControlCard';
import {BackBtn, MinimizeBtn, MaximizeBtn, CloseBtn} from '../../shared/WindowsComponents';

// CONSTANTS
const MODELS: Model[] = [
  { id: 'model_001', name: 'Llama 2 7B' },
  { id: 'model_002', name: 'Mistral 7B' },
  { id: 'model_003', name: 'Neural Chat' },
];


// MAIN COMPONENT
export default function CustomUI() {
  const handleModelUpdate = useCallback((modelId: string, state: ModelState) => {
    // CONNECT TO SERVER HERE
    console.log(`Model ${modelId}:`, state);
  }, []);

  return (
    <div className={`min-h-screen p-8 ${COLORS.PRIMARY_THEMA}`}>
      <div className="max-w-7xl mx-auto">
        {/* HEADER: here */}
        <div className="grid grid-cols-4 items-center justify-between mb-6">
          <BackBtn />
          <MinimizeBtn />
          <MaximizeBtn />
          <CloseBtn />
        </div>
        {/* GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
          {MODELS.map(model => (
            <ControlCard
              key={model.id}
              model={model}
              onUpdate={handleModelUpdate}
            />
          ))}
        </div>
      </div>
    </div>
  );
}