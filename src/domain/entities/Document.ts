/**
 * Document Entity - repräsentiert ein hochgeladenes Dokument (z.B. Versichertenkarte)
 * 
 * DSGVO Requirements:
 * - Verschlüsselter Speicher
 * - OCR-Verarbeitung lokal (keine externen APIs)
 * - Audit Trail für Zugriffe
 */

import { z } from 'zod';

export const DocumentSchema = z.object({
  id: z.string().uuid(),
  patientId: z.string().uuid(),
  questionnaireId: z.string().uuid().optional(),
  // Dokument-Metadaten
  type: z.enum(['insurance_card', 'id_document', 'medical_report', 'prescription', 'other']),
  mimeType: z.string(), // image/jpeg, image/png, application/pdf
  fileName: z.string(),
  fileSize: z.number(), // in bytes
  // Verschlüsselter File Path (lokaler Storage)
  encryptedFilePath: z.string(),
  // Optional: OCR Ergebnisse (verschlüsselt)
  ocrData: z
    .object({
      text: z.string(),
      confidence: z.number().min(0).max(1),
      processedAt: z.date(),
      language: z.string(),
    })
    .optional(),
  // Timestamps
  uploadedAt: z.date(),
  updatedAt: z.date(),
  // GDPR Consent für OCR
  ocrConsentGranted: z.boolean().default(false),
  // Audit Log
  auditLog: z.array(
    z.object({
      action: z.enum(['uploaded', 'viewed', 'ocr_processed', 'deleted']),
      timestamp: z.date(),
      details: z.string().optional(),
    }),
  ),
});

export type Document = z.infer<typeof DocumentSchema>;

/**
 * Document Entity
 */
export class DocumentEntity {
  private constructor(private readonly data: Document) {
    DocumentSchema.parse(data);
  }

  static create(params: {
    patientId: string;
    questionnaireId?: string;
    type: Document['type'];
    mimeType: string;
    fileName: string;
    fileSize: number;
    encryptedFilePath: string;
  }): DocumentEntity {
    const id = crypto.randomUUID();
    const now = new Date();

    return new DocumentEntity({
      id,
      patientId: params.patientId,
      questionnaireId: params.questionnaireId,
      type: params.type,
      mimeType: params.mimeType,
      fileName: params.fileName,
      fileSize: params.fileSize,
      encryptedFilePath: params.encryptedFilePath,
      uploadedAt: now,
      updatedAt: now,
      ocrConsentGranted: false,
      auditLog: [
        {
          action: 'uploaded',
          timestamp: now,
          details: `Document ${params.fileName} uploaded`,
        },
      ],
    });
  }

  // Getters
  get id(): string {
    return this.data.id;
  }

  get patientId(): string {
    return this.data.patientId;
  }

  get questionnaireId(): string | undefined {
    return this.data.questionnaireId;
  }

  get type(): Document['type'] {
    return this.data.type;
  }

  get mimeType(): string {
    return this.data.mimeType;
  }

  get fileName(): string {
    return this.data.fileName;
  }

  get fileSize(): number {
    return this.data.fileSize;
  }

  get encryptedFilePath(): string {
    return this.data.encryptedFilePath;
  }

  get ocrData(): Document['ocrData'] {
    return this.data.ocrData;
  }

  get ocrConsentGranted(): boolean {
    return this.data.ocrConsentGranted;
  }

  get uploadedAt(): Date {
    return this.data.uploadedAt;
  }

  get updatedAt(): Date {
    return this.data.updatedAt;
  }

  get auditLog(): Document['auditLog'] {
    return this.data.auditLog;
  }

  // Business Logic

  /**
   * OCR Consent erteilen
   */
  grantOCRConsent(): DocumentEntity {
    return new DocumentEntity({
      ...this.data,
      ocrConsentGranted: true,
      updatedAt: new Date(),
    });
  }

  /**
   * OCR Ergebnisse hinzufügen
   */
  addOCRData(params: {
    text: string;
    confidence: number;
    language: string;
  }): DocumentEntity {
    if (!this.data.ocrConsentGranted) {
      throw new Error('OCR consent not granted');
    }

    const now = new Date();

    return new DocumentEntity({
      ...this.data,
      ocrData: {
        text: params.text,
        confidence: params.confidence,
        processedAt: now,
        language: params.language,
      },
      updatedAt: now,
      auditLog: [
        ...this.data.auditLog,
        {
          action: 'ocr_processed',
          timestamp: now,
          details: `OCR processed with ${(params.confidence * 100).toFixed(1)}% confidence`,
        },
      ],
    });
  }

  /**
   * Audit Log hinzufügen
   */
  addAuditLog(action: Document['auditLog'][0]['action'], details?: string): DocumentEntity {
    return new DocumentEntity({
      ...this.data,
      auditLog: [
        ...this.data.auditLog,
        {
          action,
          timestamp: new Date(),
          details,
        },
      ],
    });
  }

  /**
   * Prüft ob OCR-Verarbeitung möglich ist
   */
  canProcessOCR(): boolean {
    return (
      this.data.ocrConsentGranted &&
      (this.data.mimeType === 'image/jpeg' ||
        this.data.mimeType === 'image/png' ||
        this.data.mimeType === 'application/pdf')
    );
  }

  /**
   * Prüft ob OCR-Ergebnisse vertrauenswürdig sind (>= 70% confidence)
   */
  hasReliableOCR(): boolean {
    return this.data.ocrData !== undefined && this.data.ocrData.confidence >= 0.7;
  }

  /**
   * File-Size in MB
   */
  getFileSizeInMB(): number {
    return this.data.fileSize / (1024 * 1024);
  }

  /**
   * Zu Plain Object konvertieren
   */
  toJSON(): Document {
    return {
      ...this.data,
    };
  }

  /**
   * Rehydrate entity from persistence layer (DB rows)
   */
  static fromPersistence(data: {
    id: string;
    patientId: string;
    questionnaireId?: string | null;
    type: Document['type'];
    mimeType: string;
    fileName: string;
    fileSize: number;
    encryptedFilePath: string;
    ocrData?: Document['ocrData'] | string | null;
    ocrConsentGranted: boolean;
    uploadedAt: number | string | Date;
    updatedAt: number | string | Date;
    auditLog: Document['auditLog'] | string;
  }): DocumentEntity {
    const parseDate = (value: number | string | Date | undefined): Date =>
      value instanceof Date ? value : new Date(value ?? Date.now());

    const rawAuditLog = typeof data.auditLog === 'string' ? JSON.parse(data.auditLog) : data.auditLog;

    return new DocumentEntity({
      id: data.id,
      patientId: data.patientId,
      questionnaireId: data.questionnaireId ?? undefined,
      type: data.type,
      mimeType: data.mimeType,
      fileName: data.fileName,
      fileSize: data.fileSize,
      encryptedFilePath: data.encryptedFilePath,
      ocrData: data.ocrData
        ? typeof data.ocrData === 'string'
          ? JSON.parse(data.ocrData)
          : data.ocrData
        : undefined,
      uploadedAt: parseDate(data.uploadedAt),
      updatedAt: parseDate(data.updatedAt),
      ocrConsentGranted: data.ocrConsentGranted,
      auditLog: (rawAuditLog ?? []).map((entry: any) => ({
        ...entry,
        timestamp: parseDate(entry.timestamp),
      })),
    });
  }

  /**
   * Von Plain Object erstellen
   */
  static fromJSON(json: Document): DocumentEntity {
    return new DocumentEntity({
      ...json,
      uploadedAt: new Date(json.uploadedAt),
      updatedAt: new Date(json.updatedAt),
      ocrData: json.ocrData
        ? {
            ...json.ocrData,
            processedAt: new Date(json.ocrData.processedAt),
          }
        : undefined,
      auditLog: json.auditLog.map(l => ({
        ...l,
        timestamp: new Date(l.timestamp),
      })),
    });
  }
}
