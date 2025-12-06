import { useEffect, useRef } from 'react';

const BASE_URL = 'http://localhost:8001/configs';

interface LlamaConfig {
    id_model: string;
    temperature?: number;
    top_p?: number;
    top_k?: number;
    tokens?: number;
    repeat_penalty?: number;
    frequency_penalty?: number;
    presence_penalty?: number;
    min_p?: number;
    tfs_z?: number;
    mirostat_tau?: number;
    seed?: number | null;
    stop?: string[] | null;
}

function ConfigLLMObserver() {
    const timeoutRef = useRef<NodeJS.Timeout>();
    const pendingConfigsRef = useRef<Map<string, LlamaConfig>>(new Map());

    const syncConfig = async (config: LlamaConfig) => {
        console.log('Config:', config);
        const encodedId = encodeURIComponent(config.id_model);
        
        try {
            const getResponse = await fetch(`${BASE_URL}/${encodedId}`);
            
            if (getResponse.status === 404) {
                const postResponse = await fetch(BASE_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(config)
                });
                
                if (!postResponse.ok) {
                    console.error(`POST failed: ${postResponse.status}`);
                }
            } else if (getResponse.ok) {
                const patchResponse = await fetch(BASE_URL, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(config)
                });
                
                if (!patchResponse.ok) {
                    console.error(`PATCH failed: ${patchResponse.status}`);
                }
            } else {
                console.error(`GET failed: ${getResponse.status}`);
            }
        } catch (error) {
            console.error('Network error:', error);
        }
    };

    useEffect(() => {
        const handler = (e: CustomEvent<LlamaConfig>) => {
            pendingConfigsRef.current.set(e.detail.id_model, e.detail);
            clearTimeout(timeoutRef.current);
            
            timeoutRef.current = setTimeout(() => {
                pendingConfigsRef.current.forEach(syncConfig);
                pendingConfigsRef.current.clear();
            }, 2000);
        };
        
        document.addEventListener('configLlm', handler as EventListener);
        
        return () => {
            clearTimeout(timeoutRef.current);
            document.removeEventListener('configLlm', handler as EventListener);
        };
    }, []);

    return null;
}

export default ConfigLLMObserver;