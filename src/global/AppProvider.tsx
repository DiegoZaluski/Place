import React, { createContext, useState } from "react";
import { useStorage } from "../hooks/useStorage";
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
  downloadedModels: string[]; 
  curretModel: string;
}

interface GlobalActions {
  setIsDark: (isDark: boolean) => void; 
  setUser: (user: { name: string; avatar: string } | null) => void;
  setIsLoggedIn: (isLoggedIn: boolean) => void;
  setCartItems: (cartItems: number) => void;
  setDownloadState: (modelId: string, state: DownloadState) => void;
  setCurrentModel: (modelId: string) => void;
  getDownloadState: (modelId: string) => DownloadState;
  addDownloadedModel: (modelId: string) => void; 
  removeDownloadedModel: (modelId: string) => void;
  addCurrentModel: (modelId: string) => void; 
}

type AppContextType = GlobalState & GlobalActions;

// CONTEXT CREATION
export const AppContext = createContext<AppContextType | undefined>(undefined);

// PROVIDER COMPONENT
export const AppProvider = ({ children }: { children: React.ReactNode }) => {
  // STATE MANAGEMENT - WITH THEME INITIALIZATION
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const saved = localStorage.getItem('data-theme');
    return saved === 'dark';
  });
  
  const [user, setUser] = useState<{ name: string; avatar: string } | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [cartItems, setCartItems] = useState<number>(0);
  const [downloads, setDownloads] = useState<Record<string, DownloadState>>({});
  const [downloadedModels, setDownloadedModels] = useState<string[]>([]);
  const [curretModel, setCurrentModel] = useStorage('current-model', ''); // '' default, substitute in production 

  const setDownloadState = (modelId: string, state: DownloadState) => {
    setDownloads(prev => ({ ...prev, [modelId]: state }));
    
    //UPDATE downloaded list automatically
    if (state.status === 'downloaded') {
      setDownloadedModels(prev => 
        prev.includes(modelId) ? prev : [...prev, modelId]
      );
    }
  };

  const getDownloadState = (modelId: string): DownloadState => {
    return downloads[modelId] || { status: 'idle', progress: 0 };
  };

  //NEW ACTIONS to manage downloaded models
  const addDownloadedModel = (modelId: string) => {
    setDownloadedModels(prev => 
      prev.includes(modelId) ? prev : [...prev, modelId]
    );
  };

  const removeDownloadedModel = (modelId: string) => {
    setDownloadedModels(prev => prev.filter(id => id !== modelId));
  };

  const addCurrentModel = (modelId: string) => {
    setCurrentModel(modelId);
  }
  // CONTEXT VALUE
  const value: AppContextType = {
    isDark,
    user,
    isLoggedIn,
    cartItems,
    downloads,
    downloadedModels, 
    curretModel,
    setIsDark,
    setUser,
    setIsLoggedIn,
    setCartItems,
    setCurrentModel,
    setDownloadState,
    getDownloadState,
    addDownloadedModel, 
    removeDownloadedModel,
    addCurrentModel
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};