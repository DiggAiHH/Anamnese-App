/**
 * AsyncStorage Database Adapter
 *
 * Fallback persistent storage backend for platforms without native SQLite
 * or IndexedDB (e.g., macOS, or any platform where both are unavailable).
 *
 * Uses @react-native-async-storage/async-storage as the backing store.
 * Each table is stored under a prefix key: `@anamnese_db/<table>`.
 * The full table data is serialised as JSON (one key per table).
 *
 * Architecture:
 * - On connect(): loads all table data from AsyncStorage into in-memory KVStore.
 * - SQL operations execute against the in-memory store.
 * - Write operations persist the affected table back to AsyncStorage.
 *
 * Trade-offs:
 * - Simple and reliable (AsyncStorage is universal across RN platforms).
 * - Entire table (de)serialised on each write — acceptable for small datasets.
 * - No true transactions — best-effort atomicity.
 *
 * @security No PII in adapter code. All data is opaque rows.
 * @gdpr Art. 17: deleteAllData() clears all stored tables.
 */

import type { IDatabaseAdapter, AdapterResultSet, AdapterTransaction } from './IDatabaseAdapter';
import { parseSql } from './SqlParser';
import { executeOnStore, APP_TABLES } from './KVExecutor';
import type { KVStore, TableStore } from './KVExecutor';

const STORAGE_PREFIX = '@anamnese_db/';

/**
 * Lazy-load AsyncStorage to avoid import-time crashes on platforms where
 * the module might not be available.
 */
function getAsyncStorage(): typeof import('@react-native-async-storage/async-storage').default {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const mod = require('@react-native-async-storage/async-storage');
  return (mod?.default ??
    mod) as typeof import('@react-native-async-storage/async-storage').default;
}

/**
 * Serialise a TableStore to JSON string.
 */
function serialise(table: TableStore): string {
  const obj: Record<string, Record<string, unknown>> = {};
  for (const [key, row] of table.entries()) {
    obj[key] = row;
  }
  return JSON.stringify(obj);
}

/**
 * Deserialise a JSON string to TableStore.
 */
function deserialise(json: string | null): TableStore {
  const table: TableStore = new Map();
  if (!json) return table;
  try {
    const obj = JSON.parse(json) as Record<string, Record<string, unknown>>;
    for (const [key, row] of Object.entries(obj)) {
      table.set(key, row);
    }
  } catch {
    // Corrupted data — start fresh
  }
  return table;
}

export class AsyncStorageAdapter implements IDatabaseAdapter {
  readonly name = 'AsyncStorage';

  private store: KVStore = new Map();
  private connected = false;

  async connect(): Promise<void> {
    if (this.connected) return;

    const AsyncStorage = getAsyncStorage();

    // Load all tables from AsyncStorage
    const keys = APP_TABLES.map(t => `${STORAGE_PREFIX}${t}`);
    const pairs = await AsyncStorage.multiGet(keys);

    for (const [storageKey, value] of pairs) {
      const tableName = storageKey.replace(STORAGE_PREFIX, '');
      this.store.set(tableName, deserialise(value ?? null));
    }

    // Ensure all tables exist in memory even if not in storage
    for (const table of APP_TABLES) {
      if (!this.store.has(table)) {
        this.store.set(table, new Map());
      }
    }

    this.connected = true;
  }

  async executeSql(statement: string, params: unknown[] = []): Promise<AdapterResultSet> {
    if (!this.connected) {
      throw new Error('[AsyncStorageAdapter] Not connected');
    }

    const parsed = parseSql(statement);
    if (!parsed) {
      return {
        rows: { length: 0, item: () => null, raw: () => [] },
        rowsAffected: 0,
      };
    }

    const result = executeOnStore(this.store, parsed, params);

    // Persist affected table for write operations
    if (parsed.type === 'INSERT' || parsed.type === 'UPDATE' || parsed.type === 'DELETE') {
      await this.persistTable(parsed.table);
    }

    return result;
  }

  async transaction<T>(fn: (tx: AdapterTransaction) => Promise<T> | T): Promise<T> {
    const tx: AdapterTransaction = {
      executeSql: async (statement: string, params?: unknown[]) => {
        return this.executeSql(statement, params);
      },
    };

    return fn(tx);
  }

  async close(): Promise<void> {
    this.store.clear();
    this.connected = false;
  }

  async deleteAllData(): Promise<void> {
    const AsyncStorage = getAsyncStorage();

    for (const table of APP_TABLES) {
      const memTable = this.store.get(table);
      if (memTable) memTable.clear();
    }

    // Clear all storage keys
    const keys = APP_TABLES.map(t => `${STORAGE_PREFIX}${t}`);
    await AsyncStorage.multiRemove(keys);
  }

  /**
   * Persist a single table to AsyncStorage.
   */
  private async persistTable(tableName: string): Promise<void> {
    const AsyncStorage = getAsyncStorage();
    const table = this.store.get(tableName);
    if (!table) return;

    const key = `${STORAGE_PREFIX}${tableName}`;
    const json = serialise(table);
    await AsyncStorage.setItem(key, json);
  }
}
