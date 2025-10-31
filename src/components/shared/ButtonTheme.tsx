import React, { useContext } from 'react';
import { AppContext } from '../../global/AppProvider';

// STYLE CONSTANTS
const STYLES = {
  base: "flex items-center justify-center w-10 h-10 bg-transparent border border-[#605C4E] rounded-lg cursor-pointer transition-all duration-300 relative hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-[#605C4E] p-2",
  icon: {
    base: "absolute transition-all duration-500 flex items-center justify-center text-2xl w-full h-full",
    visible: "opacity-100 rotate-0 scale-100",
    hidden: "opacity-0 -rotate-90 scale-50"
  }
};

// MAIN COMPONENT
interface ButtonThemeProps {
    className?: string;
}

export default function ButtonTheme({ className = '' }: ButtonThemeProps) {
    const appContext = useContext(AppContext);

    if (!appContext) {
        throw new Error('ButtonTheme must be used within AppProvider');
    }

    const { isDark, setIsDark } = appContext;

    // THEME TOGGLE HANDLER
    const handleToggleTheme = () => {
        const newIsDark = !isDark;
        setIsDark(newIsDark);
        
        // Aplica ao documento e salva
        document.documentElement.setAttribute('data-theme', newIsDark ? 'dark' : 'light');
        localStorage.setItem('data-theme', newIsDark ? 'dark' : 'light');
    };

    return (
        <button
            onClick={handleToggleTheme}
            aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
            title={isDark ? "Activate Light Mode" : "Activate Dark Mode"}
            className={`${STYLES.base} ${className}`}
        >
            <span
                className={`${STYLES.icon.base} ${
                    isDark ? STYLES.icon.visible : STYLES.icon.hidden
                }`}
            >
                ☀️
            </span>

            <span
                className={`${STYLES.icon.base} ${
                    isDark ? STYLES.icon.hidden : STYLES.icon.visible
                }`}
            >
                🌙
            </span>
        </button>
    );
}