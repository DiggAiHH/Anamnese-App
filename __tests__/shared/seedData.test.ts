/**
 * Seed Data Tests
 */

import {
  SEED_PATIENTS,
  SEED_ANSWERS,
  createSeedPatient,
  getRandomSeedPatient,
  getSeedPatientByLanguage,
  SeedData,
} from '../../src/shared/seedData';

describe('SeedData', () => {
  describe('SEED_PATIENTS', () => {
    it('should have at least 10 demo patients', () => {
      expect(SEED_PATIENTS.length).toBeGreaterThanOrEqual(10);
    });

    it('should have patients with different languages', () => {
      const languages = new Set(SEED_PATIENTS.map(p => p.language));
      expect(languages.size).toBeGreaterThanOrEqual(8);
    });

    it('should have patients with all genders', () => {
      const genders = new Set(SEED_PATIENTS.map(p => p.gender));
      expect(genders.has('male')).toBe(true);
      expect(genders.has('female')).toBe(true);
      expect(genders.has('other')).toBe(true);
    });

    it('should have valid birth dates (ISO 8601)', () => {
      SEED_PATIENTS.forEach(p => {
        const date = new Date(p.birthDate);
        expect(date.toString()).not.toBe('Invalid Date');
      });
    });
  });

  describe('SEED_ANSWERS', () => {
    it('should have sample answers', () => {
      expect(Object.keys(SEED_ANSWERS).length).toBeGreaterThan(0);
    });

    it('should include basic data answers', () => {
      expect(SEED_ANSWERS['0000']).toBeDefined(); // Last name
      expect(SEED_ANSWERS['0001']).toBeDefined(); // First name
    });
  });

  describe('createSeedPatient', () => {
    it('should create a valid PatientEntity', () => {
      const seed = SEED_PATIENTS[0];
      const patient = createSeedPatient(seed);

      expect(patient.id).toBeDefined();
      expect(patient.encryptedData.firstName).toBe(seed.firstName);
      expect(patient.encryptedData.lastName).toBe(seed.lastName);
      expect(patient.language).toBe(seed.language);
    });

    it('should include GDPR consents', () => {
      const seed = SEED_PATIENTS[0];
      const patient = createSeedPatient(seed);

      expect(patient.gdprConsents.length).toBeGreaterThanOrEqual(3);

      const consentTypes = patient.gdprConsents.map(c => c.type);
      expect(consentTypes).toContain('data_processing');
      expect(consentTypes).toContain('data_storage');
      expect(consentTypes).toContain('gdt_export');
    });
  });

  describe('getRandomSeedPatient', () => {
    it('should return a valid seed patient', () => {
      const patient = getRandomSeedPatient();
      expect(patient).toBeDefined();
      expect(patient.firstName).toBeDefined();
      expect(patient.lastName).toBeDefined();
      expect(patient.language).toBeDefined();
    });
  });

  describe('getSeedPatientByLanguage', () => {
    it('should find German patient', () => {
      const patient = getSeedPatientByLanguage('de');
      expect(patient).toBeDefined();
      expect(patient?.language).toBe('de');
    });

    it('should find English patient', () => {
      const patient = getSeedPatientByLanguage('en');
      expect(patient).toBeDefined();
      expect(patient?.language).toBe('en');
    });

    it('should return undefined for unavailable language', () => {
      const patient = getSeedPatientByLanguage('xx');
      expect(patient).toBeUndefined();
    });
  });

  describe('SeedData namespace', () => {
    it('should export all functions', () => {
      expect(SeedData.patients).toBe(SEED_PATIENTS);
      expect(SeedData.answers).toBe(SEED_ANSWERS);
      expect(SeedData.createPatient).toBe(createSeedPatient);
      expect(SeedData.getRandom).toBe(getRandomSeedPatient);
      expect(SeedData.getByLanguage).toBe(getSeedPatientByLanguage);
    });
  });
});
