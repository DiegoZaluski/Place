import {useState, useEffect} from "react";
import { useLlama } from '../../../hooks/useLlama';
import { FaLightbulb } from 'react-icons/fa'

interface ThinkButtonProps {
    className?: string 
}
const ThinkButton = (deepSearch: ThinkButtonProps, className?: string ) => {
    const { sendPrompt } = useLlama();
    return (
        <div className={`w-full h-full overflow-hidden rounded-full border border-black ${className}`}>
            <button type="button" className={`w-full h-full flex flex-row items-center justify-center p-2`}>
                <FaLightbulb size={12} />
                <span className={`text-sm`}>Think</span>
            </button>
        </div>
    )
}

export default ThinkButton