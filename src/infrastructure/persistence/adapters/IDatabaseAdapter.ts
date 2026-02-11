/**
 * Database Adapter Interface
 *
 * Platform-agnostic abstraction over the storage backend.
 * Implementations:
 * - SQLiteNativeAdapter: Native SQLite (iOS, Android, Windows with native module)
 * - IndexedDBAdapter: Web (IndexedDB-based key-value + index store)
 * - AsyncStorageAdapter: Fallback (macOS, any platform without native SQLite)
 *
 * All adapters expose a SQL-like execute interface so that existing
 * repositories (SQLitePatientRepository, etc.) continue to work unchanged.
 *
 * @security No PII in adapter code. Storage encryption is handled at repository level.
 */

/**
 * Minimal row-set returned by executeSql.
 * Matches the shape used by DatabaseConnection.SQLiteExecuteResult.
 */
export interface AdapterResultSet {
  rows: {
    length: number;
    item: (index: number) => Record<string, unknown> | null;
    raw?: () => Record<string, unknown>[];
  };
  rowsAffected: number;
  insertId?: number;
}

/**
 * Transaction callback receives a lightweight tx object.
 */
export interface AdapterTransaction {
  executeSql(statement: string, params?: unknown[]): Promise<AdapterResultSet>;
}

/**
 * Core database adapter interface.
 * Every platform adapter must implement this contract.
 */
export interface IDatabaseAdapter {
  /** Human-readable adapter name (for logging). */
  readonly name: string;

  /**
   * Open / initialise the database.
   * Must be idempotent — calling connect() twice returns the same connection.
   */
  connect(): Promise<void>;

  /**
   * Execute a single SQL statement.
   * Params use `?` positional placeholders.
   */
  executeSql(statement: string, params?: unknown[]): Promise<AdapterResultSet>;

  /**
   * Run a set of statements inside a transaction.
   * If the callback throws, all changes are rolled back (where supported).
   * Adapters that don't support true transactions (AsyncStorage) must still
   * execute the callback and propagate errors, but atomicity is best-effort.
   */
  transaction<T>(fn: (tx: AdapterTransaction) => Promise<T> | T): Promise<T>;

  /**
   * Close the connection and release resources.
   */
  close(): Promise<void>;

  /**
   * Delete all rows from all application tables.
   * Used for GDPR Art. 17 (Right to Erasure).
   */
  deleteAllData(): Promise<void>;
}
