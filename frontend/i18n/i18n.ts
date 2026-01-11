import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import Backend from 'i18next-http-backend';

// Types
type SupportedLanguage = 'pt' | 'en';
type AppNamespace = 'common' | 'auth';

// Environment check for debug mode
const isDevelopment = process.env.NODE_ENV === 'development';

i18n
  .use(Backend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    // Language settings
    supportedLngs: ['pt', 'en'],
    fallbackLng: 'pt',
    
    // Debug only in development
    debug: isDevelopment,
    
    // Namespace configuration
    defaultNS: 'common',
    ns: ['common', 'auth'],
    
    // Enable object/array returns
    returnObjects: true,
    
    // Backend configuration for loading translations
    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json',
    },
    
    // Language detection settings
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
      lookupLocalStorage: 'i18nextLng',
    },
    
    // Interpolation settings
    interpolation: {
      escapeValue: false, // React already escapes values
    },
    
    // Disable missing translation logging
    saveMissing: false,
    
    // React integration settings
    react: {
      bindI18n: 'languageChanged loaded',
      bindI18nStore: 'added',
      useSuspense: true,
    },
  });

export default i18n;