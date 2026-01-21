// This module used to contain a separate OCR service with a different
// (non-domain) interface shape. To keep a single contract and reduce confusion,
// we re-export the domain-conforming implementation.

export { TesseractOCRService } from '../services/TesseractOCRService';
export type { IOCRService } from '@domain/repositories/IOCRService';
