/**
 * LocalStorageUserRepository Tests
 *
 * Tests localStorage-backed user persistence for web platform.
 * Uses mock localStorage implementation.
 */

import { LocalStorageUserRepository } from '../../../src/infrastructure/persistence/LocalStorageUserRepository';
import type { UserEntity } from '../../../src/domain/entities/User';
import { createUser } from '../../../src/domain/entities/User';

// Mock localStorage
const mockStorage = new Map<string, string>();
const mockLocalStorage = {
  getItem: jest.fn((key: string) => mockStorage.get(key) ?? null),
  setItem: jest.fn((key: string, value: string) => { mockStorage.set(key, value); }),
  removeItem: jest.fn((key: string) => { mockStorage.delete(key); }),
  clear: jest.fn(() => { mockStorage.clear(); }),
  get length() { return mockStorage.size; },
  key: jest.fn((_: number) => null),
};

Object.defineProperty(globalThis, 'localStorage', { value: mockLocalStorage, writable: true });

describe('LocalStorageUserRepository', () => {
  let repo: LocalStorageUserRepository;

  beforeEach(() => {
    mockStorage.clear();
    jest.clearAllMocks();
    repo = new LocalStorageUserRepository();
  });

  const makeUser = (email = 'test@example.com'): UserEntity =>
    createUser('therapist', email, 'hashed-password-123', 'Dr. Test');

  describe('save + findById', () => {
    it('should save and retrieve a user by ID', async () => {
      const user = makeUser();
      await repo.save(user);

      const found = await repo.findById(user.id);
      expect(found).not.toBeNull();
      expect(found!.id).toBe(user.id);
      expect(found!.email).toBe('test@example.com');
      expect(found!.displayName).toBe('Dr. Test');
    });

    it('should return null for non-existent ID', async () => {
      const found = await repo.findById('non-existent');
      expect(found).toBeNull();
    });

    it('should persist data in localStorage', async () => {
      const user = makeUser();
      await repo.save(user);

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'anamnese_users',
        expect.any(String),
      );
    });
  });

  describe('findByEmail', () => {
    it('should find user by email (case-sensitive)', async () => {
      const user = makeUser('therapist@clinic.de');
      await repo.save(user);

      const found = await repo.findByEmail('therapist@clinic.de');
      expect(found).not.toBeNull();
      expect(found!.id).toBe(user.id);
    });

    it('should return null for non-existent email', async () => {
      const found = await repo.findByEmail('nobody@nowhere.com');
      expect(found).toBeNull();
    });
  });

  describe('findByRole', () => {
    it('should filter users by role', async () => {
      await repo.save(createUser('therapist', 'doc@clinic.de', 'hash1', 'Doc'));
      await repo.save(createUser('patient', 'pat@home.de', 'hash2', 'Pat'));
      await repo.save(createUser('therapist', 'doc2@clinic.de', 'hash3', 'Doc2'));

      const therapists = await repo.findByRole('therapist');
      expect(therapists).toHaveLength(2);
      expect(therapists.every(u => u.role === 'therapist')).toBe(true);

      const patients = await repo.findByRole('patient');
      expect(patients).toHaveLength(1);
      expect(patients[0].displayName).toBe('Pat');
    });
  });

  describe('update', () => {
    it('should update an existing user', async () => {
      const user = makeUser();
      await repo.save(user);

      user.displayName = 'Updated Name';
      user.failedAttempts = 3;
      await repo.update(user);

      const found = await repo.findById(user.id);
      expect(found!.displayName).toBe('Updated Name');
      expect(found!.failedAttempts).toBe(3);
    });

    it('should not affect other users', async () => {
      const user1 = makeUser('user1@test.de');
      const user2 = makeUser('user2@test.de');
      await repo.save(user1);
      await repo.save(user2);

      user1.displayName = 'Changed';
      await repo.update(user1);

      const found2 = await repo.findById(user2.id);
      expect(found2!.displayName).toBe('Dr. Test');
    });
  });

  describe('delete', () => {
    it('should remove user by ID', async () => {
      const user = makeUser();
      await repo.save(user);
      await repo.delete(user.id);

      const found = await repo.findById(user.id);
      expect(found).toBeNull();
    });

    it('should not affect other users', async () => {
      const user1 = makeUser('user1@test.de');
      const user2 = makeUser('user2@test.de');
      await repo.save(user1);
      await repo.save(user2);

      await repo.delete(user1.id);

      const found2 = await repo.findById(user2.id);
      expect(found2).not.toBeNull();
    });
  });

  describe('corrupt localStorage', () => {
    it('should handle invalid JSON gracefully', async () => {
      mockStorage.set('anamnese_users', 'not-valid-json');
      const found = await repo.findById('any-id');
      expect(found).toBeNull();
    });
  });
});
