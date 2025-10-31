import React, { createContext, useState } from "react";

// TYPES AND INTERFACES
type GlobalState = {
    isDark: boolean; 
    user: { name: string; avatar: string } | null;
    isLoggedIn: boolean;
    cartItems: number;
}

interface GlobalActions {
    setIsDark: (isDark: boolean) => void; 
    setUser: (user: { name: string; avatar: string } | null) => void;
    setIsLoggedIn: (isLoggedIn: boolean) => void;
    setCartItems: (cartItems: number) => void;
}

type AppContextType = GlobalState & GlobalActions;

// CONTEXT CREATION
export const AppContext = createContext<AppContextType | undefined>(undefined);

// PROVIDER COMPONENT

export const AppProvider = ({ children }: { children: React.ReactNode }) => {
    // STATE MANAGEMENT - COM INICIALIZAÇÃO DO TEMA SALVO
    const [isDark, setIsDark] = useState<boolean>(() => {
        if (typeof window === 'undefined') return false;
        const saved = localStorage.getItem('data-theme');
        return saved === 'dark';
    });
    
    const [user, setUser] = useState<{ name: string; avatar: string } | null>(null);
    const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
    const [cartItems, setCartItems] = useState<number>(0);

    // CONTEXT VALUE
    const value: AppContextType = {
        isDark,
        user,
        isLoggedIn,
        cartItems,
        setIsDark,
        setUser,
        setIsLoggedIn,
        setCartItems
    };

    return (
        <AppContext.Provider value={value}>
            {children}
        </AppContext.Provider>
    );
};