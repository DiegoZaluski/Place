import { useState, useContext } from 'react';
import { useLlama } from '../../../hooks/useLlama';
import { FaLightbulb } from 'react-icons/fa';
import { simpleModel } from '../../../global/data';
import { AppContext } from '../../../global/AppProvider';

interface ThinkButtonProps {
  deepSearch?: string;
  className?: string;
}

const ThinkButton = ({ deepSearch, className }: ThinkButtonProps) => {
  const CONTEXT = useContext(AppContext);
  const currentModel = CONTEXT.curretModel;
  const noThink = simpleModel.includes(currentModel);
  const { thinking, setThinking } = CONTEXT;

  const HandlerClick = (): void => {
    setThinking(!thinking);
  };
  const { sendPrompt } = useLlama();
  return (
    <div
      className={`w-full h-full overflow-hidden rounded-full border border-black ${className} ${thinking ? 'outline outline-1 outline-white' : ''}`}
    >
      <button
        onClick={HandlerClick}
        type="button"
        className={'w-full h-full flex flex-row items-center justify-center p-2'}
      >
        <FaLightbulb size={12} />
        <span className={'text-sm'}>Think</span>
      </button>
    </div>
  );
};

export default ThinkButton;
