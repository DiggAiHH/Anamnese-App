/**
 * OCR Service Interface
 * Defines contract for optical character recognition services
 * DSGVO-compliant: All implementations must process data locally
 */
export interface IOCRService {
  /**
   * Perform OCR on an image
   * @param imagePath - Local file path to the image
   * @param language - Language code (ISO 639-1 or 639-2)
   * @returns OCR result with text, confidence, and blocks
   */
  performOCR(
    imagePath: string,
    language?: string
  ): Promise<{
    text: string;
    confidence: number;
    language: string;
    blocks: Array<{
      text: string;
      confidence: number;
      bbox: { x: number; y: number; width: number; height: number };
    }>;
  }>;

  /**
   * Perform OCR with automatic language detection
   */
  performOCRWithAutoDetect(imagePath: string): Promise<{
    text: string;
    confidence: number;
    language: string;
    blocks: Array<{
      text: string;
      confidence: number;
      bbox: { x: number; y: number; width: number; height: number };
    }>;
  }>;

  /**
   * Extract specific fields from OCR result
   * @param imagePath - Local file path to the image
   * @param fieldPatterns - Map of field names to regex patterns
   */
  extractFields(
    imagePath: string,
    fieldPatterns: Record<string, RegExp>
  ): Promise<Record<string, string>>;

  /**
   * Check if OCR service is available on device
   */
  isAvailable(): Promise<boolean>;

  /**
   * Get list of supported languages
   */
  getSupportedLanguages(): string[];
}
