/**
 * Speech Recognition Service Interface
 * Defines contract for speech-to-text services
 * DSGVO-compliant: All implementations must process data locally
 */
export interface ISpeechService {
  /**
   * Start speech recognition
   * @param language - Language code (e.g., 'de-DE', 'en-US')
   * @param onResult - Callback for partial results
   * @param onFinal - Callback for final result with confidence
   * @param onError - Callback for errors
   */
  startRecognition(
    language?: string,
    onResult?: (text: string, isFinal: boolean) => void,
    onFinal?: (text: string, confidence: number) => void,
    onError?: (error: string) => void
  ): Promise<void>;

  /**
   * Stop speech recognition
   * @returns Final recognized text
   */
  stopRecognition(): Promise<string>;

  /**
   * Cancel speech recognition
   */
  cancelRecognition(): Promise<void>;

  /**
   * Check if currently recording
   */
  isCurrentlyRecording(): boolean;

  /**
   * Get recognized text
   */
  getRecognizedText(): string;

  /**
   * Check if speech recognition is available on device
   */
  isAvailable(): Promise<boolean>;

  /**
   * Get list of supported languages
   */
  getSupportedLanguages(): string[];

  /**
   * Destroy service and cleanup resources
   */
  destroy(): Promise<void>;
}
