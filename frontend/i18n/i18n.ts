import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import Backend from 'i18next-http-backend';

//----------------> Translation config
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
      lookupLocalStorage: 'i18nextLng', // não funcionou
    },
    // <--------------------------------
    interpolation: {
      escapeValue: false,
    },
    saveMissing: false, // <--- salva as chaves que não existem
    react: {
      bindI18n: 'languageChanged loaded', // para atualizar a interface quando a linguagem muda
      bindI18nStore: 'added',
      useSuspense: true, // Avisa que o componente vai usar o Suspense
    },
  });

export default i18n;
