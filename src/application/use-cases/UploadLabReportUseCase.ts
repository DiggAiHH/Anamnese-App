/**
 * Upload Lab Report Use Case
 * Orchestrates: file pick → OCR → parse lab values → return results.
 *
 * @security DSGVO Art. 9: Health data processing.
 * - Requires explicit OCR consent.
 * - All OCR processing is local (TesseractOCRService).
 * - No PII in logs.
 * - Audit trail via DocumentEntity.
 */

import { DocumentEntity } from '../../domain/entities/Document';
import type { IOCRService } from '../../domain/repositories/IOCRService';
import type { LabParseResult } from '../../domain/value-objects/LabValue';
import { parseLabValues } from '../../infrastructure/ocr/LabValueParser';
import { logDebug, logError } from '../../shared/logger';

export interface UploadLabReportInput {
  /** Local file path to the picked document */
  filePath: string;
  /** Original file name */
  fileName: string;
  /** MIME type (image/jpeg, image/png, application/pdf) */
  mimeType: string;
  /** File size in bytes */
  fileSize: number;
  /** Patient ID (surrogate UUID) */
  patientId: string;
  /** OCR language code (ISO 639-1, e.g. 'de') */
  language?: string;
}

export interface UploadLabReportOutput {
  /** Parsing result with extracted lab values */
  parseResult: LabParseResult;
  /** Document entity (for optional persistence) */
  document: DocumentEntity;
}

/**
 * Execute the lab report upload use case.
 *
 * Flow:
 * 1. Validate OCR consent is granted.
 * 2. Create DocumentEntity (type: 'medical_report').
 * 3. Perform OCR on the file.
 * 4. Parse OCR text for known lab values.
 * 5. Return parse result + document entity.
 *
 * @param input - Upload parameters
 * @param ocrService - OCR service implementation (injected)
 * @param ocrConsentGranted - Whether the user has granted OCR consent
 * @returns Parsed lab values and document entity
 * @throws Error if OCR consent not granted or OCR fails
 */
export async function uploadLabReport(
  input: UploadLabReportInput,
  ocrService: IOCRService,
  ocrConsentGranted: boolean,
): Promise<UploadLabReportOutput> {
  // 1. Validate OCR consent
  if (!ocrConsentGranted) {
    throw new Error('OCR_CONSENT_REQUIRED');
  }

  // 2. Validate OCR availability
  const isAvailable = await ocrService.isAvailable();
  if (!isAvailable) {
    throw new Error('OCR_NOT_AVAILABLE');
  }

  // 3. Create document entity
  let document = DocumentEntity.create({
    patientId: input.patientId,
    type: 'medical_report',
    mimeType: input.mimeType,
    fileName: input.fileName,
    fileSize: input.fileSize,
    encryptedFilePath: input.filePath,
  });

  // Grant OCR consent on the document
  document = document.grantOCRConsent();

  logDebug('[UploadLabReport] Starting OCR processing');

  // 4. Perform OCR
  let ocrResult: Awaited<ReturnType<IOCRService['performOCR']>>;
  try {
    ocrResult = await ocrService.performOCR(input.filePath, input.language ?? 'de');
  } catch (error) {
    logError('[UploadLabReport] OCR processing failed', error);
    throw new Error('OCR_PROCESSING_FAILED');
  }

  // 5. Add OCR data to document
  document = document.addOCRData({
    text: ocrResult.text,
    confidence: ocrResult.confidence,
    language: ocrResult.language,
  });

  logDebug(`[UploadLabReport] OCR complete, confidence: ${ocrResult.confidence}`);

  // 6. Parse lab values
  const values = parseLabValues(ocrResult.text, ocrResult.confidence);

  logDebug(`[UploadLabReport] Parsed ${values.length} lab values`);

  const parseResult: LabParseResult = {
    values,
    ocrConfidence: ocrResult.confidence,
    rawText: ocrResult.text,
    language: ocrResult.language,
  };

  return { parseResult, document };
}
