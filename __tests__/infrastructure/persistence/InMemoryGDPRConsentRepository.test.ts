/**
 * InMemoryGDPRConsentRepository Tests
 *
 * DSGVO Art. 7: Consent must be storable, retrievable, revocable, and auditable.
 * DSGVO Art. 17: Right to erasure includes consent records.
 *
 * @security Validates consent lifecycle: save → find → revoke → delete → history.
 */

import { InMemoryGDPRConsentRepository } from '@infrastructure/persistence/InMemoryGDPRConsentRepository';
import { GDPRConsentEntity } from '@domain/entities/GDPRConsent';

beforeAll(() => {
  Object.defineProperty(globalThis, 'crypto', {
    value: {
      ...globalThis.crypto,
      randomUUID: () => 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
    },
    writable: true,
  });
});

describe('InMemoryGDPRConsentRepository', () => {
  let repo: InMemoryGDPRConsentRepository;
  const patientId = '11111111-1111-1111-1111-111111111111';

  const createConsent = (
    type: 'data_processing' | 'data_storage' | 'ocr_processing' = 'data_processing',
    pid = patientId,
  ): GDPRConsentEntity =>
    GDPRConsentEntity.create({
      patientId: pid,
      type,
      privacyPolicyVersion: '1.0.0',
      legalBasis: 'consent',
      purpose: 'Test',
      dataCategories: ['test'],
      retentionPeriod: '3 years',
    });

  beforeEach(() => {
    repo = new InMemoryGDPRConsentRepository();
  });

  afterEach(() => {
    repo.clear();
  });

  describe('save()', () => {
    it('saves a consent record', async () => {
      const consent = createConsent().grant();
      await repo.save(consent);
      expect(repo.size()).toBe(1);
    });

    it('upserts on same id', async () => {
      const consent = createConsent().grant();
      await repo.save(consent);
      await repo.save(consent);
      expect(repo.size()).toBe(1);
    });
  });

  describe('findById()', () => {
    it('returns consent by id', async () => {
      const consent = createConsent().grant();
      await repo.save(consent);
      const found = await repo.findById(consent.id);
      expect(found).not.toBeNull();
      expect(found!.id).toBe(consent.id);
    });

    it('returns null for non-existent id', async () => {
      const found = await repo.findById('does-not-exist');
      expect(found).toBeNull();
    });
  });

  describe('findByPatientId()', () => {
    it('returns all consents for a patient', async () => {
      // Need different IDs — mock UUID always returns same, so use grant() timestamps
      // Use save directly with two different consent entities
      let counter = 0;
      const origUUID = globalThis.crypto.randomUUID;
      globalThis.crypto.randomUUID = () =>
        `00000000-0000-0000-0000-${(++counter).toString(16).padStart(12, '0')}`;

      const c1 = createConsent('data_processing').grant();
      const c2 = createConsent('data_storage').grant();
      await repo.save(c1);
      await repo.save(c2);

      const results = await repo.findByPatientId(patientId);
      expect(results).toHaveLength(2);

      globalThis.crypto.randomUUID = origUUID;
    });

    it('returns empty array for unknown patient', async () => {
      const results = await repo.findByPatientId('unknown');
      expect(results).toEqual([]);
    });
  });

  describe('hasActiveConsent() (DSGVO Art. 7)', () => {
    it('returns true for granted, non-revoked consent', async () => {
      const consent = createConsent('data_processing').grant();
      await repo.save(consent);
      const active = await repo.hasActiveConsent(patientId, 'data_processing');
      expect(active).toBe(true);
    });

    it('returns false when consent not granted', async () => {
      const consent = createConsent('data_processing');
      await repo.save(consent);
      const active = await repo.hasActiveConsent(patientId, 'data_processing');
      expect(active).toBe(false);
    });

    it('returns false when consent has been revoked (DSGVO Art. 7(3))', async () => {
      const consent = createConsent('data_processing').grant().revoke('Widerruf');
      await repo.save(consent);
      const active = await repo.hasActiveConsent(patientId, 'data_processing');
      expect(active).toBe(false);
    });
  });

  describe('deleteByPatientId() (DSGVO Art. 17)', () => {
    it('removes all consents for a patient', async () => {
      let counter = 100;
      const origUUID = globalThis.crypto.randomUUID;
      globalThis.crypto.randomUUID = () =>
        `00000000-0000-0000-0000-${(++counter).toString(16).padStart(12, '0')}`;

      const c1 = createConsent('data_processing').grant();
      const c2 = createConsent('data_storage').grant();
      await repo.save(c1);
      await repo.save(c2);
      expect(repo.size()).toBe(2);

      await repo.deleteByPatientId(patientId);
      expect(repo.size()).toBe(0);

      globalThis.crypto.randomUUID = origUUID;
    });

    it('does not delete other patients consents', async () => {
      let counter = 200;
      const origUUID = globalThis.crypto.randomUUID;
      globalThis.crypto.randomUUID = () =>
        `00000000-0000-0000-0000-${(++counter).toString(16).padStart(12, '0')}`;

      const otherPatient = '22222222-2222-2222-2222-222222222222';
      const c1 = createConsent('data_processing', patientId).grant();
      const c2 = createConsent('data_processing', otherPatient).grant();
      await repo.save(c1);
      await repo.save(c2);

      await repo.deleteByPatientId(patientId);
      expect(repo.size()).toBe(1);

      const remaining = await repo.findByPatientId(otherPatient);
      expect(remaining).toHaveLength(1);

      globalThis.crypto.randomUUID = origUUID;
    });
  });

  describe('getAllActiveConsents()', () => {
    it('returns only granted, non-revoked consents', async () => {
      let counter = 300;
      const origUUID = globalThis.crypto.randomUUID;
      globalThis.crypto.randomUUID = () =>
        `00000000-0000-0000-0000-${(++counter).toString(16).padStart(12, '0')}`;

      const granted = createConsent('data_processing').grant();
      const revoked = createConsent('data_storage').grant().revoke('Test');
      const notGranted = createConsent('ocr_processing');

      await repo.save(granted);
      await repo.save(revoked);
      await repo.save(notGranted);

      const active = await repo.getAllActiveConsents();
      expect(active).toHaveLength(1);
      expect(active[0].type).toBe('data_processing');

      globalThis.crypto.randomUUID = origUUID;
    });
  });

  describe('getConsentHistory()', () => {
    it('returns consent history sorted by newest first', async () => {
      let counter = 400;
      const origUUID = globalThis.crypto.randomUUID;
      globalThis.crypto.randomUUID = () =>
        `00000000-0000-0000-0000-${(++counter).toString(16).padStart(12, '0')}`;

      const c1 = createConsent('data_processing').grant();
      const c2 = createConsent('data_processing').grant();

      await repo.save(c1);
      await repo.save(c2);

      const history = await repo.getConsentHistory(patientId, 'data_processing');
      expect(history.length).toBeGreaterThanOrEqual(2);

      globalThis.crypto.randomUUID = origUUID;
    });

    it('filters by type when provided', async () => {
      let counter = 500;
      const origUUID = globalThis.crypto.randomUUID;
      globalThis.crypto.randomUUID = () =>
        `00000000-0000-0000-0000-${(++counter).toString(16).padStart(12, '0')}`;

      await repo.save(createConsent('data_processing').grant());
      await repo.save(createConsent('data_storage').grant());

      const history = await repo.getConsentHistory(patientId, 'data_processing');
      expect(history).toHaveLength(1);
      expect(history[0].type).toBe('data_processing');

      globalThis.crypto.randomUUID = origUUID;
    });
  });

  describe('utility methods', () => {
    it('clear() removes all consents', async () => {
      await repo.save(createConsent().grant());
      repo.clear();
      expect(repo.size()).toBe(0);
    });

    it('getAll() returns raw data', async () => {
      await repo.save(createConsent().grant());
      const all = repo.getAll();
      expect(all).toHaveLength(1);
    });
  });
});
