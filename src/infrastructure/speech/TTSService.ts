/**
 * TTSService - Text-to-Speech Service
 *
 * Uses react-native-tts (system TTS) for 100% FREE offline text-to-speech.
 * Supports 19 languages via system voices (no cloud costs).
 *
 * @security Audio is generated locally; no data leaves the device.
 * @privacy GDPR Art. 25 compliant - no PII transmitted.
 */

import { Platform } from 'react-native';

// Conditional import: Only load react-native-tts on non-Windows platforms
// This prevents "cannot read undefined" crash at module load time on Windows
let Tts: typeof import('react-native-tts').default | null = null;
if (Platform.OS !== 'windows') {
  try {
    Tts = require('react-native-tts').default;
  } catch {
    // Module not available, Tts remains null
  }
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
      console.log(`[TTS] ${message}`);
    }
  }

  private logError(message: string, error?: unknown): void {
    // Never log spoken text (GDPR compliance)
    if (typeof __DEV__ !== 'undefined' && __DEV__) {
      // eslint-disable-next-line no-console
      console.error(`[TTS] ${message}`, error);
    }
    // Production: no logging to avoid any PII leak
  }

  private async initialize(): Promise<void> {
    if (this.initialized) return;
    
    // Check if Tts module is available (null on Windows)
    if (!Tts || Platform.OS === 'windows') {
      this.initialized = true;
      this.logDebug('TTS Service mocked (module not available or Windows)');
      return;
    }

    try {
      // Set up event listeners
      Tts.addEventListener('tts-start', () => {
        this.speaking = true;
        this.logDebug('Speech started');
      });

      Tts.addEventListener('tts-finish', () => {
        this.speaking = false;
        this.logDebug('Speech finished');
      });

      Tts.addEventListener('tts-cancel', () => {
        this.speaking = false;
        this.logDebug('Speech cancelled');
      });

      // Set default rate and pitch
      await Tts.setDefaultRate(this.currentRate);
      await Tts.setDefaultPitch(this.currentPitch);

      // Set default language to German (app default)
      await Tts.setDefaultLanguage('de-DE');

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
    if (!Tts || Platform.OS === 'windows') {
      this.logDebug('TTS speak ignored (module not available or Windows)');
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
      await Tts.setDefaultLanguage(ttsLanguage);

      // Don't log the text content (GDPR)
      this.logDebug(`Speaking in ${ttsLanguage} (${truncatedText.length} chars)`);

      await Tts.speak(truncatedText);
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
      await Tts.stop();
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
      const voices = await Tts.voices();
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
      await Tts.setDefaultRate(clampedRate);
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
      await Tts.setDefaultPitch(clampedPitch);
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
      await Tts.setDefaultLanguage(ttsLanguage);
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
        Tts.stop();
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
