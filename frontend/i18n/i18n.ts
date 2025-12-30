import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import Backend from 'i18next-http-backend';

i18n
  .use(Backend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    // --------------------------------->
    supportedLngs: ['pt', 'en', 'es', 'fr', 'de', 'it', 'ja', 'zh', 'ru', 'hi', 'ar'],
    fallbackLng: 'pt',
    debug: true,
    defaultNS: 'common',
    ns: ['common', 'auth'],
    // <--------------------------------
    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json',
    },
    // -------------------------------->
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage', 'cookie'],
      lookupLocalStorage: 'i18nextLng',
    },
    // <--------------------------------
    interpolation: {
      escapeValue: false,
    },
    saveMissing: false, 
    react: {
      bindI18n: 'languageChanged loaded', 
      bindI18nStore: 'added',
      useSuspense: true, 
    },
  });

export default i18n;
