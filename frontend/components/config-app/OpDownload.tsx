import { useState, useEffect } from "react";
import { Check } from 'lucide-react';

const OpDownload = () => {
    
    const [opdDown, setOpDown] = useState('huggingface_hub');

    // useEffect(() => {
    // const wayDownload = window.api?.downloadServer?.wayDownload;

    // if (!wayDownload) {
    //     console.warn('[OpDownload] Electron API not available');
    //     return;
    // }

    // wayDownload(opdDown);
    // }, [opdDown]);


    return (
        <div className=" 
            w-82 h-26 
            flex flex-col items-start
            border-gray-600 border-opacity-30 border-b">
            {['huggingface_hub','wget','curl'].map((e) => (
                <div>
                    <button
                    onClick={() => {setOpDown(e)}} 
                    className={`
                    pb-1
                    hover:underline 
                    text-md dark-text-primary
                    `}>{e}</button>
                    {e === opdDown ? <Check stroke="green" size={18} className="inline"/>: null}
                </div>
                ))}        
        </div>
    );
}
export default OpDownload