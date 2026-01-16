import Header from '@/components/shared/header/Header';
import OpDownload from './OpDownload';

const UIConfig = () => {
    return (
        <div className='
            w-full h-full
            flex flex-col items-center
            dark-bg-primary
        '>
            <Header />

            <div className='
                p-8 mt-8
                dark:bg-opacity-10
                w-full max-w-md h-screen
            '>
                <div className='
                    text-center
                    flex flex-col items-center
                '>
                    <h1 className='
                        dark-text-primary
                        mb-3 tracking-wide
                        font-semibold text-3xl
                    '>
                        Download Options
                    </h1>

                    <p className='
                        text-sm
                        dark-text-primary
                        mb-8 opacity-90
                        leading-relaxed max-w-xs
                    '>
                        Choose the standard way to download the models.
                    </p>
                </div>

                <div className='
                    w-full
                '>
                    <OpDownload />
                </div>
            </div>
        </div>
    );
};

export default UIConfig;