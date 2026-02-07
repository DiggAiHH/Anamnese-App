/**
 * GDPRConsent Entity Tests
 *
 * DSGVO Art. 6/7: Consent lifecycle (grant, revoke, audit).
 * DSGVO Art. 7(3): Right to withdraw consent at any time.
 * Tests cover: creation, grant, revoke, expiration, audit trail, templates.
 */

import { GDPRConsentEntity, GDPRConsentTemplates } from '../../../src/domain/entities/GDPRConsent';

// Mock crypto.randomUUID
const mockUUID = 'abcdef12-3456-7890-abcd-ef1234567890';

beforeAll(() => {
  Object.defineProperty(globalThis, 'crypto', {
    value: {
      ...globalThis.crypto,
      randomUUID: () => mockUUID,
    },
    writable: true,
  });
});

describe('GDPRConsentEntity', () => {
  const patientId = '11111111-1111-1111-1111-111111111111';

  describe('Given consent creation', () => {
    it('should create consent with correct defaults', () => {
      const consent = GDPRConsentEntity.create({
        patientId,
        type: 'data_processing',
        privacyPolicyVersion: '1.0.0',
        legalBasis: 'consent',
        purpose: 'Datenverarbeitung',
        dataCategories: ['Gesundheitsdaten'],
        retentionPeriod: '3 years',
      });

      expect(consent.id).toBe(mockUUID);
      expect(consent.patientId).toBe(patientId);
      expect(consent.type).toBe('data_processing');
      expect(consent.granted).toBe(false); // Not granted by default
      expect(consent.grantedAt).toBeUndefined();
      expect(consent.auditLog).toHaveLength(0);
      expect(consent.legalBasis).toBe('consent');
    });

    it('should validate Zod schema on creation', () => {
      // Valid creation should not throw
      expect(() =>
        GDPRConsentEntity.create({
          patientId,
          type: 'data_processing',
          privacyPolicyVersion: '1.0.0',
          legalBasis: 'consent',
          purpose: 'Test',
          dataCategories: ['test'],
          retentionPeriod: '1 year',
        }),
      ).not.toThrow();
    });
  });

  describe('Given consent grant (DSGVO Art. 6/7)', () => {
    it('should grant consent with timestamp and audit entry', () => {
      const consent = GDPRConsentEntity.create({
        patientId,
        type: 'data_processing',
        privacyPolicyVersion: '1.0.0',
        legalBasis: 'consent',
        purpose: 'Test',
        dataCategories: ['test'],
        retentionPeriod: '3 years',
      });

      const granted = consent.grant();

      expect(granted.granted).toBe(true);
      expect(granted.grantedAt).toBeInstanceOf(Date);
      expect(granted.revokedAt).toBeUndefined();
      expect(granted.auditLog).toHaveLength(1);
      expect(granted.auditLog[0].action).toBe('granted');
    });

    it('should not allow double-grant', () => {
      const consent = GDPRConsentEntity.create({
        patientId,
        type: 'data_processing',
        privacyPolicyVersion: '1.0.0',
        legalBasis: 'consent',
        purpose: 'Test',
        dataCategories: ['test'],
        retentionPeriod: '3 years',
      });

      const granted = consent.grant();

      expect(() => granted.grant()).toThrow('Consent already granted');
    });
  });

  describe('Given consent revocation (DSGVO Art. 7(3))', () => {
    it('should revoke consent with timestamp and audit entry', () => {
      const consent = GDPRConsentEntity.create({
        patientId,
        type: 'data_processing',
        privacyPolicyVersion: '1.0.0',
        legalBasis: 'consent',
        purpose: 'Test',
        dataCategories: ['test'],
        retentionPeriod: '3 years',
      });

      const granted = consent.grant();
      const revoked = granted.revoke();

      expect(revoked.granted).toBe(false);
      expect(revoked.revokedAt).toBeInstanceOf(Date);
      expect(revoked.auditLog).toHaveLength(2);
      expect(revoked.auditLog[1].action).toBe('revoked');
    });

    it('should not allow revoking non-granted consent', () => {
      const consent = GDPRConsentEntity.create({
        patientId,
        type: 'data_processing',
        privacyPolicyVersion: '1.0.0',
        legalBasis: 'consent',
        purpose: 'Test',
        dataCategories: ['test'],
        retentionPeriod: '3 years',
      });

      expect(() => consent.revoke()).toThrow('Consent not granted');
    });
  });

  describe('Given validity checks', () => {
    it('should report valid for granted consent', () => {
      const consent = GDPRConsentEntity.create({
        patientId,
        type: 'data_storage',
        privacyPolicyVersion: '1.0.0',
        legalBasis: 'consent',
        purpose: 'Test',
        dataCategories: ['test'],
        retentionPeriod: '3 years',
      });

      const granted = consent.grant();
      expect(granted.isValid()).toBe(true);
    });

    it('should report invalid for revoked consent', () => {
      const consent = GDPRConsentEntity.create({
        patientId,
        type: 'data_storage',
        privacyPolicyVersion: '1.0.0',
        legalBasis: 'consent',
        purpose: 'Test',
        dataCategories: ['test'],
        retentionPeriod: '3 years',
      });

      const granted = consent.grant();
      const revoked = granted.revoke();
      expect(revoked.isValid()).toBe(false);
    });
  });

  describe('Given retention period and expiration', () => {
    it('should calculate expiry date for years', () => {
      const consent = GDPRConsentEntity.create({
        patientId,
        type: 'data_processing',
        privacyPolicyVersion: '1.0.0',
        legalBasis: 'consent',
        purpose: 'Test',
        dataCategories: ['test'],
        retentionPeriod: '3 years',
      });

      const granted = consent.grant();
      const expiryDate = granted.calculateExpirationDate();

      expect(expiryDate).not.toBeNull();
      if (expiryDate) {
        const now = new Date();
        const expectedYear = now.getFullYear() + 3;
        expect(expiryDate.getFullYear()).toBe(expectedYear);
      }
    });

    it('should calculate expiry date for months', () => {
      const consent = GDPRConsentEntity.create({
        patientId,
        type: 'data_processing',
        privacyPolicyVersion: '1.0.0',
        legalBasis: 'consent',
        purpose: 'Test',
        dataCategories: ['test'],
        retentionPeriod: '6 months',
      });

      const granted = consent.grant();
      const expiryDate = granted.calculateExpirationDate();

      expect(expiryDate).not.toBeNull();
    });

    it('should not be expired immediately after grant', () => {
      const consent = GDPRConsentEntity.create({
        patientId,
        type: 'data_processing',
        privacyPolicyVersion: '1.0.0',
        legalBasis: 'consent',
        purpose: 'Test',
        dataCategories: ['test'],
        retentionPeriod: '3 years',
      });

      const granted = consent.grant();
      expect(granted.isExpired()).toBe(false);
    });

    it('should return null expiration date for ungranteed consent', () => {
      const consent = GDPRConsentEntity.create({
        patientId,
        type: 'data_processing',
        privacyPolicyVersion: '1.0.0',
        legalBasis: 'consent',
        purpose: 'Test',
        dataCategories: ['test'],
        retentionPeriod: '3 years',
      });

      expect(consent.calculateExpirationDate()).toBeNull();
    });
  });

  describe('Given serialization (JSON round-trip)', () => {
    it('should serialize and deserialize correctly', () => {
      const consent = GDPRConsentEntity.create({
        patientId,
        type: 'gdt_export',
        privacyPolicyVersion: '2.0.0',
        legalBasis: 'consent',
        purpose: 'GDT Export',
        dataCategories: ['Gesundheitsdaten', 'Anamnese'],
        recipients: ['PraxisVerwaltung'],
        retentionPeriod: '3 years',
      });

      const granted = consent.grant();
      const json = granted.toJSON();
      const restored = GDPRConsentEntity.fromJSON(json);

      expect(restored.id).toBe(granted.id);
      expect(restored.type).toBe('gdt_export');
      expect(restored.granted).toBe(true);
      expect(restored.grantedAt).toBeInstanceOf(Date);
      expect(restored.recipients).toEqual(['PraxisVerwaltung']);
      expect(restored.auditLog).toHaveLength(1);
    });
  });

  describe('Given consent templates', () => {
    it('should create data processing template (§ 630f BGB retention)', () => {
      const consent = GDPRConsentTemplates.dataProcessing(patientId);

      expect(consent.type).toBe('data_processing');
      expect(consent.retentionPeriod).toBe('3 years');
      expect(consent.legalBasis).toBe('consent');
      expect(consent.dataCategories).toContain('Gesundheitsdaten');
    });

    it('should create GDT export template with recipient', () => {
      const consent = GDPRConsentTemplates.gdtExport(patientId, 'medistar');

      expect(consent.type).toBe('gdt_export');
      expect(consent.recipients).toContain('medistar');
    });

    it('should create OCR processing template', () => {
      const consent = GDPRConsentTemplates.ocrProcessing(patientId);

      expect(consent.type).toBe('ocr_processing');
      expect(consent.purpose).toContain('OCR');
    });
  });

  describe('Given audit trail completeness (BSI CON.1)', () => {
    it('should maintain full audit trail through lifecycle', () => {
      const consent = GDPRConsentEntity.create({
        patientId,
        type: 'data_processing',
        privacyPolicyVersion: '1.0.0',
        legalBasis: 'consent',
        purpose: 'Test',
        dataCategories: ['test'],
        retentionPeriod: '3 years',
      });

      const granted = consent.grant();
      const revoked = granted.revoke();

      expect(revoked.auditLog).toHaveLength(2);
      expect(revoked.auditLog[0].action).toBe('granted');
      expect(revoked.auditLog[1].action).toBe('revoked');

      // Timestamps should be in order
      const t0 = revoked.auditLog[0].timestamp.getTime();
      const t1 = revoked.auditLog[1].timestamp.getTime();
      expect(t1).toBeGreaterThanOrEqual(t0);
    });
  });
});
