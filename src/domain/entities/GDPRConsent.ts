/**
 * GDPR Consent Entity - repräsentiert DSGVO-konforme Einwilligungen
 * 
 * DSGVO Requirements:
 * - Art. 6, 7 DSGVO: Rechtmäßigkeit der Verarbeitung
 * - Art. 13 DSGVO: Informationspflichten
 * - Art. 21 DSGVO: Widerspruchsrecht
 */

import { z } from 'zod';

export const GDPRConsentSchema = z.object({
  id: z.string().uuid(),
  patientId: z.string().uuid(),
  // Consent Type
  type: z.enum([
    'data_processing', // Allgemeine Datenverarbeitung
    'data_storage', // Datenspeicherung (3 Jahre nach § 630f BGB)
    'gdt_export', // Export zu Praxissystem
    'ocr_processing', // OCR-Verarbeitung von Dokumenten
    'voice_recognition', // Spracherkennung
    'analytics', // Anonymisierte Analytics (falls gewünscht)
  ]),
  // Consent Status
  granted: z.boolean(),
  grantedAt: z.date().optional(),
  revokedAt: z.date().optional(),
  // Version der Datenschutzerklärung
  privacyPolicyVersion: z.string(),
  // Zusätzliche Informationen
  legalBasis: z.enum([
    'consent', // Art. 6(1)(a) DSGVO
    'contract', // Art. 6(1)(b) DSGVO
    'legal_obligation', // Art. 6(1)(c) DSGVO
    'vital_interests', // Art. 6(1)(d) DSGVO
    'public_interest', // Art. 6(1)(e) DSGVO
    'legitimate_interests', // Art. 6(1)(f) DSGVO
  ]),
  purpose: z.string(), // Zweck der Verarbeitung
  dataCategories: z.array(z.string()), // Kategorien betroffener Daten
  recipients: z.array(z.string()).optional(), // Empfänger (z.B. Praxissystem)
  retentionPeriod: z.string(), // Speicherdauer (z.B. "3 years")
  // Audit Log
  auditLog: z.array(
    z.object({
      action: z.enum(['granted', 'revoked', 'updated']),
      timestamp: z.date(),
      ipAddress: z.string().optional(), // Für Nachweis
      userAgent: z.string().optional(),
    }),
  ),
});

export type GDPRConsent = z.infer<typeof GDPRConsentSchema>;

/**
 * GDPR Consent Entity
 */
export class GDPRConsentEntity {
  private constructor(private readonly data: GDPRConsent) {
    GDPRConsentSchema.parse(data);
  }

  static create(params: {
    patientId: string;
    type: GDPRConsent['type'];
    privacyPolicyVersion: string;
    legalBasis: GDPRConsent['legalBasis'];
    purpose: string;
    dataCategories: string[];
    recipients?: string[];
    retentionPeriod: string;
  }): GDPRConsentEntity {
    const id = crypto.randomUUID();

    return new GDPRConsentEntity({
      id,
      patientId: params.patientId,
      type: params.type,
      granted: false,
      privacyPolicyVersion: params.privacyPolicyVersion,
      legalBasis: params.legalBasis,
      purpose: params.purpose,
      dataCategories: params.dataCategories,
      recipients: params.recipients,
      retentionPeriod: params.retentionPeriod,
      auditLog: [],
    });
  }

  // Getters
  get id(): string {
    return this.data.id;
  }

  get patientId(): string {
    return this.data.patientId;
  }

  get type(): GDPRConsent['type'] {
    return this.data.type;
  }

  get granted(): boolean {
    return this.data.granted;
  }

  get grantedAt(): Date | undefined {
    return this.data.grantedAt;
  }

  get revokedAt(): Date | undefined {
    return this.data.revokedAt;
  }

  get privacyPolicyVersion(): string {
    return this.data.privacyPolicyVersion;
  }

  get legalBasis(): GDPRConsent['legalBasis'] {
    return this.data.legalBasis;
  }

  get purpose(): string {
    return this.data.purpose;
  }

  get dataCategories(): string[] {
    return this.data.dataCategories;
  }

  get recipients(): string[] | undefined {
    return this.data.recipients;
  }

  get retentionPeriod(): string {
    return this.data.retentionPeriod;
  }

  get auditLog(): GDPRConsent['auditLog'] {
    return this.data.auditLog;
  }

  // Business Logic

  /**
   * Einwilligung erteilen (Art. 6, 7 DSGVO)
   */
  grant(ipAddress?: string, userAgent?: string): GDPRConsentEntity {
    if (this.data.granted) {
      throw new Error('Consent already granted');
    }

    const now = new Date();

    return new GDPRConsentEntity({
      ...this.data,
      granted: true,
      grantedAt: now,
      revokedAt: undefined,
      auditLog: [
        ...this.data.auditLog,
        {
          action: 'granted',
          timestamp: now,
          ipAddress,
          userAgent,
        },
      ],
    });
  }

  /**
   * Einwilligung widerrufen (Art. 7(3) DSGVO)
   */
  revoke(ipAddress?: string, userAgent?: string): GDPRConsentEntity {
    if (!this.data.granted) {
      throw new Error('Consent not granted');
    }

    const now = new Date();

    return new GDPRConsentEntity({
      ...this.data,
      granted: false,
      revokedAt: now,
      auditLog: [
        ...this.data.auditLog,
        {
          action: 'revoked',
          timestamp: now,
          ipAddress,
          userAgent,
        },
      ],
    });
  }

  /**
   * Prüft ob Consent aktiv und gültig ist
   */
  isValid(): boolean {
    return this.data.granted && this.data.revokedAt === undefined;
  }

  /**
   * Prüft ob Consent abgelaufen ist (basierend auf Retention Period)
   */
  isExpired(): boolean {
    if (!this.data.grantedAt) return false;

    const now = new Date();
    const expiryDate = this.calculateExpiryDate();

    return now > expiryDate;
  }

  /**
   * Öffentliches Ablaufdatum (für Reports)
   */
  calculateExpirationDate(): Date | null {
    if (!this.data.grantedAt) return null;
    return this.calculateExpiryDate();
  }

  /**
   * Berechnet Ablaufdatum basierend auf Retention Period
   */
  private calculateExpiryDate(): Date {
    if (!this.data.grantedAt) {
      return new Date();
    }

    const grantedDate = this.data.grantedAt;
    const retentionPeriod = this.data.retentionPeriod;

    // Parse Retention Period (z.B. "3 years", "6 months")
    const match = retentionPeriod.match(/(\d+)\s*(year|month|day)s?/i);
    if (!match) {
      return new Date(grantedDate.getTime() + 3 * 365 * 24 * 60 * 60 * 1000); // Default: 3 Jahre
    }

    const amount = parseInt(match[1], 10);
    const unit = match[2].toLowerCase();

    const expiryDate = new Date(grantedDate);

    switch (unit) {
      case 'year':
        expiryDate.setFullYear(expiryDate.getFullYear() + amount);
        break;
      case 'month':
        expiryDate.setMonth(expiryDate.getMonth() + amount);
        break;
      case 'day':
        expiryDate.setDate(expiryDate.getDate() + amount);
        break;
    }

    return expiryDate;
  }

  /**
   * Zu Plain Object konvertieren
   */
  toJSON(): GDPRConsent {
    return {
      ...this.data,
    };
  }

  /**
   * Von Plain Object erstellen
   */
  static fromJSON(json: GDPRConsent): GDPRConsentEntity {
    return new GDPRConsentEntity({
      ...json,
      grantedAt: json.grantedAt ? new Date(json.grantedAt) : undefined,
      revokedAt: json.revokedAt ? new Date(json.revokedAt) : undefined,
      auditLog: json.auditLog.map(l => ({
        ...l,
        timestamp: new Date(l.timestamp),
      })),
    });
  }
}

/**
 * Predefined Consent Templates für typische Use Cases
 */
export const GDPRConsentTemplates = {
  dataProcessing: (patientId: string): GDPRConsentEntity =>
    GDPRConsentEntity.create({
      patientId,
      type: 'data_processing',
      privacyPolicyVersion: '1.0.0',
      legalBasis: 'consent',
      purpose: 'Verarbeitung personenbezogener Gesundheitsdaten zum Zweck der medizinischen Anamnese',
      dataCategories: ['Gesundheitsdaten', 'Kontaktdaten', 'Versicherungsdaten'],
      retentionPeriod: '3 years', // § 630f BGB
    }),

  gdtExport: (patientId: string, practiceSystem: string): GDPRConsentEntity =>
    GDPRConsentEntity.create({
      patientId,
      type: 'gdt_export',
      privacyPolicyVersion: '1.0.0',
      legalBasis: 'consent',
      purpose: 'Export der Anamnese-Daten zum Praxisverwaltungssystem',
      dataCategories: ['Gesundheitsdaten', 'Anamnese-Antworten'],
      recipients: [practiceSystem],
      retentionPeriod: '3 years',
    }),

  ocrProcessing: (patientId: string): GDPRConsentEntity =>
    GDPRConsentEntity.create({
      patientId,
      type: 'ocr_processing',
      privacyPolicyVersion: '1.0.0',
      legalBasis: 'consent',
      purpose: 'Automatische Texterkennung (OCR) von hochgeladenen Dokumenten zur Datenextraktion',
      dataCategories: ['Dokumenten-Scans', 'Versichertenkarten-Daten'],
      retentionPeriod: '3 years',
    }),
};
