/**
 * Patient Entity - repräsentiert einen Patienten (DSGVO-konform)
 * 
 * Privacy by Design:
 * - Minimale Datenspeicherung
 * - Verschlüsselung aller PII (Personally Identifiable Information)
 * - Audit Logging für DSGVO Art. 30
 */

import { z } from 'zod';

export const PatientSchema = z.object({
  id: z.string().uuid(),
  // Verschlüsselte Felder (PII)
  encryptedData: z.object({
    firstName: z.string(),
    lastName: z.string(),
    birthDate: z.string(), // ISO 8601
    insurance: z.string().optional(),
    insuranceNumber: z.string().optional(),
  }),
  // Unverschlüsselte Metadaten
  createdAt: z.date(),
  updatedAt: z.date(),
  language: z.enum([
    'de', 'en', 'fr', 'es', 'it', 'tr', 'pl', 'ru', 'ar', 'zh',
    'pt', 'nl', 'uk', 'fa', 'ur', 'sq', 'ro', 'hi', 'ja',
  ]),
  // GDPR Consent Tracking
  gdprConsents: z.array(z.object({
    type: z.enum([
      'data_processing',
      'data_storage',
      'gdt_export',
      'ocr_processing',
      'voice_recognition',
    ]),
    granted: z.boolean(),
    timestamp: z.date(),
    version: z.string(), // Version der Datenschutzerklärung
  })),
  // Audit Log für DSGVO Art. 30
  auditLog: z.array(z.object({
    action: z.enum(['created', 'updated', 'accessed', 'exported', 'deleted']),
    timestamp: z.date(),
    details: z.string().optional(),
  })),
});

export type Patient = z.infer<typeof PatientSchema>;

/**
 * Patient Factory - erstellt neue Patient Instanz mit Validierung
 * 
 * @throws ZodError wenn Validierung fehlschlägt
 */
export class PatientEntity {
  private constructor(private readonly data: Patient) {
    // Validierung via Zod
    PatientSchema.parse(data);
  }

  static create(params: {
    firstName: string;
    lastName: string;
    birthDate: string;
    language: Patient['language'];
    insurance?: string;
    insuranceNumber?: string;
  }): PatientEntity {
    const id = crypto.randomUUID();
    const now = new Date();

    return new PatientEntity({
      id,
      encryptedData: {
        firstName: params.firstName,
        lastName: params.lastName,
        birthDate: params.birthDate,
        insurance: params.insurance,
        insuranceNumber: params.insuranceNumber,
      },
      createdAt: now,
      updatedAt: now,
      language: params.language,
      gdprConsents: [],
      auditLog: [
        {
          action: 'created',
          timestamp: now,
          details: 'Patient created',
        },
      ],
    });
  }

  // Getter
  get id(): string {
    return this.data.id;
  }

  get encryptedData(): Patient['encryptedData'] {
    return this.data.encryptedData;
  }

  get language(): Patient['language'] {
    return this.data.language;
  }

  get gdprConsents(): Patient['gdprConsents'] {
    return this.data.gdprConsents;
  }

  get auditLog(): Patient['auditLog'] {
    return this.data.auditLog;
  }

  get createdAt(): Date {
    return this.data.createdAt;
  }

  get updatedAt(): Date {
    return this.data.updatedAt;
  }

  // Business Logic Methods

  /**
   * GDPR Consent hinzufügen (Art. 6, 7 DSGVO)
   */
  addConsent(
    type: Patient['gdprConsents'][0]['type'],
    granted: boolean,
    version: string,
  ): PatientEntity {
    return new PatientEntity({
      ...this.data,
      gdprConsents: [
        ...this.data.gdprConsents,
        {
          type,
          granted,
          timestamp: new Date(),
          version,
        },
      ],
      updatedAt: new Date(),
    });
  }

  /**
   * Audit Log Eintrag hinzufügen (DSGVO Art. 30)
   */
  addAuditLog(action: Patient['auditLog'][0]['action'], details?: string): PatientEntity {
    return new PatientEntity({
      ...this.data,
      auditLog: [
        ...this.data.auditLog,
        {
          action,
          timestamp: new Date(),
          details,
        },
      ],
      updatedAt: new Date(),
    });
  }

  /**
   * Prüft ob spezifischer Consent erteilt wurde
   */
  hasConsent(type: Patient['gdprConsents'][0]['type']): boolean {
    const consent = this.data.gdprConsents
      .filter(c => c.type === type)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())[0];

    return consent?.granted ?? false;
  }

  /**
   * Sprache ändern
   */
  changeLanguage(language: Patient['language']): PatientEntity {
    return new PatientEntity({
      ...this.data,
      language,
      updatedAt: new Date(),
    });
  }

  /**
   * Zu Plain Object konvertieren (für Persistierung)
   */
  toJSON(): Patient {
    return {
      ...this.data,
    };
  }

  /**
   * Von Plain Object erstellen (nach Deserialisierung)
   */
  static fromJSON(json: Patient): PatientEntity {
    return new PatientEntity({
      ...json,
      createdAt: new Date(json.createdAt),
      updatedAt: new Date(json.updatedAt),
      gdprConsents: json.gdprConsents.map(c => ({
        ...c,
        timestamp: new Date(c.timestamp),
      })),
      auditLog: json.auditLog.map(l => ({
        ...l,
        timestamp: new Date(l.timestamp),
      })),
    });
  }
}
