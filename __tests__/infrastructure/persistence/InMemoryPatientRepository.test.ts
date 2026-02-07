/**
 * Unit tests for InMemoryPatientRepository.
 */

import { InMemoryPatientRepository } from '@infrastructure/persistence/InMemoryPatientRepository';
import { PatientEntity } from '@domain/entities/Patient';

describe('InMemoryPatientRepository', () => {
  let repository: InMemoryPatientRepository;

  beforeEach(() => {
    repository = new InMemoryPatientRepository();
  });

  afterEach(() => {
    repository.clear();
  });

  const createTestPatient = (overrides?: Partial<Parameters<typeof PatientEntity.create>[0]>) => {
    return PatientEntity.create({
      firstName: 'Max',
      lastName: 'Mustermann',
      birthDate: '1990-01-15',
      language: 'de',
      gender: 'male',
      ...overrides,
    });
  };

  describe('save()', () => {
    it('should save a patient', async () => {
      const patient = createTestPatient();
      
      await repository.save(patient);
      
      expect(repository.size()).toBe(1);
    });

    it('should update existing patient on save', async () => {
      const patient = createTestPatient();
      await repository.save(patient);
      
      // Save again (same ID)
      await repository.save(patient);
      
      expect(repository.size()).toBe(1);
    });
  });

  describe('findById()', () => {
    it('should find patient by id', async () => {
      const patient = createTestPatient();
      await repository.save(patient);
      
      const found = await repository.findById(patient.id);
      
      expect(found).not.toBeNull();
      expect(found?.id).toBe(patient.id);
    });

    it('should return null for non-existent id', async () => {
      const found = await repository.findById('non-existent-id');
      
      expect(found).toBeNull();
    });
  });

  describe('findAll()', () => {
    it('should return empty array when no patients', async () => {
      const patients = await repository.findAll();
      
      expect(patients).toEqual([]);
    });

    it('should return all patients', async () => {
      const patient1 = createTestPatient({ firstName: 'Max' });
      const patient2 = createTestPatient({ firstName: 'Anna' });
      
      await repository.save(patient1);
      await repository.save(patient2);
      
      const patients = await repository.findAll();
      
      expect(patients).toHaveLength(2);
    });
  });

  describe('delete()', () => {
    it('should delete patient by id', async () => {
      const patient = createTestPatient();
      await repository.save(patient);
      
      await repository.delete(patient.id);
      
      expect(repository.size()).toBe(0);
      const found = await repository.findById(patient.id);
      expect(found).toBeNull();
    });

    it('should not throw when deleting non-existent patient', async () => {
      await expect(repository.delete('non-existent-id')).resolves.not.toThrow();
    });
  });

  describe('exists()', () => {
    it('should return true for existing patient', async () => {
      const patient = createTestPatient();
      await repository.save(patient);
      
      const exists = await repository.exists(patient.id);
      
      expect(exists).toBe(true);
    });

    it('should return false for non-existent patient', async () => {
      const exists = await repository.exists('non-existent-id');
      
      expect(exists).toBe(false);
    });
  });

  describe('search()', () => {
    it('should find patients by first name', async () => {
      const patient1 = createTestPatient({ firstName: 'Max', lastName: 'Müller' });
      const patient2 = createTestPatient({ firstName: 'Anna', lastName: 'Schmidt' });
      
      await repository.save(patient1);
      await repository.save(patient2);
      
      const results = await repository.search('Max');
      
      expect(results).toHaveLength(1);
      expect(results[0].encryptedData.firstName).toBe('Max');
    });

    it('should find patients by last name', async () => {
      const patient1 = createTestPatient({ firstName: 'Max', lastName: 'Müller' });
      const patient2 = createTestPatient({ firstName: 'Anna', lastName: 'Schmidt' });
      
      await repository.save(patient1);
      await repository.save(patient2);
      
      const results = await repository.search('Schmidt');
      
      expect(results).toHaveLength(1);
      expect(results[0].encryptedData.lastName).toBe('Schmidt');
    });

    it('should be case-insensitive', async () => {
      const patient = createTestPatient({ firstName: 'Max' });
      await repository.save(patient);
      
      const results = await repository.search('max');
      
      expect(results).toHaveLength(1);
    });

    it('should return empty array for no matches', async () => {
      const patient = createTestPatient();
      await repository.save(patient);
      
      const results = await repository.search('NonExistent');
      
      expect(results).toEqual([]);
    });
  });

  describe('utility methods', () => {
    it('clear() should remove all patients', async () => {
      await repository.save(createTestPatient());
      await repository.save(createTestPatient());
      
      repository.clear();
      
      expect(repository.size()).toBe(0);
    });

    it('getAll() should return raw data', async () => {
      const patient = createTestPatient();
      await repository.save(patient);
      
      const all = repository.getAll();
      
      expect(all).toHaveLength(1);
      expect(all[0].id).toBe(patient.id);
    });
  });
});
