
import { useState, useRef, useEffect,  useCallback } from 'react';
import { SiHuggingface as hg } from 'react-icons/si'

interface LoadProps {
    handShake: boolean;
    error?: string | null;
}

const Load = ({handShake, error}: LoadProps) => {
    const maxTempRef = useRef(10);
    const awaitIpc = useState({});

    const handlerbreakAll = useCallback(() => {

    }, [] );

    const Ready = useEffect(()=> {
        
    }, [awaitIpc,  handlerbreakAll]) 

    return (
        <div>   

        </div>
    )
}
