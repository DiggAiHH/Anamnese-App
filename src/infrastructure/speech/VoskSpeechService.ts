import Voice from '@react-native-voice/voice';

export interface SpeechRecognitionResult {
  transcript: string;
  confidence: number;
  isFinal: boolean;
}

export interface ISpeechService {
  startRecognition(language?: string): Promise<void>;
  stopRecognition(): Promise<SpeechRecognitionResult>;
  cancelRecognition(): Promise<void>;
  isAvailable(): Promise<boolean>;
  getSupportedLanguages(): Promise<string[]>;
}

export class VoskSpeechService implements ISpeechService {
  private isRecording: boolean = false;
  private results: string[] = [];
  private currentLanguage: string = 'de-DE';

  private readonly languageMap: Record<string, string> = {
    de: 'de-DE',
    en: 'en-US',
    fr: 'fr-FR',
    es: 'es-ES',
    it: 'it-IT',
    tr: 'tr-TR',
    pl: 'pl-PL',
    ru: 'ru-RU',
    ar: 'ar-SA',
    zh: 'zh-CN',
    pt: 'pt-PT',
    nl: 'nl-NL',
    uk: 'uk-UA',
    fa: 'fa-IR',
    ja: 'ja-JP',
    hi: 'hi-IN',
  };

  constructor() {
    this.setupListeners();
  }

  private setupListeners(): void {
    Voice.onSpeechStart = this.onSpeechStart.bind(this);
    Voice.onSpeechEnd = this.onSpeechEnd.bind(this);
    Voice.onSpeechResults = this.onSpeechResults.bind(this);
    Voice.onSpeechPartialResults = this.onSpeechPartialResults.bind(this);
    Voice.onSpeechError = this.onSpeechError.bind(this);
  }

  async startRecognition(language: string = 'de'): Promise<void> {
    if (this.isRecording) {
      console.warn('[Speech] Already recording');
      return;
    }

    try {
      // Map app language to voice recognition language
      this.currentLanguage = this.languageMap[language] || 'de-DE';

      console.log(`[Speech] Starting recognition with language: ${this.currentLanguage}`);

      // Clear previous results
      this.results = [];

      // Start voice recognition
      await Voice.start(this.currentLanguage);
      this.isRecording = true;

      console.log('[Speech] Recognition started');
    } catch (error) {
      console.error('[Speech] Error starting recognition:', error);
      this.isRecording = false;
      throw new Error(`Failed to start speech recognition: ${error}`);
    }
  }

  async stopRecognition(): Promise<SpeechRecognitionResult> {
    if (!this.isRecording) {
      console.warn('[Speech] Not currently recording');
      return {
        transcript: '',
        confidence: 0.0,
        isFinal: true,
      };
    }

    try {
      console.log('[Speech] Stopping recognition');
      
      await Voice.stop();
      this.isRecording = false;

      // Get final transcript
      const transcript = this.results.join(' ').trim();
      const confidence = transcript.length > 0 ? 0.85 : 0.0;

      console.log(`[Speech] Final transcript: "${transcript}" (confidence: ${confidence})`);

      return {
        transcript,
        confidence,
        isFinal: true,
      };
    } catch (error) {
      console.error('[Speech] Error stopping recognition:', error);
      this.isRecording = false;
      throw new Error(`Failed to stop speech recognition: ${error}`);
    }
  }

  async cancelRecognition(): Promise<void> {
    if (!this.isRecording) {
      return;
    }

    try {
      console.log('[Speech] Cancelling recognition');
      
      await Voice.cancel();
      this.isRecording = false;
      this.results = [];

      console.log('[Speech] Recognition cancelled');
    } catch (error) {
      console.error('[Speech] Error cancelling recognition:', error);
      this.isRecording = false;
    }
  }

  async isAvailable(): Promise<boolean> {
    try {
      const available = await Voice.isAvailable();
      if (typeof available === 'number') {
        return available === 1;
      }
      return !!available;
    } catch (error) {
      console.error('[Speech] Error checking availability:', error);
      return false;
    }
  }

  async getSupportedLanguages(): Promise<string[]> {
    try {
      if (typeof Voice.getSupportedLanguages !== 'function') {
        return Object.values(this.languageMap);
      }

      const languages = await Voice.getSupportedLanguages();
      console.log('[Speech] Supported languages:', languages);
      return languages || [];
    } catch (error) {
      console.error('[Speech] Error getting supported languages:', error);
      return Object.values(this.languageMap);
    }
  }

  // Event handlers
  private onSpeechStart(event: any): void {
    console.log('[Speech] Speech started', event);
  }

  private onSpeechEnd(event: any): void {
    console.log('[Speech] Speech ended', event);
    this.isRecording = false;
  }

  private onSpeechResults(event: any): void {
    console.log('[Speech] Final results:', event);
    
    if (event.value && Array.isArray(event.value)) {
      this.results = event.value;
    }
  }

  private onSpeechPartialResults(event: any): void {
    console.log('[Speech] Partial results:', event);
    
    if (event.value && Array.isArray(event.value)) {
      // Update partial results for real-time display
      this.results = event.value;
    }
  }

  private onSpeechError(event: any): void {
    console.error('[Speech] Speech error:', event);
    this.isRecording = false;
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
    try {
      if (this.isRecording) {
        await this.cancelRecognition();
      }

      Voice.removeAllListeners();
      await Voice.destroy();

      console.log('[Speech] Service destroyed');
    } catch (error) {
      console.error('[Speech] Error destroying service:', error);
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
        'schmerz', 'fieber', 'kopf', 'bauch', 'herz', 'lunge',
        'allergie', 'medikament', 'operation', 'blut', 'druck',
        'diabetes', 'krebs', 'krankheit', 'symptom', 'beschwerden',
      ],
      en: [
        'pain', 'fever', 'head', 'stomach', 'heart', 'lung',
        'allergy', 'medication', 'surgery', 'blood', 'pressure',
        'diabetes', 'cancer', 'disease', 'symptom', 'complaint',
      ],
    };

    const keywords = medicalKeywords[language] || medicalKeywords.de;
    const lowerTranscript = transcript.toLowerCase();

    return keywords.some(keyword => lowerTranscript.includes(keyword));
  }
}
