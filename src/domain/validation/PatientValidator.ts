/**
 * Patient Validator
 *
 * Validates patient data before persistence.
 * Uses ValidationResult type for consistent error handling.
 *
 * DSGVO Art. 25: Privacy by Design - validates minimum required data.
 */

import {
  ValidationResult,
  ValidationError,
  validationOk,
  validationErr,
  BackendErrorCode,
} from '@shared/BackendError';
import type { Patient } from '../entities/Patient';

/**
 * Patient validation rules.
 */
export class PatientValidator {
  /**
   * Validate patient encrypted data.
   * Checks required fields and format constraints.
   */
  static validateEncryptedData(data: Patient['encryptedData']): ValidationResult {
    const errors: ValidationError[] = [];

    // Required fields
    if (!data.firstName || data.firstName.trim().length === 0) {
      errors.push({
        field: 'firstName',
        message: 'Vorname ist erforderlich',
        code: BackendErrorCode.REQUIRED_FIELD_MISSING,
      });
    }

    if (!data.lastName || data.lastName.trim().length === 0) {
      errors.push({
        field: 'lastName',
        message: 'Nachname ist erforderlich',
        code: BackendErrorCode.REQUIRED_FIELD_MISSING,
      });
    }

    if (!data.birthDate || data.birthDate.trim().length === 0) {
      errors.push({
        field: 'birthDate',
        message: 'Geburtsdatum ist erforderlich',
        code: BackendErrorCode.REQUIRED_FIELD_MISSING,
      });
    }

    // Format validation
    if (data.birthDate && !this.isValidISODate(data.birthDate)) {
      errors.push({
        field: 'birthDate',
        message: 'Geburtsdatum muss im ISO 8601 Format sein (YYYY-MM-DD)',
        code: BackendErrorCode.INVALID_INPUT,
      });
    }

    // Birth date should be in the past
    if (data.birthDate && this.isValidISODate(data.birthDate)) {
      const birthDate = new Date(data.birthDate);
      if (birthDate > new Date()) {
        errors.push({
          field: 'birthDate',
          message: 'Geburtsdatum kann nicht in der Zukunft liegen',
          code: BackendErrorCode.INVALID_INPUT,
        });
      }
    }

    // Email format (optional)
    if (data.email && !this.isValidEmail(data.email)) {
      errors.push({
        field: 'email',
        message: 'Ungültiges E-Mail-Format',
        code: BackendErrorCode.INVALID_INPUT,
      });
    }

    // Gender validation (optional)
    if (data.gender && !['male', 'female', 'other'].includes(data.gender)) {
      errors.push({
        field: 'gender',
        message: 'Ungültiges Geschlecht',
        code: BackendErrorCode.INVALID_INPUT,
      });
    }

    return errors.length > 0 ? validationErr(errors) : validationOk();
  }

  /**
   * Validate patient language code.
   */
  static validateLanguage(language: string): ValidationResult {
    const supportedLanguages = [
      'de', 'en', 'fr', 'es', 'it', 'pt', 'nl', 'pl', 'tr', 'ru',
      'ar', 'fa', 'zh', 'ja', 'ko', 'vi', 'uk', 'ro', 'el',
      'ur', 'sq', 'hi', // Legacy codes
    ];

    if (!supportedLanguages.includes(language)) {
      return validationErr([{
        field: 'language',
        message: 'Nicht unterstützte Sprache',
        code: BackendErrorCode.INVALID_INPUT,
      }]);
    }

    return validationOk();
  }

  /**
   * Validate GDPR consents.
   */
  static validateGDPRConsents(
    consents: Patient['gdprConsents'],
  ): ValidationResult {
    const errors: ValidationError[] = [];

    // Check for required consent types
    const requiredTypes = ['data_processing', 'data_storage'] as const;
    
    for (const requiredType of requiredTypes) {
      const consent = consents.find(c => c.type === requiredType && c.granted);
      if (!consent) {
        errors.push({
          field: `gdprConsents.${requiredType}`,
          message: `Einwilligung für ${requiredType === 'data_processing' ? 'Datenverarbeitung' : 'Datenspeicherung'} erforderlich`,
          code: BackendErrorCode.REQUIRED_FIELD_MISSING,
        });
      }
    }

    // Validate each consent has required fields
    for (let i = 0; i < consents.length; i++) {
      const consent = consents[i];
      if (!consent.version || consent.version.trim().length === 0) {
        errors.push({
          field: `gdprConsents[${i}].version`,
          message: 'Datenschutzversion erforderlich',
          code: BackendErrorCode.REQUIRED_FIELD_MISSING,
        });
      }
    }

    return errors.length > 0 ? validationErr(errors) : validationOk();
  }

  // Helper methods

  private static isValidISODate(dateString: string): boolean {
    // Check YYYY-MM-DD format
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(dateString)) {
      return false;
    }
    const date = new Date(dateString);
    return !isNaN(date.getTime());
  }

  private static isValidEmail(email: string): boolean {
    // Basic email validation
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  }
}
