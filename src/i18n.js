import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import translationEN from './locales/en.json';
import translationHI from './locales/hi.json';

const resources = {
  en: { translation: translationEN },
  hi: { translation: translationHI }
};

// Read saved language from localStorage, default to English
const savedLanguage = localStorage.getItem('kisanLanguage') || 'en';

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: savedLanguage,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

// Save language to localStorage whenever it changes
i18n.on('languageChanged', (lng) => {
  localStorage.setItem('kisanLanguage', lng);
});

export default i18n;