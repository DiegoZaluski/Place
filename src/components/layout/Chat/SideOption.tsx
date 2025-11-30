import React, {useState, useCallback} from "react";
import { PanelLeft } from 'lucide-react';
import {CircularDial} from '../CustomModel/CircularDial';
import { Model, model, TOKEN_PRESETS } from '../../../global/varsGlobal';
import TokensControl from "../CustomModel/TokensControl";
import SystemPrompt from "../CustomModel/SystemPrompt";
const ButtonShow = ({ onClick }: { onClick: () => void }) => { 
    return ( 
    <button 
        onClick={onClick} 
        className={
        `w-full
        h-10
        roudended-full 
        flex
        flex-row
        items-center
        justify-center
        mt-4`
        }>
        <PanelLeft size={20} />
        </button>
    );
}

const SideOption = React.memo((): JSX.Element => {
    const [expandedPrompt, setExpandedPrompt] = useState(false);
    const [state, setState] = useState({
    temperature: 0.7,
    topP: 0.9,
    topK: 40,
    maxTokens: (TOKEN_PRESETS[model.id as keyof typeof TOKEN_PRESETS] ?? 2048),
    systemPrompt: '',
    loraFiles: [],
    });
    const dials = [
        { 
        label: 'Temperature', 
        value: state.temperature, 
        min: 0, 
        max: 2, 
        step: 0.01,
        key: 'temperature' as const 
        },
        { 
        label: 'Top P', 
        value: state.topP, 
        min: 0, 
        max: 1, 
        step: 0.01,
        key: 'topP' as const 
        },
        { 
        label: 'Top K', 
        value: state.topK, 
        min: 0, 
        max: 100, 
        step: 1,
        key: 'topK' as const 
        },
    ];

    const [isShow, setIsShow] = useState<boolean>(false);

    const HandlerShow = (): void => {
        setIsShow(!isShow);
    }
    const handleChange = useCallback(() => {
        setState(prev => {
        const updated = { ...prev};
        return updated;
        });
  }, [model.id]);

    if (!isShow) return (
    <div className={`
        h-[calc(100vh-5rem)]
        w-16  
        shadow-xl
        absolute
        left-0
        top-[5rem]
        transition-all duration-300
    `}> 
        <ButtonShow onClick={HandlerShow}/>
    </div>
    );
    return (
    <div className={`

        h-[calc(100vh-5rem)]
        w-60
        shadow-2xl
        absolute
        left-0
        top-[5rem]
    `}>
        <ButtonShow onClick={HandlerShow}/>
        {dials.map(dial => (
                <CircularDial
                key={dial.key}
                label={dial.label}
                value={dial.value}
                min={dial.min}
                max={dial.max}
                step={dial.step}
                onChange={(val) => setState(prev => ({ ...prev, [dial.key]: val }))}
                simple={true}
                />
            ))}
        <div className="border-b border-white/50 h-10 w-3/4 ml-4 "></div> {/*line*/}
        <TokensControl 
          maxTokens={state.maxTokens} 
          onChange={(value) => handleChange()}
          className=""
        />
        <div className="border-b border-white/50 h-10 w-3/4 ml-4 "></div> {/*line*/}

        <SystemPrompt isExpanded={expandedPrompt} onToggle={() => setExpandedPrompt(!expandedPrompt)} className={`mt-4`}/>

        <div className="border-b border-white/50 h-10 w-3/4 ml-4 "></div> {/*line*/}
        <h2 className={`mt-2 mt4 ml-4 pla font-playfair`}>history</h2>
        <p className="mt4 ml-4 text-sm">This is in prod...</p>
    </div>
    );
});

export default SideOption