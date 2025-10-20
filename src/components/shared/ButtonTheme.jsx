import { useState, useEffect } from 'react';

export default function ButtonTheme() {
    const [theme, setTheme] = useState(false); // false = light, true = dark

    useEffect(() => {
        const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        const storedTheme = localStorage.getItem('data-theme');
        const initialIsDark = storedTheme === 'dark' || (!storedTheme && prefersDark);
        
        setTheme(initialIsDark);
    }, []);

    useEffect(() => {
        const newTheme = theme ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('data-theme', newTheme);
    }, [theme]);

    const handleToggleTheme = () => {
        setTheme(prevTheme => !prevTheme);
    };

    const currentTheme = theme ? 'dark' : 'light';

    return (
        <button
            onClick={handleToggleTheme}
            aria-label="Toggle theme"
            title="Toggle between light and dark mode"
            className={`
                flex items-center justify-center w-10 h-10 bg-transparent
                border-2 border-gray-300 dark:border-gray-600 rounded-lg
                cursor-pointer transition-all duration-300 relative overflow-hidden
                hover:border-blue-500 dark:hover:border-teal-400 
                hover:bg-gray-100 dark:hover:bg-gray-700 hover:scale-[1.05]
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50a
            `}
            data-theme={currentTheme}
        >
            {/* Sun Icon: Visible in Dark Mode */}
            <span
                className={`
                    absolute text-xl transition-all duration-500
                    ${currentTheme === 'dark' 
                        ? 'opacity-100 rotate-0 scale-100'
                        : 'opacity-0 -rotate-180 scale-50'
                    }
                `}
            >
                ☀️
            </span>

            {/* Moon Icon: Visible in Light Mode */}
            <span
                 className={`
                    absolute text-xl transition-all duration-500
                    ${currentTheme === 'dark' 
                        ? 'opacity-0 rotate-180 scale-50'
                        : 'opacity-100 rotate-0 scale-100'
                    }
                `}
            >
                🌙
            </span>
        </button>
    )
}