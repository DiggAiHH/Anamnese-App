/**
 * AsyncStorageAdapter unit tests
 *
 * Tests the AsyncStorage-backed database adapter with mocked AsyncStorage.
 *
 * @security No PII in tests.
 */

// Mock AsyncStorage before imports
const mockStorage = new Map<string, string>();
jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn((key: string) => Promise.resolve(mockStorage.get(key) ?? null)),
    setItem: jest.fn((key: string, value: string) => {
      mockStorage.set(key, value);
      return Promise.resolve();
    }),
    removeItem: jest.fn((key: string) => {
      mockStorage.delete(key);
      return Promise.resolve();
    }),
    multiGet: jest.fn((keys: string[]) =>
      Promise.resolve(keys.map(k => [k, mockStorage.get(k) ?? null] as [string, string | null])),
    ),
    multiRemove: jest.fn((keys: string[]) => {
      for (const k of keys) mockStorage.delete(k);
      return Promise.resolve();
    }),
  },
}));

import { AsyncStorageAdapter } from '../../../../src/infrastructure/persistence/adapters/AsyncStorageAdapter';

describe('AsyncStorageAdapter', () => {
  let adapter: AsyncStorageAdapter;

  beforeEach(async () => {
    mockStorage.clear();
    adapter = new AsyncStorageAdapter();
    await adapter.connect();
  });

  afterEach(async () => {
    await adapter.close();
  });

  it('has name "AsyncStorage"', () => {
    expect(adapter.name).toBe('AsyncStorage');
  });

  it('connect() is idempotent', async () => {
    // Already connected in beforeEach, calling again should not throw
    await adapter.connect();
  });

  describe('executeSql', () => {
    it('INSERT stores a row', async () => {
      await adapter.executeSql('INSERT OR REPLACE INTO patients (id, name) VALUES (?, ?)', [
        'p1',
        'Alice',
      ]);

      const result = await adapter.executeSql('SELECT * FROM patients');
      expect(result.rows.length).toBe(1);
      expect(result.rows.item(0)!.name).toBe('Alice');
    });

    it('INSERT persists to AsyncStorage', async () => {
      await adapter.executeSql('INSERT OR REPLACE INTO patients (id, name) VALUES (?, ?)', [
        'p1',
        'Alice',
      ]);

      // Verify data was persisted
      const stored = mockStorage.get('@anamnese_db/patients');
      expect(stored).toBeDefined();
      const parsed = JSON.parse(stored!);
      expect(parsed.p1).toBeDefined();
      expect(parsed.p1.name).toBe('Alice');
    });

    it('SELECT returns empty for no data', async () => {
      const result = await adapter.executeSql('SELECT * FROM patients');
      expect(result.rows.length).toBe(0);
    });

    it('UPDATE modifies matching rows', async () => {
      await adapter.executeSql('INSERT OR REPLACE INTO patients (id, name) VALUES (?, ?)', [
        'p1',
        'Alice',
      ]);
      await adapter.executeSql('UPDATE patients SET name = ? WHERE id = ?', ['Bob', 'p1']);

      const result = await adapter.executeSql('SELECT * FROM patients WHERE id = ?', ['p1']);
      expect(result.rows.item(0)!.name).toBe('Bob');
    });

    it('DELETE removes matching rows', async () => {
      await adapter.executeSql('INSERT OR REPLACE INTO patients (id, name) VALUES (?, ?)', [
        'p1',
        'Alice',
      ]);
      await adapter.executeSql('INSERT OR REPLACE INTO patients (id, name) VALUES (?, ?)', [
        'p2',
        'Bob',
      ]);

      const result = await adapter.executeSql('DELETE FROM patients WHERE id = ?', ['p1']);
      expect(result.rowsAffected).toBe(1);

      const all = await adapter.executeSql('SELECT * FROM patients');
      expect(all.rows.length).toBe(1);
    });

    it('returns empty result for unrecognised SQL', async () => {
      const result = await adapter.executeSql('DROP TABLE patients');
      expect(result.rows.length).toBe(0);
      expect(result.rowsAffected).toBe(0);
    });

    it('throws if not connected', async () => {
      const fresh = new AsyncStorageAdapter();
      await expect(fresh.executeSql('SELECT * FROM patients')).rejects.toThrow(
        '[AsyncStorageAdapter] Not connected',
      );
    });
  });

  describe('transaction', () => {
    it('executes multiple operations in a transaction', async () => {
      await adapter.transaction(async tx => {
        await tx.executeSql('INSERT OR REPLACE INTO patients (id, name) VALUES (?, ?)', [
          'p1',
          'Alice',
        ]);
        await tx.executeSql('INSERT OR REPLACE INTO patients (id, name) VALUES (?, ?)', [
          'p2',
          'Bob',
        ]);
      });

      const result = await adapter.executeSql('SELECT * FROM patients');
      expect(result.rows.length).toBe(2);
    });
  });

  describe('deleteAllData', () => {
    it('clears all tables', async () => {
      await adapter.executeSql('INSERT OR REPLACE INTO patients (id, name) VALUES (?, ?)', [
        'p1',
        'Alice',
      ]);
      await adapter.executeSql('INSERT OR REPLACE INTO answers (id, value) VALUES (?, ?)', [
        'a1',
        'yes',
      ]);

      await adapter.deleteAllData();

      const patients = await adapter.executeSql('SELECT * FROM patients');
      const answers = await adapter.executeSql('SELECT * FROM answers');
      expect(patients.rows.length).toBe(0);
      expect(answers.rows.length).toBe(0);
    });
  });

  describe('close', () => {
    it('clears internal state', async () => {
      await adapter.executeSql('INSERT OR REPLACE INTO patients (id, name) VALUES (?, ?)', [
        'p1',
        'Alice',
      ]);
      await adapter.close();

      // After close, executeSql should throw (not connected)
      await expect(adapter.executeSql('SELECT * FROM patients')).rejects.toThrow(
        '[AsyncStorageAdapter] Not connected',
      );
    });
  });

  describe('data survivability across connect/close cycles', () => {
    it('reloads persisted data on reconnect', async () => {
      await adapter.executeSql('INSERT OR REPLACE INTO patients (id, name) VALUES (?, ?)', [
        'p1',
        'Alice',
      ]);
      await adapter.close();

      // Create new adapter instance — should load from mockStorage
      const adapter2 = new AsyncStorageAdapter();
      await adapter2.connect();

      const result = await adapter2.executeSql('SELECT * FROM patients');
      expect(result.rows.length).toBe(1);
      expect(result.rows.item(0)!.name).toBe('Alice');

      await adapter2.close();
    });
  });
});
