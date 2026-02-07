/**
 * Unit tests for PatientValidator.
 */

import { PatientValidator } from '@domain/validation/PatientValidator';
import { BackendErrorCode } from '@shared/BackendError';
import type { Patient } from '@domain/entities/Patient';

describe('PatientValidator', () => {
  describe('validateEncryptedData()', () => {
    const validData: Patient['encryptedData'] = {
      firstName: 'Max',
      lastName: 'Mustermann',
      birthDate: '1990-01-15',
      gender: 'male',
    };

    it('should pass for valid data', () => {
      const result = PatientValidator.validateEncryptedData(validData);
      
      expect(result.valid).toBe(true);
    });

    it('should fail for missing firstName', () => {
      const data = { ...validData, firstName: '' };
      const result = PatientValidator.validateEncryptedData(data);
      
      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.errors).toContainEqual(
          expect.objectContaining({
            field: 'firstName',
            code: BackendErrorCode.REQUIRED_FIELD_MISSING,
          }),
        );
      }
    });

    it('should fail for missing lastName', () => {
      const data = { ...validData, lastName: '' };
      const result = PatientValidator.validateEncryptedData(data);
      
      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.errors).toContainEqual(
          expect.objectContaining({
            field: 'lastName',
            code: BackendErrorCode.REQUIRED_FIELD_MISSING,
          }),
        );
      }
    });

    it('should fail for missing birthDate', () => {
      const data = { ...validData, birthDate: '' };
      const result = PatientValidator.validateEncryptedData(data);
      
      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.errors).toContainEqual(
          expect.objectContaining({
            field: 'birthDate',
            code: BackendErrorCode.REQUIRED_FIELD_MISSING,
          }),
        );
      }
    });

    it('should fail for invalid birthDate format', () => {
      const data = { ...validData, birthDate: 'invalid-date' };
      const result = PatientValidator.validateEncryptedData(data);
      
      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.errors).toContainEqual(
          expect.objectContaining({
            field: 'birthDate',
            code: BackendErrorCode.INVALID_INPUT,
          }),
        );
      }
    });

    it('should fail for future birthDate', () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);
      const data = { ...validData, birthDate: futureDate.toISOString().split('T')[0] };
      const result = PatientValidator.validateEncryptedData(data);
      
      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.errors).toContainEqual(
          expect.objectContaining({
            field: 'birthDate',
            message: expect.stringContaining('Zukunft'),
          }),
        );
      }
    });

    it('should fail for invalid email format', () => {
      const data = { ...validData, email: 'invalid-email' };
      const result = PatientValidator.validateEncryptedData(data);
      
      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.errors).toContainEqual(
          expect.objectContaining({
            field: 'email',
            code: BackendErrorCode.INVALID_INPUT,
          }),
        );
      }
    });

    it('should pass for valid email', () => {
      const data = { ...validData, email: 'max@example.com' };
      const result = PatientValidator.validateEncryptedData(data);
      
      expect(result.valid).toBe(true);
    });

    it('should pass without optional fields', () => {
      const minimalData = {
        firstName: 'Max',
        lastName: 'Mustermann',
        birthDate: '1990-01-15',
      };
      const result = PatientValidator.validateEncryptedData(minimalData as Patient['encryptedData']);
      
      expect(result.valid).toBe(true);
    });
  });

  describe('validateLanguage()', () => {
    it('should pass for supported language', () => {
      const result = PatientValidator.validateLanguage('de');
      
      expect(result.valid).toBe(true);
    });

    it('should pass for all supported languages', () => {
      const languages = ['de', 'en', 'fr', 'es', 'it', 'pt', 'nl', 'pl', 'tr', 'ru'];
      
      for (const lang of languages) {
        const result = PatientValidator.validateLanguage(lang);
        expect(result.valid).toBe(true);
      }
    });

    it('should fail for unsupported language', () => {
      const result = PatientValidator.validateLanguage('xx');
      
      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.errors[0].field).toBe('language');
      }
    });
  });

  describe('validateGDPRConsents()', () => {
    const validConsents: Patient['gdprConsents'] = [
      {
        type: 'data_processing',
        granted: true,
        timestamp: new Date(),
        version: '1.0',
      },
      {
        type: 'data_storage',
        granted: true,
        timestamp: new Date(),
        version: '1.0',
      },
    ];

    it('should pass for valid consents with all required types', () => {
      const result = PatientValidator.validateGDPRConsents(validConsents);
      
      expect(result.valid).toBe(true);
    });

    it('should fail when data_processing consent is missing', () => {
      const consents = validConsents.filter(c => c.type !== 'data_processing');
      const result = PatientValidator.validateGDPRConsents(consents);
      
      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.errors).toContainEqual(
          expect.objectContaining({
            field: 'gdprConsents.data_processing',
          }),
        );
      }
    });

    it('should fail when data_storage consent is missing', () => {
      const consents = validConsents.filter(c => c.type !== 'data_storage');
      const result = PatientValidator.validateGDPRConsents(consents);
      
      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.errors).toContainEqual(
          expect.objectContaining({
            field: 'gdprConsents.data_storage',
          }),
        );
      }
    });

    it('should fail when consent is not granted', () => {
      const consents = validConsents.map(c =>
        c.type === 'data_processing' ? { ...c, granted: false } : c,
      );
      const result = PatientValidator.validateGDPRConsents(consents);
      
      expect(result.valid).toBe(false);
    });

    it('should fail when consent version is missing', () => {
      const consents = validConsents.map(c =>
        c.type === 'data_processing' ? { ...c, version: '' } : c,
      );
      const result = PatientValidator.validateGDPRConsents(consents);
      
      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.errors).toContainEqual(
          expect.objectContaining({
            field: expect.stringMatching(/gdprConsents\[\d+\]\.version/),
          }),
        );
      }
    });
  });
});
