/**
 * i18n Configuration - React Native
 * 
 * Unterstützt 19 Sprachen wie im Original
 */

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { getLocales } from 'react-native-localize';

// Import translations
import de from './locales/de.json';
import en from './locales/en.json';

// Get device language (fallback to 'de')
const deviceLanguage = getLocales()[0]?.languageTag?.split('-')[0] ?? 'de';

i18n
  .use(initReactI18next)
  .init({
    compatibilityJSON: 'v3',
    resources: {
      de: { translation: de },
      en: { translation: en },
      // Weitere Sprachen werden später hinzugefügt
    },
    lng: deviceLanguage,
    fallbackLng: 'de',
    interpolation: {
      escapeValue: false,
    },
  })
  .catch(error => {
    console.error('i18n initialization failed:', error);
  });

export default i18n;
