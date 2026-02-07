/**
 * DocumentRequest Domain Entity
 *
 * Represents a patient's request for documents (prescription, referral, sick note).
 * Based on Sanad architecture, adapted for offline-first encrypted mailto flow.
 *
 * @security All data is encrypted via EncryptionService before transmission.
 * @gdpr No PII is logged. Data minimization applies.
 */

/**
 * Types of documents that can be requested.
 */
export enum DocumentType {
  REZEPT = 'rezept',
  UEBERWEISUNG = 'ueberweisung',
  AU_BESCHEINIGUNG = 'au_bescheinigung',
  BESCHEINIGUNG = 'bescheinigung',
  SONSTIGE = 'sonstige',
}

/**
 * Priority of document request.
 */
export enum DocumentRequestPriority {
  NORMAL = 'normal',
  URGENT = 'urgent',
  EXPRESS = 'express',
}

/**
 * Status of a document request (for local tracking).
 */
export enum DocumentRequestStatus {
  DRAFT = 'draft',
  PENDING = 'pending',
  SENT = 'sent',
  CANCELLED = 'cancelled',
}

/**
 * Base interface for all document requests.
 */
export interface IDocumentRequest {
  id: string;
  documentType: DocumentType;
  title: string;
  description?: string;
  priority: DocumentRequestPriority;
  status: DocumentRequestStatus;
  additionalNotes?: string;
  createdAt: Date;
  updatedAt?: Date;
}

/**
 * Prescription (Rezept) request specific fields.
 */
export interface IPrescriptionRequest extends IDocumentRequest {
  documentType: DocumentType.REZEPT;
  medicationName: string;
  medicationDosage?: string;
  medicationQuantity?: number;
}

/**
 * Referral (Überweisung) request specific fields.
 */
export interface IReferralRequest extends IDocumentRequest {
  documentType: DocumentType.UEBERWEISUNG;
  referralSpecialty: string;
  referralReason?: string;
  preferredDoctor?: string;
}

/**
 * Sick note (AU-Bescheinigung) request specific fields.
 */
export interface ISickNoteRequest extends IDocumentRequest {
  documentType: DocumentType.AU_BESCHEINIGUNG;
  /** Start date in TT.MM.JJJJ format */
  auStartDate: string;
  /** End date in TT.MM.JJJJ format (optional) */
  auEndDate?: string;
  auReason?: string;
}

/**
 * General document request (certificate, etc).
 */
export interface IGeneralDocumentRequest extends IDocumentRequest {
  documentType: DocumentType.BESCHEINIGUNG | DocumentType.SONSTIGE;
  purpose?: string;
}

/**
 * Union type for all document request types.
 */
export type DocumentRequest =
  | IPrescriptionRequest
  | IReferralRequest
  | ISickNoteRequest
  | IGeneralDocumentRequest;

/**
 * Factory function to create a new document request.
 */
export function createDocumentRequest(
  type: DocumentType,
  title: string,
  priority: DocumentRequestPriority = DocumentRequestPriority.NORMAL,
): IDocumentRequest {
  return {
    id: generateRequestId(),
    documentType: type,
    title,
    priority,
    status: DocumentRequestStatus.DRAFT,
    createdAt: new Date(),
  };
}

/**
 * Generate a unique request ID.
 */
function generateRequestId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `req-${timestamp}-${random}`;
}

/**
 * Display labels for document types (used with i18n).
 */
export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  [DocumentType.REZEPT]: 'documentType.rezept',
  [DocumentType.UEBERWEISUNG]: 'documentType.ueberweisung',
  [DocumentType.AU_BESCHEINIGUNG]: 'documentType.au',
  [DocumentType.BESCHEINIGUNG]: 'documentType.bescheinigung',
  [DocumentType.SONSTIGE]: 'documentType.sonstige',
};

/**
 * Display labels for priority levels.
 */
export const PRIORITY_LABELS: Record<DocumentRequestPriority, string> = {
  [DocumentRequestPriority.NORMAL]: 'priority.normal',
  [DocumentRequestPriority.URGENT]: 'priority.urgent',
  [DocumentRequestPriority.EXPRESS]: 'priority.express',
};
