/**
 * Patient Entity Tests
 *
 * DSGVO Art. 25: Privacy by Design – verifies PII is contained in encryptedData.
 * DSGVO Art. 30: Audit trail – verifies audit log creation/updates.
 * DSGVO Art. 7: Consent management – verifies consent grant/revoke.
 */

import { PatientEntity } from '../../../src/domain/entities/Patient';

// Mock crypto.randomUUID
const mockUUID = '12345678-1234-1234-1234-123456789abc';
const originalRandomUUID = globalThis.crypto?.randomUUID;

beforeAll(() => {
  Object.defineProperty(globalThis, 'crypto', {
    value: {
      ...globalThis.crypto,
      randomUUID: () => mockUUID,
    },
    writable: true,
  });
});

afterAll(() => {
  if (originalRandomUUID) {
    Object.defineProperty(globalThis.crypto, 'randomUUID', { value: originalRandomUUID });
  }
});

describe('PatientEntity', () => {
  const validParams = {
    firstName: 'Max',
    lastName: 'Mustermann',
    birthDate: '1990-01-15',
    language: 'de' as const,
    gender: 'male' as const,
    email: 'max@example.com',
    phone: '+49123456789',
    insurance: 'AOK',
    insuranceNumber: 'A123456789',
  };

  describe('Given valid patient data', () => {
    it('should create a patient with UUID', () => {
      const patient = PatientEntity.create(validParams);

      expect(patient.id).toBe(mockUUID);
      expect(patient.language).toBe('de');
    });

    it('should store PII in encryptedData (DSGVO Art. 25 – Privacy by Design)', () => {
      const patient = PatientEntity.create(validParams);

      // DSGVO Art. 25: PII must be in encryptedData, not exposed at top level
      expect(patient.encryptedData.firstName).toBe('Max');
      expect(patient.encryptedData.lastName).toBe('Mustermann');
      expect(patient.encryptedData.birthDate).toBe('1990-01-15');
      expect(patient.encryptedData.email).toBe('max@example.com');
      expect(patient.encryptedData.phone).toBe('+49123456789');
      expect(patient.encryptedData.insurance).toBe('AOK');
      expect(patient.encryptedData.insuranceNumber).toBe('A123456789');
    });

    it('should create audit log entry on creation (DSGVO Art. 30)', () => {
      const patient = PatientEntity.create(validParams);

      expect(patient.auditLog).toHaveLength(1);
      expect(patient.auditLog[0].action).toBe('created');
      expect(patient.auditLog[0].details).toBe('Patient created');
      expect(patient.auditLog[0].timestamp).toBeInstanceOf(Date);
    });

    it('should initialize with empty GDPR consents', () => {
      const patient = PatientEntity.create(validParams);

      expect(patient.gdprConsents).toHaveLength(0);
    });

    it('should set createdAt and updatedAt timestamps', () => {
      const before = new Date();
      const patient = PatientEntity.create(validParams);
      const after = new Date();

      expect(patient.createdAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(patient.createdAt.getTime()).toBeLessThanOrEqual(after.getTime());
      expect(patient.updatedAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
    });
  });

  describe('Given consent management (DSGVO Art. 6/7)', () => {
    it('should add consent with timestamp', () => {
      const patient = PatientEntity.create(validParams);
      const updated = patient.addConsent('data_processing', true, '1.0.0');

      expect(updated.gdprConsents).toHaveLength(1);
      expect(updated.gdprConsents[0].type).toBe('data_processing');
      expect(updated.gdprConsents[0].granted).toBe(true);
      expect(updated.gdprConsents[0].version).toBe('1.0.0');
    });

    it('should check consent status correctly', () => {
      const patient = PatientEntity.create(validParams);
      const withConsent = patient.addConsent('data_processing', true, '1.0.0');

      expect(withConsent.hasConsent('data_processing')).toBe(true);
      expect(withConsent.hasConsent('gdt_export')).toBe(false);
    });

    it('should use latest consent when multiple exist', () => {
      jest.useFakeTimers();
      const now = new Date('2025-01-01T00:00:00Z');
      jest.setSystemTime(now);

      const patient = PatientEntity.create(validParams);
      const granted = patient.addConsent('data_processing', true, '1.0.0');

      // Advance time so revocation has a later timestamp
      jest.setSystemTime(new Date('2025-01-01T00:01:00Z'));
      const revoked = granted.addConsent('data_processing', false, '1.0.0');

      expect(revoked.hasConsent('data_processing')).toBe(false);

      jest.useRealTimers();
    });
  });

  describe('Given audit logging (DSGVO Art. 30)', () => {
    it('should append audit log entries', () => {
      const patient = PatientEntity.create(validParams);
      const accessed = patient.addAuditLog('accessed', 'Doctor viewed record');

      expect(accessed.auditLog).toHaveLength(2);
      expect(accessed.auditLog[1].action).toBe('accessed');
      expect(accessed.auditLog[1].details).toBe('Doctor viewed record');
    });

    it('should not mutate original entity', () => {
      const patient = PatientEntity.create(validParams);
      const updated = patient.addAuditLog('accessed');

      expect(patient.auditLog).toHaveLength(1);
      expect(updated.auditLog).toHaveLength(2);
    });
  });

  describe('Given language change', () => {
    it('should update language and updatedAt', () => {
      const patient = PatientEntity.create(validParams);
      const updated = patient.changeLanguage('en');

      expect(updated.language).toBe('en');
      expect(updated.updatedAt.getTime()).toBeGreaterThanOrEqual(patient.updatedAt.getTime());
    });
  });

  describe('Given serialization/deserialization', () => {
    it('should round-trip through JSON', () => {
      const patient = PatientEntity.create(validParams);
      const json = patient.toJSON();
      const restored = PatientEntity.fromJSON(json);

      expect(restored.id).toBe(patient.id);
      expect(restored.encryptedData.firstName).toBe('Max');
      expect(restored.language).toBe('de');
      expect(restored.auditLog).toHaveLength(1);
    });

    it('should restore Date objects from JSON', () => {
      const patient = PatientEntity.create(validParams);
      const json = JSON.parse(JSON.stringify(patient.toJSON()));
      const restored = PatientEntity.fromJSON(json);

      expect(restored.createdAt).toBeInstanceOf(Date);
      expect(restored.updatedAt).toBeInstanceOf(Date);
      expect(restored.auditLog[0].timestamp).toBeInstanceOf(Date);
    });
  });

  describe('Given PII leak prevention (DSGVO Art. 9)', () => {
    it('should not expose PII in top-level JSON keys', () => {
      const patient = PatientEntity.create(validParams);
      const json = patient.toJSON();
      const topLevelKeys = Object.keys(json);

      // PII fields should only exist under encryptedData, not at top level
      expect(topLevelKeys).not.toContain('firstName');
      expect(topLevelKeys).not.toContain('lastName');
      expect(topLevelKeys).not.toContain('email');
      expect(topLevelKeys).not.toContain('phone');
      expect(topLevelKeys).not.toContain('birthDate');
    });
  });

  describe('Given optional fields', () => {
    it('should create without optional fields', () => {
      const patient = PatientEntity.create({
        firstName: 'Maria',
        lastName: 'Schmidt',
        birthDate: '1985-03-20',
        language: 'de',
      });

      expect(patient.encryptedData.gender).toBeUndefined();
      expect(patient.encryptedData.email).toBeUndefined();
      expect(patient.encryptedData.address).toBeUndefined();
    });

    it('should create with full address', () => {
      const patient = PatientEntity.create({
        ...validParams,
        address: {
          street: 'Musterstraße',
          houseNumber: '42',
          zip: '12345',
          city: 'Berlin',
          country: 'DE',
        },
      });

      expect(patient.encryptedData.address?.street).toBe('Musterstraße');
      expect(patient.encryptedData.address?.city).toBe('Berlin');
    });
  });
});
