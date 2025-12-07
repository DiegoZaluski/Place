import { useState, useEffect } from "react";
 //WARNING: Don't forget to add the doc strings here.
export function useStorage<T>(key: string, defaultValue: T) {
    const [value, setValue] = useState<T>(() => {
        try {
            const stored = localStorage.getItem(key);
            if (stored === null || stored === 'undefined') return defaultValue;
            return JSON.parse(stored);
        } catch {
            return defaultValue;
        }
    });
    
    useEffect(() => {
        localStorage.setItem(key, JSON.stringify(value));
    }, [key, value]);

    function remove() {
        localStorage.removeItem(key);
        setValue(defaultValue);
    }
    
    return [value, setValue, remove] as const;
}