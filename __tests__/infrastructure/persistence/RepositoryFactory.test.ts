/**
 * RepositoryFactory Tests - Platform-aware repository creation
 */

jest.mock('react-native', () => ({
  Platform: { OS: 'android' },
}));

describe('RepositoryFactory', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  describe('on native platform', () => {
    it('should create InMemoryUserRepository', () => {
      jest.mock('react-native', () => ({ Platform: { OS: 'android' } }));
      const { createUserRepoSync } = require('../../../src/infrastructure/persistence/RepositoryFactory');
      const repo = createUserRepoSync();
      expect(repo.constructor.name).toBe('InMemoryUserRepository');
    });

    it('should create InMemoryAppointmentRepository', () => {
      jest.mock('react-native', () => ({ Platform: { OS: 'android' } }));
      const { createAppointmentRepoSync } = require('../../../src/infrastructure/persistence/RepositoryFactory');
      const repo = createAppointmentRepoSync();
      expect(repo.constructor.name).toBe('InMemoryAppointmentRepository');
    });

    it('should create InMemorySessionNoteRepository', () => {
      jest.mock('react-native', () => ({ Platform: { OS: 'android' } }));
      const { createSessionNoteRepoSync } = require('../../../src/infrastructure/persistence/RepositoryFactory');
      const repo = createSessionNoteRepoSync();
      expect(repo.constructor.name).toBe('InMemorySessionNoteRepository');
    });
  });

  describe('on web platform', () => {
    beforeEach(() => {
      // Setup localStorage mock
      const storage = new Map<string, string>();
      Object.defineProperty(globalThis, 'localStorage', {
        value: {
          getItem: (k: string) => storage.get(k) ?? null,
          setItem: (k: string, v: string) => storage.set(k, v),
          removeItem: (k: string) => storage.delete(k),
          clear: () => storage.clear(),
          get length() { return storage.size; },
          key: () => null,
        },
        writable: true,
        configurable: true,
      });
    });

    it('should create LocalStorageUserRepository on web', () => {
      jest.mock('react-native', () => ({ Platform: { OS: 'web' } }));
      const { createUserRepoSync } = require('../../../src/infrastructure/persistence/RepositoryFactory');
      const repo = createUserRepoSync();
      expect(repo.constructor.name).toBe('LocalStorageUserRepository');
    });

    it('should create LocalStorageAppointmentRepository on web', () => {
      jest.mock('react-native', () => ({ Platform: { OS: 'web' } }));
      const { createAppointmentRepoSync } = require('../../../src/infrastructure/persistence/RepositoryFactory');
      const repo = createAppointmentRepoSync();
      expect(repo.constructor.name).toBe('LocalStorageAppointmentRepository');
    });

    it('should create LocalStorageSessionNoteRepository on web', () => {
      jest.mock('react-native', () => ({ Platform: { OS: 'web' } }));
      const { createSessionNoteRepoSync } = require('../../../src/infrastructure/persistence/RepositoryFactory');
      const repo = createSessionNoteRepoSync();
      expect(repo.constructor.name).toBe('LocalStorageSessionNoteRepository');
    });
  });
});
