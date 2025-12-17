import { useContext, useState } from 'react';
import { Search } from 'lucide-react';
import { deepResearchModels, simpleModel } from '../../../global/data';
import { AppContext } from '../../../global/AppProvider';

interface SearchButtonProps {
  className?: string;
}
const SearchButton = (deepSearch: SearchButtonProps, className?: string) => {
  const [clicked, setClicked] = useState(false);
  const CONTEXT = useContext(AppContext);
  const currentModel = CONTEXT.curretModel;
  const deepModel = deepResearchModels.includes(currentModel);
  const noSearch = simpleModel.includes(currentModel);
  if (noSearch) return null;
  const HandlerClick = (Deep: boolean): void => {
    const { searchCode, setSearchCode } = CONTEXT;
    if (Deep) {
      setSearchCode(searchCode === 300 ? 100 : 300);
      setClicked(!clicked);
    } else {
      setSearchCode(searchCode === 200 ? 100 : 200);
      setClicked(!clicked);
    }
  };
  return (
    <div
      className={`w-full h-full overflow-hidden rounded-full border border-black ${className} ${clicked ? 'outline outline-1 outline-white' : ''}`}
    >
      <button
        onClick={deepModel ? () => HandlerClick(true) : () => HandlerClick(false)}
        type="button"
        className={'w-full h-full flex flex-row items-center justify-center p-2 '}
      >
        <Search size={20} />
        <span className={'text-sm'}>{deepModel ? 'Deep' : 'Sea..'}</span>
      </button>
    </div>
  );
};
export default SearchButton;
