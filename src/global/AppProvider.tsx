import React, { createContext, useState } from "react";

// TYPES AND INTERFACES
type DownloadState = {
  status: 'checking' | 'idle' | 'connecting' | 'downloading' | 'downloaded' | 'error';
  progress: number;
  error?: string;
};

type GlobalState = {
  isDark: boolean; 
  user: { name: string; avatar: string } | null;
  isLoggedIn: boolean;
  cartItems: number;
  downloads: Record<string, DownloadState>;
}

interface GlobalActions {
  setIsDark: (isDark: boolean) => void; 
  setUser: (user: { name: string; avatar: string } | null) => void;
  setIsLoggedIn: (isLoggedIn: boolean) => void;
  setCartItems: (cartItems: number) => void;
  setDownloadState: (modelId: string, state: DownloadState) => void;
  getDownloadState: (modelId: string) => DownloadState;
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
  const [downloads, setDownloads] = useState<Record<string, DownloadState>>({});

  const setDownloadState = (modelId: string, state: DownloadState) => {
    setDownloads(prev => ({ ...prev, [modelId]: state }));
  };

  const getDownloadState = (modelId: string): DownloadState => {
    return downloads[modelId] || { status: 'idle', progress: 0 };
  };

  // CONTEXT VALUE
  const value: AppContextType = {
    isDark,
    user,
    isLoggedIn,
    cartItems,
    downloads,
    setIsDark,
    setUser,
    setIsLoggedIn,
    setCartItems,
    setDownloadState,
    getDownloadState
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};