import TesseractOcr, { LANG_ENGLISH, LANG_GERMAN } from 'react-native-tesseract-ocr';

export interface OCRResult {
  text: string;
  confidence: number;
  language: string;
}

export interface IOCRService {
  processImage(imagePath: string, language?: string): Promise<OCRResult>;
  getSupportedLanguages(): string[];
}

export class TesseractOCRService implements IOCRService {
  private readonly languageMap: Record<string, string> = {
    de: LANG_GERMAN,
    en: LANG_ENGLISH,
    fr: 'fra',
    es: 'spa',
    it: 'ita',
    tr: 'tur',
    pl: 'pol',
    ru: 'rus',
    ar: 'ara',
    zh: 'chi_sim',
    pt: 'por',
    nl: 'nld',
    uk: 'ukr',
    // Note: Not all languages supported by Tesseract
  };

  async processImage(imagePath: string, language: string = 'de'): Promise<OCRResult> {
    try {
      // Map app language code to Tesseract language code
      const tesseractLang = this.languageMap[language] || LANG_GERMAN;

      console.log(`[OCR] Processing image: ${imagePath} with language: ${tesseractLang}`);

      // Tesseract OCR configuration
      const tessOptions = {
        whitelist: null, // Allow all characters
        blacklist: null,
      };

      // Perform OCR
      const text = await TesseractOcr.recognize(
        imagePath,
        tesseractLang,
        tessOptions
      );

      // Tesseract doesn't provide confidence per result in react-native-tesseract-ocr
      // We estimate confidence based on text length and quality
      const confidence = this.estimateConfidence(text);

      console.log(`[OCR] Extracted text (${text.length} chars), confidence: ${confidence}`);

      return {
        text: text.trim(),
        confidence,
        language: tesseractLang,
      };
    } catch (error) {
      console.error('[OCR] Error processing image:', error);
      throw new Error(`OCR processing failed: ${error}`);
    }
  }

  getSupportedLanguages(): string[] {
    return Object.keys(this.languageMap);
  }

  private estimateConfidence(text: string): number {
    // Simple confidence estimation based on heuristics
    // In production, you might use more sophisticated methods

    if (!text || text.length === 0) {
      return 0.0;
    }

    let confidence = 0.5; // Base confidence

    // More text generally means better recognition
    if (text.length > 50) {
      confidence += 0.2;
    }

    // Check for common OCR errors
    const hasSpecialCharsOnly = /^[^a-zA-Z0-9]+$/.test(text);
    if (hasSpecialCharsOnly) {
      confidence -= 0.3;
    }

    // Check for reasonable word structure
    const words = text.split(/\s+/);
    const avgWordLength = words.reduce((sum, w) => sum + w.length, 0) / words.length;
    
    if (avgWordLength > 3 && avgWordLength < 15) {
      confidence += 0.2;
    } else {
      confidence -= 0.1;
    }

    // Clamp between 0 and 1
    return Math.max(0.0, Math.min(1.0, confidence));
  }

  /**
   * Process multiple images in batch
   */
  async processImages(imagePaths: string[], language: string = 'de'): Promise<OCRResult[]> {
    const results: OCRResult[] = [];

    for (const imagePath of imagePaths) {
      try {
        const result = await this.processImage(imagePath, language);
        results.push(result);
      } catch (error) {
        console.error(`[OCR] Failed to process image ${imagePath}:`, error);
        // Continue with next image
        results.push({
          text: '',
          confidence: 0.0,
          language,
        });
      }
    }

    return results;
  }

  /**
   * Extract specific field from OCR text using pattern matching
   */
  extractField(ocrText: string, fieldPattern: RegExp): string | null {
    const match = ocrText.match(fieldPattern);
    return match ? match[1]?.trim() : null;
  }

  /**
   * Extract insurance card data (German Krankenversicherungskarte)
   */
  extractInsuranceCardData(ocrText: string): {
    insuranceNumber?: string;
    insuranceName?: string;
    validUntil?: string;
  } {
    const data: {
      insuranceNumber?: string;
      insuranceName?: string;
      validUntil?: string;
    } = {};

    // Insurance number pattern (10 digits)
    const insuranceNumberMatch = ocrText.match(/\b(\d{10})\b/);
    if (insuranceNumberMatch) {
      data.insuranceNumber = insuranceNumberMatch[1];
    }

    // Insurance company names (common German insurances)
    const insuranceNames = [
      'AOK', 'Techniker', 'Barmer', 'DAK', 'KKH', 'IKK',
      'BKK', 'HKK', 'SBK', 'TK', 'Debeka', 'DKV',
    ];

    for (const name of insuranceNames) {
      const regex = new RegExp(name, 'i');
      if (regex.test(ocrText)) {
        data.insuranceName = name;
        break;
      }
    }

    // Valid until date (common formats: DD.MM.YYYY, MM/YYYY)
    const dateMatch = ocrText.match(/(\d{2})[./](\d{2})[./](\d{4})/);
    if (dateMatch) {
      data.validUntil = `${dateMatch[1]}.${dateMatch[2]}.${dateMatch[3]}`;
    }

    return data;
  }

  /**
   * Extract ID document data (Personalausweis/Reisepass)
   */
  extractIDDocumentData(ocrText: string): {
    documentNumber?: string;
    birthDate?: string;
    expiryDate?: string;
  } {
    const data: {
      documentNumber?: string;
      birthDate?: string;
      expiryDate?: string;
    } = {};

    // Document number pattern (varies by document type)
    const docNumberMatch = ocrText.match(/([A-Z0-9]{9,10})/);
    if (docNumberMatch) {
      data.documentNumber = docNumberMatch[1];
    }

    // Birth date (various formats)
    const birthDateMatch = ocrText.match(/(?:Geburt|Birth)[:\s]*(\d{2}[./]\d{2}[./]\d{4})/i);
    if (birthDateMatch) {
      data.birthDate = birthDateMatch[1];
    }

    // Expiry date
    const expiryMatch = ocrText.match(/(?:Gültig bis|Valid until|Expires)[:\s]*(\d{2}[./]\d{2}[./]\d{4})/i);
    if (expiryMatch) {
      data.expiryDate = expiryMatch[1];
    }

    return data;
  }
}
