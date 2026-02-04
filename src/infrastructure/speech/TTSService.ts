/**
 * TTSService - Text-to-Speech Service
 *
 * Uses react-native-tts (system TTS) for 100% FREE offline text-to-speech.
 * Supports 19 languages via system voices (no cloud costs).
 *
 * @security Audio is generated locally; no data leaves the device.
 * @privacy GDPR Art. 25 compliant - no PII transmitted.
 */

import { logWarn } from '../../shared/logger';
import * as platformCapabilities from '@shared/platformCapabilities';

type TtsApi = {
  addEventListener?: unknown;
  speak?: unknown;
  stop?: unknown;
  voices?: unknown;
  setDefaultRate?: unknown;
  setDefaultPitch?: unknown;
  setDefaultLanguage?: unknown;
};

const loadTtsModule = (): TtsApi | null => {
  if (!platformCapabilities.supportsTTS) return null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const mod = require('react-native-tts');
    return (mod?.default ?? mod) as TtsApi;
  } catch {
    return null;
  }
};

const hasRequiredTtsApi = (
  tts: TtsApi | null,
): tts is Required<Pick<TtsApi, 'addEventListener' | 'speak' | 'stop'>> & TtsApi => {
  return (
    !!tts &&
    typeof tts.addEventListener === 'function' &&
    typeof tts.speak === 'function' &&
    typeof tts.stop === 'function'
  );
};

// Conditional import: Only load react-native-tts on iOS/Android and tolerate CJS/ESM export shapes
let Tts: TtsApi | null = loadTtsModule();
if (!hasRequiredTtsApi(Tts)) {
  Tts = null;
}

export interface TTSVoice {
  id: string;
  name: string;
  language: string;
  quality?: number;
  networkConnectionRequired?: boolean;
}

export interface ITTSService {
  speak(text: string, language?: string): Promise<void>;
  stop(): Promise<void>;
  pause(): Promise<void>;
  resume(): Promise<void>;
  isSpeaking(): boolean;
  getAvailableVoices(): Promise<TTSVoice[]>;
  getSupportedLanguages(): string[];
  setRate(rate: number): Promise<void>;
  setPitch(pitch: number): Promise<void>;
  setDefaultLanguage(language: string): Promise<void>;
}

/**
 * Language mapping from app locale to TTS language code
 */
const LANGUAGE_MAP: Record<string, string> = {
  de: 'de-DE',
  en: 'en-US',
  ar: 'ar-SA',
  el: 'el-GR',
  es: 'es-ES',
  fa: 'fa-IR',
  fr: 'fr-FR',
  it: 'it-IT',
  ja: 'ja-JP',
  ko: 'ko-KR',
  nl: 'nl-NL',
  pl: 'pl-PL',
  pt: 'pt-BR',
  ro: 'ro-RO',
  ru: 'ru-RU',
  tr: 'tr-TR',
  uk: 'uk-UA',
  vi: 'vi-VN',
  zh: 'zh-CN',
};

/**
 * All 19 supported languages
 */
const SUPPORTED_LANGUAGES = [
  'de',
  'en',
  'ar',
  'el',
  'es',
  'fa',
  'fr',
  'it',
  'ja',
  'ko',
  'nl',
  'pl',
  'pt',
  'ro',
  'ru',
  'tr',
  'uk',
  'vi',
  'zh',
];

export class TTSService implements ITTSService {
  private speaking: boolean = false;
  private initialized: boolean = false;
  private currentRate: number = 0.5;
  private currentPitch: number = 1.0;

  constructor() {
    this.initialize();
  }

  private logDebug(message: string): void {
    if (typeof __DEV__ !== 'undefined' && __DEV__) {
      // eslint-disable-next-line no-console
      logWarn(`[TTS] ${message}`);
    }
  }

  private logError(message: string, error?: unknown): void {
    // Never log spoken text (GDPR compliance)
    if (typeof __DEV__ !== 'undefined' && __DEV__) {
      console.error(`[TTS] ${message}`, error);
    }
    // Production: no logging to avoid any PII leak
  }

  private async initialize(): Promise<void> {
    if (this.initialized) return;

    // Check if Tts module is available (null on unsupported platforms / missing module / incompatible export)
    if (!Tts || !platformCapabilities.supportsTTS) {
      this.initialized = true;
      this.logDebug('TTS Service mocked (module not available or unsupported platform)');
      return;
    }

    try {
      // Set up event listeners
      (Tts.addEventListener as (event: string, callback: () => void) => void)('tts-start', () => {
        this.speaking = true;
        this.logDebug('Speech started');
      });

      (Tts.addEventListener as (event: string, callback: () => void) => void)('tts-finish', () => {
        this.speaking = false;
        this.logDebug('Speech finished');
      });

      (Tts.addEventListener as (event: string, callback: () => void) => void)('tts-cancel', () => {
        this.speaking = false;
        this.logDebug('Speech cancelled');
      });

      // Set default rate and pitch
      if (typeof Tts.setDefaultRate === 'function') {
        await (Tts.setDefaultRate as (rate: number) => Promise<void>)(this.currentRate);
      }
      if (typeof Tts.setDefaultPitch === 'function') {
        await (Tts.setDefaultPitch as (pitch: number) => Promise<void>)(this.currentPitch);
      }

      // Set default language to German (app default)
      if (typeof Tts.setDefaultLanguage === 'function') {
        await (Tts.setDefaultLanguage as (language: string) => Promise<void>)('de-DE');
      }

      this.initialized = true;
      this.logDebug('TTS Service initialized');
    } catch (error) {
      this.logError('Failed to initialize TTS', error);
    }
  }

  /**
   * Speak text in the specified language
   * @param text Text to speak (max 4000 chars)
   * @param language App locale (e.g., 'de', 'en')
   */
  async speak(text: string, language: string = 'de'): Promise<void> {
    if (!Tts || !platformCapabilities.supportsTTS) {
      this.logDebug('TTS speak ignored (module not available or unsupported platform)');
      return;
    }

    if (!text || text.trim().length === 0) {
      this.logDebug('Empty text, skipping');
      return;
    }

    // Limit text length for performance (no PII risk as this is just a length check)
    const maxLength = 4000;
    const truncatedText = text.length > maxLength ? text.substring(0, maxLength) + '...' : text;

    try {
      // Stop any current speech
      if (this.speaking) {
        await this.stop();
      }

      // Map language
      const ttsLanguage = LANGUAGE_MAP[language] || 'de-DE';
      if (typeof Tts.setDefaultLanguage === 'function') {
        await (Tts.setDefaultLanguage as (language: string) => Promise<void>)(ttsLanguage);
      }

      // Don't log the text content (GDPR)
      this.logDebug(`Speaking in ${ttsLanguage} (${truncatedText.length} chars)`);

      await (Tts.speak as (textToSpeak: string) => Promise<void>)(truncatedText);
    } catch (error) {
      this.logError('Failed to speak', error);
      throw new Error('Text-to-speech failed');
    }
  }

  /**
   * Stop current speech
   */
  async stop(): Promise<void> {
    if (!Tts) return;
    try {
      await (Tts.stop as () => Promise<void>)();
      this.speaking = false;
      this.logDebug('Speech stopped');
    } catch (error) {
      this.logError('Failed to stop speech', error);
    }
  }

  /**
   * Pause current speech (if supported by platform)
   */
  async pause(): Promise<void> {
    try {
      // react-native-tts doesn't have native pause on all platforms
      // Fall back to stop
      await this.stop();
    } catch (error) {
      this.logError('Failed to pause speech', error);
    }
  }

  /**
   * Resume paused speech (if supported by platform)
   */
  async resume(): Promise<void> {
    // react-native-tts doesn't support resume
    this.logDebug('Resume not supported, use speak() again');
  }

  /**
   * Check if currently speaking
   */
  isSpeaking(): boolean {
    return this.speaking;
  }

  /**
   * Get available voices from the system
   */
  async getAvailableVoices(): Promise<TTSVoice[]> {
    if (!Tts) return [];
    try {
      if (typeof Tts.voices !== 'function') return [];
      const voices = await (
        Tts.voices as () => Promise<
          Array<{
            id: string;
            name: string;
            language: string;
            quality?: number;
            networkConnectionRequired?: boolean;
          }>
        >
      )();
      this.logDebug(`Found ${voices?.length || 0} voices`);

      return (voices || []).map(v => ({
        id: v.id,
        name: v.name,
        language: v.language,
        quality: v.quality,
        networkConnectionRequired: v.networkConnectionRequired,
      }));
    } catch (error) {
      this.logError('Failed to get voices', error);
      return [];
    }
  }

  /**
   * Get list of supported language codes
   */
  getSupportedLanguages(): string[] {
    return [...SUPPORTED_LANGUAGES];
  }

  /**
   * Set speech rate (0.0 - 1.0, where 0.5 is normal)
   */
  async setRate(rate: number): Promise<void> {
    if (!Tts) return;
    try {
      const clampedRate = Math.max(0.1, Math.min(1.0, rate));
      if (typeof Tts.setDefaultRate !== 'function') return;
      await (Tts.setDefaultRate as (rate: number) => Promise<void>)(clampedRate);
      this.currentRate = clampedRate;
      this.logDebug(`Rate set to ${clampedRate}`);
    } catch (error) {
      this.logError('Failed to set rate', error);
    }
  }

  /**
   * Set speech pitch (0.5 - 2.0, where 1.0 is normal)
   */
  async setPitch(pitch: number): Promise<void> {
    if (!Tts) return;
    try {
      const clampedPitch = Math.max(0.5, Math.min(2.0, pitch));
      if (typeof Tts.setDefaultPitch !== 'function') return;
      await (Tts.setDefaultPitch as (pitch: number) => Promise<void>)(clampedPitch);
      this.currentPitch = clampedPitch;
      this.logDebug(`Pitch set to ${clampedPitch}`);
    } catch (error) {
      this.logError('Failed to set pitch', error);
    }
  }

  /**
   * Set default language for TTS
   * @param language App locale (e.g., 'de', 'en')
   */
  async setDefaultLanguage(language: string): Promise<void> {
    if (!Tts) return;
    try {
      const ttsLanguage = LANGUAGE_MAP[language] || 'de-DE';
      if (typeof Tts.setDefaultLanguage !== 'function') return;
      await (Tts.setDefaultLanguage as (language: string) => Promise<void>)(ttsLanguage);
      this.logDebug(`Default language set to ${ttsLanguage}`);
    } catch (error) {
      this.logError('Failed to set default language', error);
    }
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    try {
      if (this.speaking && Tts) {
        if (typeof Tts.stop === 'function') {
          (Tts.stop as () => Promise<void>)();
        }
      }
      // Note: react-native-tts doesn't have removeAllListeners
      this.speaking = false;
      this.initialized = false;
      this.logDebug('TTS Service destroyed');
    } catch (error) {
      this.logError('Failed to destroy TTS', error);
    }
  }
}

// Singleton instance
let ttsServiceInstance: TTSService | null = null;

export function getTTSService(): TTSService {
  if (!ttsServiceInstance) {
    ttsServiceInstance = new TTSService();
  }
  return ttsServiceInstance;
}
