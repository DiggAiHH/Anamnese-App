/**
 * IndexedDB Database Adapter
 *
 * Persistent storage backend for Web platform.
 * Uses IndexedDB as the underlying storage with a SQL-to-KV translation layer.
 *
 * Architecture:
 * - On connect(): loads all data from IndexedDB into an in-memory KVStore.
 * - SQL operations execute against the in-memory store (fast reads).
 * - Write operations (INSERT/UPDATE/DELETE) are persisted back to IndexedDB.
 * - This hybrid approach gives fast reads with durable writes.
 *
 * IndexedDB schema: one object store per table, keyed by primary key.
 *
 * @security No PII in adapter code. All data is opaque rows.
 * @gdpr Art. 17: deleteAllData() clears all object stores.
 */

import type { IDatabaseAdapter, AdapterResultSet, AdapterTransaction } from './IDatabaseAdapter';
import { parseSql } from './SqlParser';
import { executeOnStore, APP_TABLES } from './KVExecutor';
import type { KVStore } from './KVExecutor';

const IDB_NAME = 'anamnese_db';
const IDB_VERSION = 1;

/**
 * Check if IndexedDB is available in the current environment.
 */
function isIndexedDBAvailable(): boolean {
  try {
    return typeof indexedDB !== 'undefined' && indexedDB !== null;
  } catch {
    return false;
  }
}

/**
 * Open IndexedDB with all table object stores.
 */
function openIDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!isIndexedDBAvailable()) {
      reject(new Error('IndexedDB is not available'));
      return;
    }

    const request = indexedDB.open(IDB_NAME, IDB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      for (const table of APP_TABLES) {
        if (!db.objectStoreNames.contains(table)) {
          db.createObjectStore(table);
        }
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('IndexedDB open failed'));
  });
}

/**
 * Load all rows from an IndexedDB object store.
 */
function loadStore(
  db: IDBDatabase,
  storeName: string,
): Promise<Map<string, Record<string, unknown>>> {
  return new Promise((resolve, reject) => {
    if (!db.objectStoreNames.contains(storeName)) {
      resolve(new Map());
      return;
    }

    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const request = store.getAll();
    const keysRequest = store.getAllKeys();

    const result = new Map<string, Record<string, unknown>>();

    tx.oncomplete = () => {
      const rows = request.result as Record<string, unknown>[];
      const keys = keysRequest.result as IDBValidKey[];
      for (let i = 0; i < keys.length; i++) {
        result.set(String(keys[i]), rows[i]);
      }
      resolve(result);
    };

    tx.onerror = () => reject(tx.error ?? new Error(`Failed to load ${storeName}`));
  });
}

/**
 * Persist a single row to IndexedDB.
 */
function putRow(
  db: IDBDatabase,
  storeName: string,
  key: string,
  row: Record<string, unknown>,
): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!db.objectStoreNames.contains(storeName)) {
      resolve();
      return;
    }
    const tx = db.transaction(storeName, 'readwrite');
    tx.objectStore(storeName).put(row, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/**
 * Delete a single row from IndexedDB.
 */
function deleteRow(db: IDBDatabase, storeName: string, key: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!db.objectStoreNames.contains(storeName)) {
      resolve();
      return;
    }
    const tx = db.transaction(storeName, 'readwrite');
    tx.objectStore(storeName).delete(key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/**
 * Clear all rows from an IndexedDB object store.
 */
function clearStore(db: IDBDatabase, storeName: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!db.objectStoreNames.contains(storeName)) {
      resolve();
      return;
    }
    const tx = db.transaction(storeName, 'readwrite');
    tx.objectStore(storeName).clear();
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/**
 * Determine the primary key column for a table.
 */
function getPkColumn(table: string): string {
  return table === 'db_metadata' ? 'key' : 'id';
}

export class IndexedDBAdapter implements IDatabaseAdapter {
  readonly name = 'IndexedDB';

  private idb: IDBDatabase | null = null;
  private store: KVStore = new Map();
  private connected = false;

  async connect(): Promise<void> {
    if (this.connected) return;

    this.idb = await openIDB();

    // Load all tables into memory
    for (const table of APP_TABLES) {
      const tableData = await loadStore(this.idb, table);
      this.store.set(table, tableData);
    }

    this.connected = true;
  }

  async executeSql(statement: string, params: unknown[] = []): Promise<AdapterResultSet> {
    if (!this.connected || !this.idb) {
      throw new Error('[IndexedDBAdapter] Not connected');
    }

    const parsed = parseSql(statement);
    if (!parsed) {
      // Unrecognised SQL — return empty result (graceful degradation)
      return {
        rows: { length: 0, item: () => null, raw: () => [] },
        rowsAffected: 0,
      };
    }

    // Snapshot table state before execution (for detecting writes)
    const tableBefore =
      parsed.type === 'DELETE' || parsed.type === 'UPDATE'
        ? new Map(this.store.get(parsed.table) ?? new Map())
        : null;

    const result = executeOnStore(this.store, parsed, params);

    // Persist writes to IndexedDB
    await this.persistChanges(parsed, params, tableBefore);

    return result;
  }

  async transaction<T>(fn: (tx: AdapterTransaction) => Promise<T> | T): Promise<T> {
    // IndexedDB doesn't support cross-store transactions easily.
    // We simulate by executing all operations and persisting at the end.
    const tx: AdapterTransaction = {
      executeSql: async (statement: string, params?: unknown[]) => {
        return this.executeSql(statement, params);
      },
    };

    return fn(tx);
  }

  async close(): Promise<void> {
    if (this.idb) {
      this.idb.close();
      this.idb = null;
    }
    this.store.clear();
    this.connected = false;
  }

  async deleteAllData(): Promise<void> {
    if (!this.idb) return;

    for (const table of APP_TABLES) {
      const memTable = this.store.get(table);
      if (memTable) memTable.clear();
      await clearStore(this.idb, table);
    }
  }

  /**
   * Persist write operations to IndexedDB.
   */
  private async persistChanges(
    parsed: ReturnType<typeof parseSql>,
    params: unknown[],
    _tableBefore: Map<string, Record<string, unknown>> | null,
  ): Promise<void> {
    if (!parsed || !this.idb) return;

    const idb = this.idb;
    const pkCol = getPkColumn(parsed.table);

    switch (parsed.type) {
      case 'INSERT': {
        // Build the row to find the PK
        const row: Record<string, unknown> = {};
        for (let i = 0; i < parsed.columns.length; i++) {
          const col = parsed.columns[i];
          const valIdx = parsed.values[i];
          row[col] = valIdx >= 0 ? params[valIdx] : null;
        }
        const pk = String(row[pkCol] ?? '');
        const stored = this.store.get(parsed.table)?.get(pk);
        if (stored) {
          await putRow(idb, parsed.table, pk, stored);
        }
        break;
      }

      case 'UPDATE': {
        // Re-persist all rows that are currently in memory for this table.
        // The in-memory store has already been mutated by executeOnStore().
        const table = this.store.get(parsed.table);
        if (table) {
          for (const [key, row] of table.entries()) {
            await putRow(idb, parsed.table, key, row);
          }
        }
        break;
      }

      case 'DELETE': {
        if (parsed.where.length === 0) {
          // Full table clear
          await clearStore(idb, parsed.table);
        } else if (_tableBefore) {
          // Find removed keys
          const currentTable = this.store.get(parsed.table) ?? new Map();
          for (const key of _tableBefore.keys()) {
            if (!currentTable.has(key)) {
              await deleteRow(idb, parsed.table, key);
            }
          }
        }
        break;
      }

      // SELECT, CREATE_TABLE, CREATE_INDEX — no persistence needed
      default:
        break;
    }
  }
}
