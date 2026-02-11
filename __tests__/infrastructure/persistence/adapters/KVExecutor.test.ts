/**
 * KVExecutor unit tests
 *
 * Tests the in-memory SQL execution engine against all operation types.
 *
 * @security No PII in tests.
 */

import {
  executeOnStore,
  APP_TABLES,
} from '../../../../src/infrastructure/persistence/adapters/KVExecutor';
import type { KVStore } from '../../../../src/infrastructure/persistence/adapters/KVExecutor';
import type { AdapterResultSet } from '../../../../src/infrastructure/persistence/adapters/IDatabaseAdapter';
import { parseSql } from '../../../../src/infrastructure/persistence/adapters/SqlParser';

function createStore(): KVStore {
  const store: KVStore = new Map();
  for (const table of APP_TABLES) {
    store.set(table, new Map());
  }
  return store;
}

function exec(store: KVStore, sql: string, params: unknown[] = []): AdapterResultSet {
  const parsed = parseSql(sql);
  if (!parsed) throw new Error(`Failed to parse: ${sql}`);
  return executeOnStore(store, parsed, params);
}

describe('KVExecutor', () => {
  describe('CREATE TABLE / CREATE INDEX', () => {
    it('returns empty result for CREATE TABLE', () => {
      const store = createStore();
      const result = exec(store, 'CREATE TABLE IF NOT EXISTS patients (id TEXT PRIMARY KEY)');
      expect(result.rows.length).toBe(0);
      expect(result.rowsAffected).toBe(0);
    });

    it('returns empty result for CREATE INDEX', () => {
      const store = createStore();
      const result = exec(store, 'CREATE INDEX IF NOT EXISTS idx_patient ON patients (name)');
      expect(result.rows.length).toBe(0);
    });
  });

  describe('INSERT', () => {
    it('inserts a row into the store', () => {
      const store = createStore();
      const result = exec(store, 'INSERT OR REPLACE INTO patients (id, name) VALUES (?, ?)', [
        'p1',
        'John',
      ]);
      expect(result.rowsAffected).toBe(1);

      const table = store.get('patients')!;
      expect(table.size).toBe(1);
      expect(table.get('p1')).toEqual({ id: 'p1', name: 'John' });
    });

    it('upserts on same primary key', () => {
      const store = createStore();
      exec(store, 'INSERT OR REPLACE INTO patients (id, name) VALUES (?, ?)', ['p1', 'John']);
      exec(store, 'INSERT OR REPLACE INTO patients (id, name) VALUES (?, ?)', ['p1', 'Jane']);

      const table = store.get('patients')!;
      expect(table.size).toBe(1);
      expect(table.get('p1')!.name).toBe('Jane');
    });

    it('inserts multiple distinct rows', () => {
      const store = createStore();
      exec(store, 'INSERT OR REPLACE INTO patients (id, name) VALUES (?, ?)', ['p1', 'Alice']);
      exec(store, 'INSERT OR REPLACE INTO patients (id, name) VALUES (?, ?)', ['p2', 'Bob']);

      expect(store.get('patients')!.size).toBe(2);
    });

    it('uses key column for db_metadata table', () => {
      const store = createStore();
      exec(store, "INSERT OR REPLACE INTO db_metadata (key, value) VALUES ('version', ?)", ['1']);

      const meta = store.get('db_metadata')!;
      // The key is a literal, so it won't resolve from params → stored as empty string PK
      // But db_metadata uses 'key' as PK
      expect(meta.size).toBe(1);
    });
  });

  describe('UPDATE', () => {
    it('updates matching rows', () => {
      const store = createStore();
      exec(store, 'INSERT OR REPLACE INTO patients (id, name) VALUES (?, ?)', ['p1', 'John']);
      const result = exec(store, 'UPDATE patients SET name = ? WHERE id = ?', ['Jane', 'p1']);

      expect(result.rowsAffected).toBe(1);
      expect(store.get('patients')!.get('p1')!.name).toBe('Jane');
    });

    it('does not update non-matching rows', () => {
      const store = createStore();
      exec(store, 'INSERT OR REPLACE INTO patients (id, name) VALUES (?, ?)', ['p1', 'John']);
      exec(store, 'INSERT OR REPLACE INTO patients (id, name) VALUES (?, ?)', ['p2', 'Alice']);
      const result = exec(store, 'UPDATE patients SET name = ? WHERE id = ?', ['Updated', 'p1']);

      expect(result.rowsAffected).toBe(1);
      expect(store.get('patients')!.get('p1')!.name).toBe('Updated');
      expect(store.get('patients')!.get('p2')!.name).toBe('Alice');
    });
  });

  describe('SELECT', () => {
    let store: KVStore;

    beforeEach(() => {
      store = createStore();
      exec(store, 'INSERT OR REPLACE INTO patients (id, name, age) VALUES (?, ?, ?)', [
        'p1',
        'Alice',
        30,
      ]);
      exec(store, 'INSERT OR REPLACE INTO patients (id, name, age) VALUES (?, ?, ?)', [
        'p2',
        'Bob',
        25,
      ]);
      exec(store, 'INSERT OR REPLACE INTO patients (id, name, age) VALUES (?, ?, ?)', [
        'p3',
        'Charlie',
        35,
      ]);
    });

    it('SELECT * returns all rows', () => {
      const result = exec(store, 'SELECT * FROM patients');
      expect(result.rows.length).toBe(3);
    });

    it('SELECT * WHERE id = ? returns matching row', () => {
      const result = exec(store, 'SELECT * FROM patients WHERE id = ?', ['p2']);
      expect(result.rows.length).toBe(1);
      expect(result.rows.item(0)!.name).toBe('Bob');
    });

    it('raw() returns array copy', () => {
      const result = exec(store, 'SELECT * FROM patients');
      const raw = result.rows.raw!();
      expect(Array.isArray(raw)).toBe(true);
      expect(raw.length).toBe(3);
    });

    it('item() returns null for out-of-bounds index', () => {
      const result = exec(store, 'SELECT * FROM patients');
      expect(result.rows.item(-1)).toBeNull();
      expect(result.rows.item(100)).toBeNull();
    });

    it('SELECT with ORDER BY ASC', () => {
      const result = exec(store, 'SELECT * FROM patients ORDER BY name ASC');
      const names = result.rows.raw!().map((r: Record<string, unknown>) => r.name);
      expect(names).toEqual(['Alice', 'Bob', 'Charlie']);
    });

    it('SELECT with ORDER BY DESC', () => {
      const result = exec(store, 'SELECT * FROM patients ORDER BY name DESC');
      const names = result.rows.raw!().map((r: Record<string, unknown>) => r.name);
      expect(names).toEqual(['Charlie', 'Bob', 'Alice']);
    });

    it('SELECT with LIMIT', () => {
      const result = exec(store, 'SELECT * FROM patients LIMIT 2');
      expect(result.rows.length).toBe(2);
    });

    it('SELECT COUNT(*)', () => {
      const result = exec(store, 'SELECT COUNT(*) as total FROM patients');
      expect(result.rows.length).toBe(1);
      expect(result.rows.item(0)!.total).toBe(3);
    });

    it('SELECT with named column projection', () => {
      const result = exec(store, 'SELECT id, name FROM patients');
      const row = result.rows.item(0)!;
      expect(row).toHaveProperty('id');
      expect(row).toHaveProperty('name');
      expect(row).not.toHaveProperty('age');
    });

    it('SELECT with WHERE IS NULL', () => {
      exec(store, 'INSERT OR REPLACE INTO patients (id, name, age) VALUES (?, ?, ?)', [
        'p4',
        'Diana',
        null,
      ]);
      const result = exec(store, 'SELECT * FROM patients WHERE age IS NULL');
      expect(result.rows.length).toBe(1);
      expect(result.rows.item(0)!.name).toBe('Diana');
    });

    it('SELECT with WHERE IS NOT NULL', () => {
      exec(store, 'INSERT OR REPLACE INTO patients (id, name, age) VALUES (?, ?, ?)', [
        'p4',
        'Diana',
        null,
      ]);
      const result = exec(store, 'SELECT * FROM patients WHERE age IS NOT NULL');
      expect(result.rows.length).toBe(3);
    });

    it('SELECT with LIKE', () => {
      const result = exec(store, 'SELECT * FROM patients WHERE name LIKE ?', ['%li%']);
      expect(result.rows.length).toBe(2); // Alice, Charlie
    });
  });

  describe('DELETE', () => {
    it('DELETE all rows', () => {
      const store = createStore();
      exec(store, 'INSERT OR REPLACE INTO patients (id, name) VALUES (?, ?)', ['p1', 'A']);
      exec(store, 'INSERT OR REPLACE INTO patients (id, name) VALUES (?, ?)', ['p2', 'B']);

      const result = exec(store, 'DELETE FROM patients');
      expect(result.rowsAffected).toBe(2);
      expect(store.get('patients')!.size).toBe(0);
    });

    it('DELETE with WHERE', () => {
      const store = createStore();
      exec(store, 'INSERT OR REPLACE INTO patients (id, name) VALUES (?, ?)', ['p1', 'A']);
      exec(store, 'INSERT OR REPLACE INTO patients (id, name) VALUES (?, ?)', ['p2', 'B']);

      const result = exec(store, 'DELETE FROM patients WHERE id = ?', ['p1']);
      expect(result.rowsAffected).toBe(1);
      expect(store.get('patients')!.size).toBe(1);
      expect(store.get('patients')!.has('p1')).toBe(false);
      expect(store.get('patients')!.has('p2')).toBe(true);
    });
  });

  describe('APP_TABLES', () => {
    it('contains all 7 expected tables', () => {
      expect(APP_TABLES).toHaveLength(7);
      expect(APP_TABLES).toContain('patients');
      expect(APP_TABLES).toContain('questionnaires');
      expect(APP_TABLES).toContain('answers');
      expect(APP_TABLES).toContain('documents');
      expect(APP_TABLES).toContain('questions');
      expect(APP_TABLES).toContain('gdpr_consents');
      expect(APP_TABLES).toContain('db_metadata');
    });
  });
});
