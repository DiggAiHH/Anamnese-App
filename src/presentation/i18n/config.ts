/**
 * i18n Configuration - React Native
 * 
 * Currently supports de/en.
 */

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { logError } from '@shared/logger';

// Import translations
import de from './locales/de.json';
import en from './locales/en.json';
import fr from './locales/fr.json';
import es from './locales/es.json';
import it from './locales/it.json';
import pt from './locales/pt.json';
import nl from './locales/nl.json';
import pl from './locales/pl.json';
import tr from './locales/tr.json';
import ru from './locales/ru.json';
import ar from './locales/ar.json';
import fa from './locales/fa.json';
import zh from './locales/zh.json';
import ja from './locales/ja.json';
import ko from './locales/ko.json';
import vi from './locales/vi.json';
import uk from './locales/uk.json';
import ro from './locales/ro.json';
import el from './locales/el.json';

// Matches the original "19 languages" claim.
export const SUPPORTED_LANGUAGES = [
  'de',
  'en',
  'fr',
  'es',
  'it',
  'pt',
  'nl',
  'pl',
  'tr',
  'ru',
  'ar',
  'fa',
  'zh',
  'ja',
  'ko',
  'vi',
  'uk',
  'ro',
  'el',
] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

const LANGUAGE_STORAGE_KEY = 'app_language';

// Get device language (fallback to 'de')
const getDeviceLanguage = (): string => {
  try {
    const locale = Intl.DateTimeFormat().resolvedOptions().locale;
    return locale?.split('-')[0] ?? 'de';
  } catch {
    return 'de';
  }
};

const deviceLanguage = getDeviceLanguage();

const normalizeLanguage = (language: string | null | undefined): SupportedLanguage => {
  const normalized = (language ?? '').split('-')[0].toLowerCase();
  return (SUPPORTED_LANGUAGES as readonly string[]).includes(normalized)
    ? (normalized as SupportedLanguage)
    : 'de';
};

i18n
  .use(initReactI18next)
  .init({
    compatibilityJSON: 'v3',
    resources: {
      de: { translation: de },
      en: { translation: en },
      fr: { translation: fr },
      es: { translation: es },
      it: { translation: it },
      pt: { translation: pt },
      nl: { translation: nl },
      pl: { translation: pl },
      tr: { translation: tr },
      ru: { translation: ru },
      ar: { translation: ar },
      fa: { translation: fa },
      zh: { translation: zh },
      ja: { translation: ja },
      ko: { translation: ko },
      vi: { translation: vi },
      uk: { translation: uk },
      ro: { translation: ro },
      el: { translation: el },
    },
    lng: normalizeLanguage(deviceLanguage),
    fallbackLng: 'de',
    react: {
      useSuspense: false,
    },
    interpolation: {
      escapeValue: false,
    },
  })
  .catch(error => {
    logError('i18n initialization failed', error);
  });

// Best-effort: apply stored language after init.
AsyncStorage.getItem(LANGUAGE_STORAGE_KEY)
  .then(stored => {
    const storedLanguage = normalizeLanguage(stored);
    if (storedLanguage && storedLanguage !== i18n.language) {
      return i18n.changeLanguage(storedLanguage);
    }
    return undefined;
  })
  .catch(() => {
    // ignore
  });

export const setAppLanguage = async (language: SupportedLanguage): Promise<void> => {
  await i18n.changeLanguage(language);
  await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, language);
};

export default i18n;
