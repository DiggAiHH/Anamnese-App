/**
 * GDT Export Value Object - repräsentiert GDT Export für Praxissysteme
 * 
 * GDT (Geräte Daten Träger) Format:
 * - Standardisiertes Format für deutsche Praxissoftware
 * - Unterstützt GDT 2.1 und 3.0
 * - Feldseparator: CRLF
 * - Encoding: ISO-8859-1 (Latin-1)
 */

import { z } from 'zod';

// GDT Record Type
export const GDTRecordSchema = z.object({
  // Record Length (3 digits) + Field Identifier (4 digits) + Data + CRLF
  length: z.number().int().min(0).max(999),
  fieldId: z.string().regex(/^\d{4}$/), // 4-stellige Field ID
  data: z.string(),
});

export type GDTRecord = z.infer<typeof GDTRecordSchema>;

// GDT Export
export const GDTExportSchema = z.object({
  // Header
  version: z.enum(['2.1', '3.0']),
  senderId: z.string().max(8), // Sender-Kennung
  receiverId: z.string().max(8).optional(), // Empfänger-Kennung
  // Records
  records: z.array(GDTRecordSchema),
  // Metadata
  exportedAt: z.date(),
  patientId: z.string().uuid(),
  // Checksum (optional für Datenintegrität)
  checksum: z.string().optional(),
});

export type GDTExport = z.infer<typeof GDTExportSchema>;

/**
 * GDT Export Value Object
 */
export class GDTExportVO {
  private constructor(private readonly data: GDTExport) {
    GDTExportSchema.parse(data);
  }

  /**
   * Factory Method - erstellt GDT Export
   */
  static create(params: {
    version: GDTExport['version'];
    senderId: string;
    receiverId?: string;
    patientId: string;
    records: GDTRecord[];
  }): GDTExportVO {
    // Checksum berechnen
    const checksum = GDTExportVO.calculateChecksum(params.records);

    return new GDTExportVO({
      version: params.version,
      senderId: params.senderId,
      receiverId: params.receiverId,
      records: params.records,
      exportedAt: new Date(),
      patientId: params.patientId,
      checksum,
    });
  }

  // Getters
  get version(): GDTExport['version'] {
    return this.data.version;
  }

  get senderId(): string {
    return this.data.senderId;
  }

  get receiverId(): string | undefined {
    return this.data.receiverId;
  }

  get records(): GDTRecord[] {
    return this.data.records;
  }

  get exportedAt(): Date {
    return this.data.exportedAt;
  }

  get patientId(): string {
    return this.data.patientId;
  }

  get checksum(): string | undefined {
    return this.data.checksum;
  }

  /**
   * Zu GDT String konvertieren (ISO-8859-1 encoding)
   * 
   * Format: LLL + FFFF + DATA + CRLF
   * - LLL = Length (3 digits, inkl. length field selbst)
   * - FFFF = Field ID (4 digits)
   * - DATA = Field Data
   * - CRLF = \r\n
   */
  toGDTString(): string {
    return this.data.records
      .map(record => {
        const fieldStr = `${record.fieldId}${record.data}`;
        const lengthWithCRLF = 3 + fieldStr.length + 2; // 3 (LLL) + field + 2 (CRLF)
        const lengthStr = lengthWithCRLF.toString().padStart(3, '0');
        return `${lengthStr}${fieldStr}\r\n`;
      })
      .join('');
  }

  /**
   * Von GDT String parsen
   */
  static fromGDTString(
    gdtString: string,
    patientId: string,
    senderId: string,
  ): GDTExportVO {
    const records: GDTRecord[] = [];
    const lines = gdtString.split('\r\n').filter(line => line.length > 0);

    for (const line of lines) {
      if (line.length < 7) {
        continue; // Ungültige Zeile
      }

      const lengthStr = line.substring(0, 3);
      const fieldId = line.substring(3, 7);
      const data = line.substring(7);

      const length = parseInt(lengthStr, 10);

      records.push({
        length,
        fieldId,
        data,
      });
    }

    // Version aus Records extrahieren (Field 9218)
    const versionRecord = records.find(r => r.fieldId === '9218');
    const version = (versionRecord?.data as GDTExport['version']) ?? '2.1';

    return GDTExportVO.create({
      version,
      senderId,
      patientId,
      records,
    });
  }

  /**
   * Checksum berechnen (einfache Summe aller Bytes)
   */
  private static calculateChecksum(records: GDTRecord[]): string {
    let sum = 0;
    
    for (const record of records) {
      const str = `${record.fieldId}${record.data}`;
      for (let i = 0; i < str.length; i++) {
        sum += str.charCodeAt(i);
      }
    }

    return sum.toString(16).toUpperCase();
  }

  /**
   * Checksum validieren
   */
  validateChecksum(): boolean {
    if (!this.data.checksum) {
      return true; // Kein Checksum vorhanden
    }

    const calculated = GDTExportVO.calculateChecksum(this.data.records);
    return calculated === this.data.checksum;
  }

  /**
   * Zu JSON serialisieren
   */
  toJSON(): GDTExport {
    return {
      ...this.data,
    };
  }

  /**
   * Von JSON deserialisieren
   */
  static fromJSON(json: GDTExport): GDTExportVO {
    return new GDTExportVO({
      ...json,
      exportedAt: new Date(json.exportedAt),
    });
  }
}

/**
 * GDT Field IDs (häufig verwendete)
 * 
 * Referenz: GDT 2.1/3.0 Spezifikation
 */
export const GDTFieldIds = {
  // Satzidentifikation
  RECORD_TYPE: '8000',
  LENGTH: '8100',
  
  // Patient Data
  PATIENT_ID: '3000',
  PATIENT_NAME: '3101',
  PATIENT_FIRST_NAME: '3102',
  PATIENT_BIRTH_DATE: '3103',
  PATIENT_GENDER: '3110',
  
  // Insurance Data
  INSURANCE_NUMBER: '3105',
  INSURANCE_NAME: '3108',
  INSURANCE_TYPE: '3109',
  
  // Address
  STREET: '3106',
  ZIP_CODE: '3112',
  CITY: '3113',
  
  // Anamnesis Data
  ANAMNESIS_TEXT: '6200',
  DIAGNOSIS: '6205',
  MEDICATION: '6220',
  
  // Meta
  VERSION: '9218',
  TIMESTAMP: '9206',
  SENDER_ID: '8315',
  RECEIVER_ID: '8316',
} as const;

/**
 * GDT Record Builder - vereinfacht das Erstellen von Records
 */
export class GDTRecordBuilder {
  private records: GDTRecord[] = [];

  /**
   * Record hinzufügen
   */
  addRecord(fieldId: string, data: string): GDTRecordBuilder {
    const fieldStr = `${fieldId}${data}`;
    const length = 3 + fieldStr.length + 2;

    this.records.push({
      length,
      fieldId,
      data,
    });

    return this;
  }

  /**
   * Patient Daten hinzufügen
   */
  addPatientData(params: {
    patientId: string;
    lastName: string;
    firstName: string;
    birthDate: string; // DDMMYYYY
    gender: 'M' | 'F' | 'X';
  }): GDTRecordBuilder {
    return this.addRecord(GDTFieldIds.PATIENT_ID, params.patientId)
      .addRecord(GDTFieldIds.PATIENT_NAME, params.lastName)
      .addRecord(GDTFieldIds.PATIENT_FIRST_NAME, params.firstName)
      .addRecord(GDTFieldIds.PATIENT_BIRTH_DATE, params.birthDate)
      .addRecord(GDTFieldIds.PATIENT_GENDER, params.gender);
  }

  /**
   * Versicherungsdaten hinzufügen
   */
  addInsuranceData(params: {
    insuranceNumber: string;
    insuranceName: string;
    insuranceType: '1' | '2' | '3'; // 1=GKV, 2=PKV, 3=Sonstige
  }): GDTRecordBuilder {
    return this.addRecord(GDTFieldIds.INSURANCE_NUMBER, params.insuranceNumber)
      .addRecord(GDTFieldIds.INSURANCE_NAME, params.insuranceName)
      .addRecord(GDTFieldIds.INSURANCE_TYPE, params.insuranceType);
  }

  /**
   * Anamnese-Text hinzufügen
   */
  addAnamnesisText(text: string): GDTRecordBuilder {
    // GDT limitiert Textlänge auf ~64KB pro Record
    // Bei längeren Texten: mehrere Records erstellen
    const maxLength = 65000;
    
    if (text.length <= maxLength) {
      return this.addRecord(GDTFieldIds.ANAMNESIS_TEXT, text);
    }

    // Text aufteilen
    const chunks = text.match(new RegExp(`.{1,${maxLength}}`, 'g')) || [];
    chunks.forEach(chunk => {
      this.addRecord(GDTFieldIds.ANAMNESIS_TEXT, chunk);
    });

    return this;
  }

  /**
   * Build - erstellt GDTExportVO
   */
  build(params: {
    version: GDTExport['version'];
    senderId: string;
    receiverId?: string;
    patientId: string;
  }): GDTExportVO {
    // Meta-Records hinzufügen
    const timestamp = new Date().toISOString();
    
    this.addRecord(GDTFieldIds.VERSION, params.version)
      .addRecord(GDTFieldIds.TIMESTAMP, timestamp)
      .addRecord(GDTFieldIds.SENDER_ID, params.senderId);

    if (params.receiverId) {
      this.addRecord(GDTFieldIds.RECEIVER_ID, params.receiverId);
    }

    return GDTExportVO.create({
      version: params.version,
      senderId: params.senderId,
      receiverId: params.receiverId,
      patientId: params.patientId,
      records: this.records,
    });
  }
}
