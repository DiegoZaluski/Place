import {useState, useEffect} from "react";
import { useLlama } from '../../../hooks/useLlama';
import { Search } from 'lucide-react'

interface SearchButtonProps {
    className?: string 
}
const SearchButton = (deepSearch: SearchButtonProps, className?: string ) => {
    const { sendPrompt } = useLlama();
    return (
        <div className={`w-16 h-8 overflow-hidden rounded-full border border-black ${className}`}>
            <button type="button" className={`w-full h-full flex flex-row items-center justify-center p-2`}>
                <Search size={20} />
                <span className={`text-sm`}>Deep</span>
            </button>
        </div>
    )
}

export default SearchButton