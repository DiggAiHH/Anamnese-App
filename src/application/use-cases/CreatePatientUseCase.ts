/**
 * CreatePatient Use Case - Erstellt neuen Patienten
 * 
 * FLOW:
 * Presentation Layer (PatientInfoScreen)
 *   → Use Case
 *   → Encryption Service (encrypt PII data)
 *   → Patient Repository (save to DB)
 *   → GDPR Consent Repository (save consents)
 */

import { PatientEntity, Patient } from '@domain/entities/Patient';
import { GDPRConsentEntity } from '@domain/entities/GDPRConsent';
import { IPatientRepository } from '@domain/repositories/IPatientRepository';
import { IGDPRConsentRepository } from '@domain/repositories/IGDPRConsentRepository';

export interface CreatePatientInput {
  firstName: string;
  lastName: string;
  birthDate: string; // ISO 8601
  language: Patient['language'];
  insurance?: string;
  insuranceNumber?: string;
  encryptionKey: string;
  // GDPR Consents
  consents: {
    dataProcessing: boolean;
    dataStorage: boolean;
    ocrProcessing?: boolean;
    voiceRecognition?: boolean;
  };
}

export interface CreatePatientOutput {
  success: boolean;
  patientId?: string;
  error?: string;
}

/**
 * CreatePatient Use Case
 */
export class CreatePatientUseCase {
  constructor(
    private readonly patientRepository: IPatientRepository,
    private readonly gdprRepository: IGDPRConsentRepository,
  ) {}

  async execute(input: CreatePatientInput): Promise<CreatePatientOutput> {
    try {
      // Step 1: Validate required consents
      if (!input.consents.dataProcessing || !input.consents.dataStorage) {
        return {
          success: false,
          error: 'Data processing and storage consent required',
        };
      }

      // Step 2: Create Patient Entity
      let patient = PatientEntity.create({
        firstName: input.firstName,
        lastName: input.lastName,
        birthDate: input.birthDate,
        language: input.language,
        insurance: input.insurance,
        insuranceNumber: input.insuranceNumber,
      });

      // Step 3: Add GDPR Consents
      patient = this.addConsents(patient, input.consents);

      // Step 4: Save Patient (PII data wird automatisch verschlüsselt beim Speichern)
      await this.patientRepository.save(patient);

      // Step 5: Save GDPR Consents (separate table für Audit)
      await this.saveGDPRConsents(patient.id, input.consents);

      return {
        success: true,
        patientId: patient.id,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Add GDPR Consents to Patient
   */
  private addConsents(
    patient: PatientEntity,
    consents: CreatePatientInput['consents'],
  ): PatientEntity {
    let updatedPatient = patient;

    // Data Processing Consent (required)
    updatedPatient = updatedPatient.addConsent('data_processing', consents.dataProcessing, '1.0.0');

    // Data Storage Consent (required)
    updatedPatient = updatedPatient.addConsent('data_storage', consents.dataStorage, '1.0.0');

    // OCR Processing Consent (optional)
    if (consents.ocrProcessing !== undefined) {
      updatedPatient = updatedPatient.addConsent('ocr_processing', consents.ocrProcessing, '1.0.0');
    }

    // Voice Recognition Consent (optional)
    if (consents.voiceRecognition !== undefined) {
      updatedPatient = updatedPatient.addConsent(
        'voice_recognition',
        consents.voiceRecognition,
        '1.0.0',
      );
    }

    return updatedPatient;
  }

  /**
   * Save GDPR Consents (separate table für Audit Trail)
   */
  private async saveGDPRConsents(
    patientId: string,
    consents: CreatePatientInput['consents'],
  ): Promise<void> {
    // Data Processing Consent
    const dataProcessingConsent = GDPRConsentEntity.create({
      patientId,
      type: 'data_processing',
      privacyPolicyVersion: '1.0.0',
      legalBasis: 'consent',
      purpose: 'Verarbeitung personenbezogener Gesundheitsdaten',
      dataCategories: ['Gesundheitsdaten', 'Kontaktdaten'],
      retentionPeriod: '3 years',
    });

    if (consents.dataProcessing) {
      await this.gdprRepository.save(dataProcessingConsent.grant());
    }

    // Data Storage Consent
    const dataStorageConsent = GDPRConsentEntity.create({
      patientId,
      type: 'data_storage',
      privacyPolicyVersion: '1.0.0',
      legalBasis: 'consent',
      purpose: 'Speicherung der Anamnese-Daten',
      dataCategories: ['Anamnese-Antworten'],
      retentionPeriod: '3 years',
    });

    if (consents.dataStorage) {
      await this.gdprRepository.save(dataStorageConsent.grant());
    }

    // OCR Consent (optional)
    if (consents.ocrProcessing !== undefined) {
      const ocrConsent = GDPRConsentEntity.create({
        patientId,
        type: 'ocr_processing',
        privacyPolicyVersion: '1.0.0',
        legalBasis: 'consent',
        purpose: 'OCR-Verarbeitung hochgeladener Dokumente',
        dataCategories: ['Dokumenten-Scans'],
        retentionPeriod: '3 years',
      });

      if (consents.ocrProcessing) {
        await this.gdprRepository.save(ocrConsent.grant());
      }
    }

    // Voice Recognition Consent (optional)
    if (consents.voiceRecognition !== undefined) {
      const voiceConsent = GDPRConsentEntity.create({
        patientId,
        type: 'voice_recognition',
        privacyPolicyVersion: '1.0.0',
        legalBasis: 'consent',
        purpose: 'Spracherkennung für Antwort-Eingabe',
        dataCategories: ['Sprachaufnahmen'],
        retentionPeriod: '3 years',
      });

      if (consents.voiceRecognition) {
        await this.gdprRepository.save(voiceConsent.grant());
      }
    }
  }
}
