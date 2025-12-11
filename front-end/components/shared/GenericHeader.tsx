import { BackBtn, MinimizeBtn, MaximizeBtn, CloseBtn } from './WindowsComponents';
const GenericHeader: React.FC = () => {
  return (
    <header className="
        w-full 
        grid 
        grid-cols-3 
        items-center 
        mb-6
    ">
      
    {/* LEFT_SECTION: Back button aligned to start */}
    { document.documentElement.getAttribute('data-theme') === 'dark' ? 
        <div className="
        col-start-1 
        justify-self-start
        ">
        <BackBtn whiteFixed={true} />
        </div>
        : 
        <div className="
        col-start-1 
        justify-self-start
        ">
        <BackBtn/>
        </div>}

    {/* RIGHT_SECTION: Window controls aligned to end */}
    { document.documentElement.getAttribute('data-theme') === 'dark' ? 
        <div className="
        gap-2 
        flex 
        col-start-3 
        justify-self-end
        transform translate-x-[-1em]
        ">
        <MinimizeBtn whiteFixed={true} />
        <MaximizeBtn whiteFixed={true} />
        <CloseBtn whiteFixed={true} />
        </div>
        :
        <div className="
        gap-2 
        flex 
        col-start-3 
        justify-self-end
        transform translate-x-[-1em]
        ">
        <MinimizeBtn/>
        <MaximizeBtn/>
        <CloseBtn/>
        </div> }
    </header>
  );
};

export default GenericHeader;