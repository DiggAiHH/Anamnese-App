/**
 * UploadLabReportUseCase Unit Tests
 * Tests orchestration logic with mocked OCR service.
 */

import { uploadLabReport } from '../../src/application/use-cases/UploadLabReportUseCase';
import type { IOCRService } from '../../src/domain/repositories/IOCRService';

// Mock logger
jest.mock('../../src/shared/logger', () => ({
  logDebug: jest.fn(),
  logError: jest.fn(),
  logWarn: jest.fn(),
}));

const createMockOCRService = (overrides?: Partial<IOCRService>): IOCRService => ({
  performOCR: jest.fn().mockResolvedValue({
    text: 'Kreatinin   1.2  mg/dL   0.7-1.3',
    confidence: 0.92,
    language: 'deu',
    blocks: [],
  }),
  performOCRWithAutoDetect: jest.fn().mockResolvedValue({
    text: '',
    confidence: 0,
    language: 'eng',
    blocks: [],
  }),
  extractFields: jest.fn().mockResolvedValue({}),
  isAvailable: jest.fn().mockResolvedValue(true),
  getSupportedLanguages: jest.fn().mockReturnValue(['deu', 'eng']),
  ...overrides,
});

const baseInput = {
  filePath: '/tmp/lab_report.jpg',
  fileName: 'lab_report.jpg',
  mimeType: 'image/jpeg',
  fileSize: 1024000,
  patientId: '00000000-0000-0000-0000-000000000001',
  language: 'de',
};

describe('UploadLabReportUseCase', () => {
  it('should throw OCR_CONSENT_REQUIRED if consent not granted', async () => {
    const ocrService = createMockOCRService();

    await expect(
      uploadLabReport(baseInput, ocrService, false),
    ).rejects.toThrow('OCR_CONSENT_REQUIRED');

    expect(ocrService.performOCR).not.toHaveBeenCalled();
  });

  it('should throw OCR_NOT_AVAILABLE if OCR service is unavailable', async () => {
    const ocrService = createMockOCRService({
      isAvailable: jest.fn().mockResolvedValue(false),
    });

    await expect(
      uploadLabReport(baseInput, ocrService, true),
    ).rejects.toThrow('OCR_NOT_AVAILABLE');
  });

  it('should process OCR and return parsed lab values', async () => {
    const ocrService = createMockOCRService();

    const result = await uploadLabReport(baseInput, ocrService, true);

    expect(ocrService.performOCR).toHaveBeenCalledWith('/tmp/lab_report.jpg', 'de');
    expect(result.parseResult.ocrConfidence).toBe(0.92);
    expect(result.parseResult.language).toBe('deu');
    expect(result.parseResult.values.length).toBeGreaterThanOrEqual(1);

    // Check creatinine was parsed
    const creatinine = result.parseResult.values.find(v => v.type === 'creatinine');
    expect(creatinine).toBeDefined();
    expect(creatinine?.value).toBe(1.2);
  });

  it('should create a document entity with medical_report type', async () => {
    const ocrService = createMockOCRService();

    const result = await uploadLabReport(baseInput, ocrService, true);

    expect(result.document.type).toBe('medical_report');
    expect(result.document.fileName).toBe('lab_report.jpg');
    expect(result.document.ocrConsentGranted).toBe(true);
    expect(result.document.ocrData).toBeDefined();
    expect(result.document.ocrData?.confidence).toBe(0.92);
  });

  it('should throw OCR_PROCESSING_FAILED on OCR error', async () => {
    const ocrService = createMockOCRService({
      performOCR: jest.fn().mockRejectedValue(new Error('Tesseract failed')),
    });

    await expect(
      uploadLabReport(baseInput, ocrService, true),
    ).rejects.toThrow('OCR_PROCESSING_FAILED');
  });

  it('should handle empty OCR result with no values', async () => {
    const ocrService = createMockOCRService({
      performOCR: jest.fn().mockResolvedValue({
        text: 'No recognizable text',
        confidence: 0.3,
        language: 'deu',
        blocks: [],
      }),
    });

    const result = await uploadLabReport(baseInput, ocrService, true);

    expect(result.parseResult.values).toHaveLength(0);
    expect(result.parseResult.ocrConfidence).toBe(0.3);
  });

  it('should use default language "de" if not provided', async () => {
    const ocrService = createMockOCRService();
    const inputNoLang = { ...baseInput };
    delete (inputNoLang as { language?: string }).language;

    await uploadLabReport(inputNoLang, ocrService, true);

    expect(ocrService.performOCR).toHaveBeenCalledWith('/tmp/lab_report.jpg', 'de');
  });
});
