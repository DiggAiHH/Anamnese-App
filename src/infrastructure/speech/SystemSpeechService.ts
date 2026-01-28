import { supportsSpeechToText } from '@shared/platformCapabilities';

// Conditional import: Only load @react-native-voice/voice on non-Windows platforms
// This prevents "cannot read undefined" crash at module load time on Windows
let Voice: typeof import('@react-native-voice/voice').default | null = null;
if (supportsSpeechToText) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    Voice = require('@react-native-voice/voice').default;
  } catch {
    // Module not available, Voice remains null
  }
}

export interface SpeechRecognitionResult {
  transcript: string;
  confidence: number;
  isFinal: boolean;
}

/**
 * Speech error types for UX-friendly error handling
 */
export type SpeechErrorType =
  | 'permission_denied'
  | 'network_error'
  | 'no_match'
  | 'not_available'
  | 'busy'
  | 'unknown';

export interface SpeechError {
  type: SpeechErrorType;
  message: string;
  originalError?: unknown;
}

export interface ISpeechService {
  startRecognition(language?: string): Promise<void>;
  stopRecognition(): Promise<SpeechRecognitionResult>;
  cancelRecognition(): Promise<void>;
  isAvailable(): Promise<boolean>;
  getSupportedLanguages(): Promise<string[]>;
  getLastError(): SpeechError | null;
}

export class SystemSpeechService implements ISpeechService {
  private isRecording: boolean = false;
  private results: string[] = [];
  private currentLanguage: string = 'de-DE';
  private lastError: SpeechError | null = null;

  private readonly languageMap: Record<string, string> = {
    de: 'de-DE',
    en: 'en-US',
    fr: 'fr-FR',
    es: 'es-ES',
    it: 'it-IT',
    pt: 'pt-PT',
    nl: 'nl-NL',
    pl: 'pl-PL',
    tr: 'tr-TR',
    ru: 'ru-RU',
    ar: 'ar-SA',
    fa: 'fa-IR',
    zh: 'zh-CN',
    ja: 'ja-JP',
    ko: 'ko-KR',
    vi: 'vi-VN',
    uk: 'uk-UA',
    ro: 'ro-RO',
    el: 'el-GR',
  };

  constructor() {
    if (supportsSpeechToText && Voice) {
      this.setupListeners();
    }
  }

  private logDebug(message: string): void {
    if (typeof __DEV__ !== 'undefined' && __DEV__) {
      // eslint-disable-next-line no-console
      console.log(message);
    }
  }

  private logWarn(message: string): void {
    if (typeof __DEV__ !== 'undefined' && __DEV__) {
      console.warn(message);
    }
  }

  private logError(message: string, error?: unknown): void {
    // Avoid leaking potential PII (transcripts) via logs.
    if (typeof __DEV__ !== 'undefined' && __DEV__) {
      console.error(message, error);
    }
    // Production: no logging to avoid any PII leak
  }

  private setupListeners(): void {
    if (!Voice) return;
    Voice.onSpeechStart = this.onSpeechStart.bind(this);
    Voice.onSpeechEnd = this.onSpeechEnd.bind(this);
    Voice.onSpeechResults = this.onSpeechResults.bind(this);
    Voice.onSpeechPartialResults = this.onSpeechPartialResults.bind(this);
    Voice.onSpeechError = this.onSpeechError.bind(this);
  }

  async startRecognition(language: string = 'de'): Promise<void> {
    if (!Voice || !supportsSpeechToText) {
      this.logWarn(
        '[Speech] Recognition not supported (module not available or unsupported platform)',
      );
      return;
    }

    if (this.isRecording) {
      this.logWarn('[Speech] Already recording');
      return;
    }

    try {
      // Map app language to voice recognition language
      this.currentLanguage = this.languageMap[language] || 'de-DE';

      this.logDebug(`[Speech] Starting recognition (language: ${this.currentLanguage})`);

      // Clear previous results
      this.results = [];

      // Start voice recognition
      await Voice!.start(this.currentLanguage);
      this.isRecording = true;

      this.logDebug('[Speech] Recognition started');
    } catch (error) {
      this.logError('[Speech] Error starting recognition', error);
      this.isRecording = false;
      throw new Error('Failed to start speech recognition');
    }
  }

  async stopRecognition(): Promise<SpeechRecognitionResult> {
    if (!Voice || !supportsSpeechToText) {
      return { transcript: '', confidence: 0, isFinal: true };
    }

    if (!this.isRecording) {
      this.logWarn('[Speech] Not currently recording');
      return {
        transcript: '',
        confidence: 0.0,
        isFinal: true,
      };
    }

    try {
      this.logDebug('[Speech] Stopping recognition');

      await Voice.stop();
      this.isRecording = false;

      // Get final transcript
      const transcript = this.results.join(' ').trim();
      const confidence = transcript.length > 0 ? 0.85 : 0.0;

      // Never log transcripts.
      this.logDebug(`[Speech] Final transcript ready (confidence: ${confidence})`);

      return {
        transcript,
        confidence,
        isFinal: true,
      };
    } catch (error) {
      this.logError('[Speech] Error stopping recognition', error);
      this.isRecording = false;
      throw new Error('Failed to stop speech recognition');
    }
  }

  async cancelRecognition(): Promise<void> {
    if (!Voice || !supportsSpeechToText) {
      return;
    }

    if (!this.isRecording) {
      return;
    }

    try {
      this.logDebug('[Speech] Cancelling recognition');

      await Voice.cancel();
      this.isRecording = false;
      this.results = [];

      this.logDebug('[Speech] Recognition cancelled');
    } catch (error) {
      this.logError('[Speech] Error cancelling recognition', error);
      this.isRecording = false;
    }
  }

  async isAvailable(): Promise<boolean> {
    if (!Voice || !supportsSpeechToText) {
      return false;
    }

    try {
      const available = await Voice.isAvailable();
      if (typeof available === 'number') {
        return available === 1;
      }
      return !!available;
    } catch (error) {
      this.logError('[Speech] Error checking availability', error);
      return false;
    }
  }

  async getSupportedLanguages(): Promise<string[]> {
    if (!Voice) return Object.values(this.languageMap);
    try {
      const voiceWithLanguages = Voice as unknown as {
        getSupportedLanguages?: () => Promise<string[] | undefined>;
      };

      if (typeof voiceWithLanguages.getSupportedLanguages !== 'function') {
        return Object.values(this.languageMap);
      }

      const languages = await voiceWithLanguages.getSupportedLanguages();
      this.logDebug('[Speech] Supported languages loaded');
      return languages || [];
    } catch (error) {
      this.logError('[Speech] Error getting supported languages', error);
      return Object.values(this.languageMap);
    }
  }

  // Event handlers
  private onSpeechStart(_event: unknown): void {
    // Do not log raw events.
    this.logDebug('[Speech] Speech started');
  }

  private onSpeechEnd(_event: unknown): void {
    // Do not log raw events.
    this.logDebug('[Speech] Speech ended');
    this.isRecording = false;
  }

  private onSpeechResults(event: unknown): void {
    // Do not log raw events.
    this.logDebug('[Speech] Final results received');

    const maybeEvent = event as { value?: unknown };
    if (Array.isArray(maybeEvent.value)) {
      this.results = maybeEvent.value.filter((v): v is string => typeof v === 'string');
    }
  }

  private onSpeechPartialResults(event: unknown): void {
    // Do not log raw events.
    this.logDebug('[Speech] Partial results received');

    const maybeEvent = event as { value?: unknown };
    if (Array.isArray(maybeEvent.value)) {
      // Update partial results for real-time display
      this.results = maybeEvent.value.filter((v): v is string => typeof v === 'string');
    }
  }

  private onSpeechError(event: unknown): void {
    this.logError('[Speech] Speech error', event);
    this.isRecording = false;

    // Parse error type for UX-friendly handling
    this.lastError = this.parseErrorType(event);
  }

  /**
   * Parse native speech error into typed error
   * @security No PII in error messages
   */
  private parseErrorType(event: unknown): SpeechError {
    const maybeEvent = event as {
      error?: { code?: string; message?: string };
      code?: string;
      message?: string;
    };
    const code = maybeEvent.error?.code || maybeEvent.code || '';
    const message = maybeEvent.error?.message || maybeEvent.message || '';

    // Common error codes across iOS/Android/Windows
    // 1 = Network timeout
    // 2 = Network error
    // 3 = Audio recording error
    // 4 = Server error
    // 5 = Client error
    // 6 = Speech timeout
    // 7 = No match
    // 8 = Recognizer busy
    // 9 = Insufficient permissions

    const lowerMessage = (code + message).toLowerCase();

    if (
      lowerMessage.includes('permission') ||
      lowerMessage.includes('9') ||
      lowerMessage.includes('denied')
    ) {
      return {
        type: 'permission_denied',
        message:
          'Microphone permission denied. Please enable microphone access in system settings.',
        originalError: event,
      };
    }

    if (
      lowerMessage.includes('network') ||
      lowerMessage.includes('1') ||
      lowerMessage.includes('2') ||
      lowerMessage.includes('4')
    ) {
      return {
        type: 'network_error',
        message: 'Network error. Please check your internet connection.',
        originalError: event,
      };
    }

    if (
      lowerMessage.includes('no match') ||
      lowerMessage.includes('7') ||
      lowerMessage.includes('no speech')
    ) {
      return {
        type: 'no_match',
        message: 'No speech detected. Please try speaking more clearly.',
        originalError: event,
      };
    }

    if (lowerMessage.includes('busy') || lowerMessage.includes('8')) {
      return {
        type: 'busy',
        message: 'Speech recognizer is busy. Please wait and try again.',
        originalError: event,
      };
    }

    if (lowerMessage.includes('not available') || lowerMessage.includes('unavailable')) {
      return {
        type: 'not_available',
        message: 'Speech recognition not available on this device.',
        originalError: event,
      };
    }

    return {
      type: 'unknown',
      message: 'An error occurred during speech recognition.',
      originalError: event,
    };
  }

  /**
   * Get last error for UI display
   */
  getLastError(): SpeechError | null {
    return this.lastError;
  }

  /**
   * Clear last error
   */
  clearError(): void {
    this.lastError = null;
  }

  /**
   * Get current recording status
   */
  isCurrentlyRecording(): boolean {
    return this.isRecording;
  }

  /**
   * Get partial results (for real-time display)
   */
  getPartialResults(): string {
    return this.results.join(' ').trim();
  }

  /**
   * Cleanup resources
   */
  async destroy(): Promise<void> {
    if (!Voice) {
      return;
    }
    try {
      if (this.isRecording) {
        await this.cancelRecognition();
      }

      Voice.removeAllListeners();
      await Voice.destroy();

      this.logDebug('[Speech] Service destroyed');
    } catch (error) {
      this.logError('[Speech] Error destroying service', error);
    }
  }

  /**
   * Process and clean transcript
   */
  cleanTranscript(transcript: string): string {
    return transcript
      .trim()
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/[.,!?]+$/, ''); // Remove trailing punctuation
  }

  /**
   * Split long transcript into sentences
   */
  splitIntoSentences(transcript: string): string[] {
    return transcript
      .split(/[.!?]+/)
      .map(s => s.trim())
      .filter(s => s.length > 0);
  }

  /**
   * Check if transcript contains medical keywords (for validation)
   */
  containsMedicalKeywords(transcript: string, language: string = 'de'): boolean {
    const medicalKeywords: Record<string, string[]> = {
      de: [
        'schmerz',
        'fieber',
        'kopf',
        'bauch',
        'herz',
        'lunge',
        'allergie',
        'medikament',
        'operation',
        'blut',
        'druck',
        'diabetes',
        'krebs',
        'krankheit',
        'symptom',
        'beschwerden',
      ],
      en: [
        'pain',
        'fever',
        'head',
        'stomach',
        'heart',
        'lung',
        'allergy',
        'medication',
        'surgery',
        'blood',
        'pressure',
        'diabetes',
        'cancer',
        'disease',
        'symptom',
        'complaint',
      ],
    };

    const keywords = medicalKeywords[language] || medicalKeywords.de;
    const lowerTranscript = transcript.toLowerCase();

    return keywords.some(keyword => lowerTranscript.includes(keyword));
  }

  // ================== Static Singleton Methods ==================
  // These provide a simplified API for components that don't manage their own instance

  private static instance: SystemSpeechService | null = null;
  private static listeners: {
    onResult?: (text: string) => void;
    onError?: (error: string) => void;
    onEnd?: () => void;
  } = {};

  private static getInstance(): SystemSpeechService {
    if (!SystemSpeechService.instance) {
      SystemSpeechService.instance = new SystemSpeechService();
    }
    return SystemSpeechService.instance;
  }

  /**
   * Static: Check if speech recognition is available
   */
  static async isAvailable(): Promise<boolean> {
    return SystemSpeechService.getInstance().isAvailable();
  }

  /**
   * Static: Start listening with callbacks
   */
  static async startListening(options: {
    onResult: (text: string) => void;
    onError: (error: string) => void;
    onEnd: () => void;
    language?: string;
  }): Promise<void> {
    if (!Voice || !supportsSpeechToText) {
      options.onError('Speech recognition not available on this platform');
      return;
    }

    const instance = SystemSpeechService.getInstance();

    // Store callbacks
    SystemSpeechService.listeners = {
      onResult: options.onResult,
      onError: options.onError,
      onEnd: options.onEnd,
    };

    // Set up result forwarding
    Voice.onSpeechResults = event => {
      const results = event as { value?: string[] };
      if (results.value && results.value.length > 0) {
        SystemSpeechService.listeners.onResult?.(results.value[0]);
      }
    };

    Voice.onSpeechError = event => {
      const errorEvent = event as { error?: { message?: string } };
      SystemSpeechService.listeners.onError?.(
        errorEvent.error?.message || 'Speech recognition error',
      );
    };

    Voice.onSpeechEnd = () => {
      SystemSpeechService.listeners.onEnd?.();
    };

    try {
      await instance.startRecognition(options.language || 'de');
    } catch (error) {
      SystemSpeechService.listeners.onError?.(
        error instanceof Error ? error.message : 'Failed to start speech recognition',
      );
    }
  }

  /**
   * Static: Stop listening
   */
  static async stopListening(): Promise<void> {
    const instance = SystemSpeechService.getInstance();
    try {
      await instance.stopRecognition();
      SystemSpeechService.listeners.onEnd?.();
    } catch {
      // Ignore errors during stop
    }
    SystemSpeechService.listeners = {};
  }
}
