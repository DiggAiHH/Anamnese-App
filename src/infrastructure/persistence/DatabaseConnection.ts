/**
 * SQLite Database Setup
 *
 * Verwendet react-native-sqlite-storage für lokale Datenbank
 * DSGVO-konform: Alle Daten lokal, verschlüsselt
 */

import { isRNFSAvailable, requireRNFS } from '@shared/rnfsSafe';
import { logWarn } from '@shared/logger';
import { canUseSQLite, platformOS, supportsSQLite } from '@shared/platformCapabilities';
import type { IDatabaseAdapter } from './adapters/IDatabaseAdapter';
import { createDatabaseAdapter } from './adapters/createDatabaseAdapter';

// Type imports only (no runtime evaluation)
import type { SQLiteDatabase, SQLiteTransaction } from 'react-native-sqlite-storage';

// Re-export types for consumers
export type { SQLiteDatabase, SQLiteTransaction };

// Define SQLiteExecuteResult interface locally to avoid import-time crash
export interface SQLiteExecuteResult {
  rows: {
    length: number;
    item: (index: number) => unknown;
    raw?: () => unknown[];
  };
  rowsAffected: number;
  insertId?: number;
}

// Conditional import: Only load react-native-sqlite-storage on non-Windows platforms
// This prevents "cannot read undefined" crash at module load time on Windows
let SQLite: typeof import('react-native-sqlite-storage').default | null = null;
if (canUseSQLite()) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const mod = require('react-native-sqlite-storage');
    SQLite = (mod?.default ?? mod) as typeof import('react-native-sqlite-storage').default;
    if (SQLite) {
      SQLite.DEBUG(typeof __DEV__ !== 'undefined' && __DEV__);
      SQLite.enablePromise(true);
    }
  } catch {
    // Module not available, SQLite remains null
  }
}

/**
 * Database Schema Version
 */
export const DB_VERSION = 1;
export const DB_NAME = 'anamnese.db';

/**
 * Database Connection Singleton
 */
export class DatabaseConnection {
  private db: SQLiteDatabase | null = null;
  private adapter: IDatabaseAdapter | null = null;
  private readonly dbName: string;

  constructor(dbName = DB_NAME) {
    this.dbName = dbName;
  }

  /**
   * Check if this connection is using a non-SQLite adapter (IndexedDB, AsyncStorage).
   */
  get isUsingAdapter(): boolean {
    return this.adapter !== null;
  }

  /**
   * Öffnet Datenbankverbindung
   */
  async connect(): Promise<SQLiteDatabase> {
    if (this.db) {
      return this.db;
    }

    if (!supportsSQLite || !canUseSQLite()) {
      // Try to create a platform-specific adapter (IndexedDB for web, AsyncStorage for macOS, etc.)
      const adapterInstance = createDatabaseAdapter();

      if (adapterInstance) {
        logWarn(`[Database] SQLite not available on ${platformOS}. Using ${adapterInstance.name} adapter.`);
        this.adapter = adapterInstance;
        await this.adapter.connect();

        // Run table initialisation through the adapter (CREATE TABLE IF NOT EXISTS are no-ops
        // for KV adapters, but INSERT OR REPLACE for db_metadata version still works)
        await this.initializeTablesViaAdapter();

        // Return a proxy SQLiteDatabase that delegates to the adapter
        this.db = this.createAdapterProxy();
        return this.db;
      }

      // No adapter available — fall back to skeletal mock (last resort)
      logWarn(`[Database] No persistence available on ${platformOS}. Using non-persistent Mock DB.`);
      this.db = this.createMockDb();
      return this.db;
    }

    try {
      if (!SQLite) {
        throw new Error('SQLite module not available');
      }
      this.db = await SQLite.openDatabase({
        name: this.dbName,
        location: 'default',
      });

      await this.initializeTables();

      return this.db;
    } catch (error) {
      throw new Error(
        `Failed to connect to database: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * SQL Helper that ensures connection and returns first result set
   */
  async executeSql(statement: string, params: unknown[] = []): Promise<SQLiteExecuteResult> {
    // Delegate to adapter if available
    if (this.adapter) {
      await this.connect(); // ensure connected
      const result = await this.adapter.executeSql(statement, params);
      return result as SQLiteExecuteResult;
    }

    const database = await this.connect();
    const [result] = await database.executeSql(statement, params);
    // Ensure result conforms to our local interface
    return {
      rows: result.rows,
      rowsAffected: result.rowsAffected ?? 0,
      insertId: result.insertId,
    };
  }

  /**
   * Run a transactional function if supported
   */
  async transaction<T>(fn: (tx: SQLiteTransaction) => Promise<T> | T): Promise<T> {
    // Delegate to adapter if available
    if (this.adapter) {
      await this.connect();
      return this.adapter.transaction(async (adapterTx) => {
        // Wrap adapter tx as SQLiteTransaction shape
        const wrappedTx = {
          executeSql: (sql: string, p?: unknown[]) => adapterTx.executeSql(sql, p),
        } as unknown as SQLiteTransaction;
        return fn(wrappedTx);
      });
    }

    const database = await this.connect();

    let result: T | undefined;
    await database.transaction(async tx => {
      result = await fn(tx);
    });

    return result as T;
  }

  /**
   * Schließt Datenbankverbindung
   */
  async close(): Promise<void> {
    if (this.adapter) {
      await this.adapter.close();
      this.adapter = null;
      this.db = null;
      return;
    }
    if (this.db) {
      await this.db.close();
      this.db = null;
    }
  }

  /**
   * Initialisiert Datenbank-Tabellen
   */
  private async initializeTables(): Promise<void> {
    if (!this.db) throw new Error('Database not connected');

    // Patients Table
    await this.db.executeSql(`
      CREATE TABLE IF NOT EXISTS patients (
        id TEXT PRIMARY KEY,
        encrypted_data TEXT NOT NULL,
        language TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        gdpr_consents TEXT NOT NULL,
        audit_log TEXT NOT NULL
      );
    `);

    // Questionnaires Table
    await this.db.executeSql(`
      CREATE TABLE IF NOT EXISTS questionnaires (
        id TEXT PRIMARY KEY,
        patient_id TEXT NOT NULL,
        version TEXT NOT NULL,
        sections TEXT NOT NULL,
        status TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        completed_at INTEGER,
        FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
      );
    `);

    // Create index on patient_id for faster queries
    await this.db.executeSql(`
      CREATE INDEX IF NOT EXISTS idx_questionnaires_patient_id 
      ON questionnaires(patient_id);
    `);

    // Answers Table
    await this.db.executeSql(`
      CREATE TABLE IF NOT EXISTS answers (
        id TEXT PRIMARY KEY,
        questionnaire_id TEXT NOT NULL,
        question_id TEXT NOT NULL,
        encrypted_value TEXT NOT NULL,
        question_type TEXT NOT NULL,
        source_type TEXT NOT NULL,
        confidence REAL,
        answered_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        audit_log TEXT NOT NULL,
        FOREIGN KEY (questionnaire_id) REFERENCES questionnaires(id) ON DELETE CASCADE
      );
    `);

    // Create composite index for faster lookups
    await this.db.executeSql(`
      CREATE INDEX IF NOT EXISTS idx_answers_questionnaire_question 
      ON answers(questionnaire_id, question_id);
    `);

    // Documents Table
    await this.db.executeSql(`
      CREATE TABLE IF NOT EXISTS documents (
        id TEXT PRIMARY KEY,
        patient_id TEXT NOT NULL,
        questionnaire_id TEXT,
        type TEXT NOT NULL,
        mime_type TEXT NOT NULL,
        file_name TEXT NOT NULL,
        file_size INTEGER NOT NULL,
        encrypted_file_path TEXT NOT NULL,
        ocr_data TEXT,
        ocr_consent_granted INTEGER NOT NULL DEFAULT 0,
        uploaded_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        audit_log TEXT NOT NULL,
        FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
        FOREIGN KEY (questionnaire_id) REFERENCES questionnaires(id) ON DELETE SET NULL
      );
    `);

    // Create index on patient_id
    await this.db.executeSql(`
      CREATE INDEX IF NOT EXISTS idx_documents_patient_id 
      ON documents(patient_id);
    `);

    // Questions Table (QuestionUniverse)
    await this.db.executeSql(`
      CREATE TABLE IF NOT EXISTS questions (
        id TEXT PRIMARY KEY,
        template_id TEXT NOT NULL,
        section_id TEXT,
        type TEXT NOT NULL,
        label_key TEXT NOT NULL,
        placeholder_key TEXT,
        required INTEGER NOT NULL DEFAULT 0,
        options_json TEXT,
        validation_json TEXT,
        conditions_json TEXT,
        depends_on TEXT,
        metadata_json TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        version INTEGER NOT NULL DEFAULT 1
      );
    `);

    // Create indices for common lookups
    await this.db.executeSql(`
      CREATE INDEX IF NOT EXISTS idx_questions_template_id 
      ON questions(template_id);
    `);

    await this.db.executeSql(`
      CREATE INDEX IF NOT EXISTS idx_questions_section_id 
      ON questions(section_id);
    `);

    // GDPR Consents Table
    await this.db.executeSql(`
      CREATE TABLE IF NOT EXISTS gdpr_consents (
        id TEXT PRIMARY KEY,
        patient_id TEXT NOT NULL,
        type TEXT NOT NULL,
        granted INTEGER NOT NULL,
        granted_at INTEGER,
        revoked_at INTEGER,
        privacy_policy_version TEXT NOT NULL,
        legal_basis TEXT NOT NULL,
        purpose TEXT NOT NULL,
        data_categories TEXT NOT NULL,
        recipients TEXT,
        retention_period TEXT NOT NULL,
        audit_log TEXT NOT NULL,
        FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
      );
    `);

    // Create composite index for consent lookups
    await this.db.executeSql(`
      CREATE INDEX IF NOT EXISTS idx_gdpr_consents_patient_type 
      ON gdpr_consents(patient_id, type);
    `);

    // Database Metadata Table (für Migrations)
    await this.db.executeSql(`
      CREATE TABLE IF NOT EXISTS db_metadata (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );
    `);

    // Set DB version (parameterized to prevent injection pattern)
    await this.db.executeSql(
      'INSERT OR REPLACE INTO db_metadata (key, value) VALUES (?, ?);',
      ['version', String(DB_VERSION)],
    );
  }

  /**
   * Führt Database Migration durch (für zukünftige Updates)
   */
  async migrate(_fromVersion: number, _toVersion: number): Promise<void> {
    if (!this.db) throw new Error('Database not connected');

    // Zukünftige Migrations hier implementieren
    // Beispiel:
    // if (fromVersion < 2) {
    //   await this.db.executeSql('ALTER TABLE patients ADD COLUMN ...');
    // }
  }

  /**
   * Löscht alle Daten (für DSGVO Recht auf Löschung)
   */
  async deleteAllData(): Promise<void> {
    if (this.adapter) {
      await this.adapter.deleteAllData();
      return;
    }

    if (!this.db) throw new Error('Database not connected');

    await this.db.executeSql('DELETE FROM gdpr_consents;');
    await this.db.executeSql('DELETE FROM answers;');
    await this.db.executeSql('DELETE FROM documents;');
    await this.db.executeSql('DELETE FROM questionnaires;');
    await this.db.executeSql('DELETE FROM patients;');
  }

  /**
   * Database Statistiken abrufen
   */
  async getStats(): Promise<{
    patients: number;
    questionnaires: number;
    answers: number;
    documents: number;
    dbSize: number; // in bytes
  }> {
    // Adapter path: use executeSql which already delegates
    if (this.adapter) {
      const safeAdapterCount = async (table: string): Promise<number> => {
        try {
          const result = await this.adapter!.executeSql(`SELECT COUNT(*) as count FROM ${table};`);
          if (result.rows.length === 0) return 0;
          const row = result.rows.item(0) as { count?: number } | null;
          return Number(row?.count ?? 0);
        } catch {
          return 0;
        }
      };
      return {
        patients: await safeAdapterCount('patients'),
        questionnaires: await safeAdapterCount('questionnaires'),
        answers: await safeAdapterCount('answers'),
        documents: await safeAdapterCount('documents'),
        dbSize: 0, // No file-based size for adapter stores
      };
    }

    if (!this.db) throw new Error('Database not connected');

    const [patientsResult] = await this.db.executeSql('SELECT COUNT(*) as count FROM patients;');
    const [questionnairesResult] = await this.db.executeSql(
      'SELECT COUNT(*) as count FROM questionnaires;',
    );
    const [answersResult] = await this.db.executeSql('SELECT COUNT(*) as count FROM answers;');
    const [documentsResult] = await this.db.executeSql('SELECT COUNT(*) as count FROM documents;');

    const safeCount = (result: SQLiteExecuteResult): number => {
      if (!result?.rows || result.rows.length === 0) return 0;
      const row = result.rows.item(0) as { count?: number } | null;
      const count = row?.count ?? 0;
      return Number.isFinite(count) ? count : 0;
    };

    // Database size (approximation)
    let dbSize = 0;
    try {
      if (isRNFSAvailable()) {
        const RNFS = requireRNFS();
        const dbPath = `${RNFS.DocumentDirectoryPath}/${this.dbName}`;
        const stats = await RNFS.stat(dbPath);
        dbSize = parseInt(String(stats.size), 10);
      }
    } catch {
      dbSize = 0;
    }

    return {
      patients: safeCount(patientsResult as SQLiteExecuteResult),
      questionnaires: safeCount(questionnairesResult as SQLiteExecuteResult),
      answers: safeCount(answersResult as SQLiteExecuteResult),
      documents: safeCount(documentsResult as SQLiteExecuteResult),
      dbSize,
    };
  }

  /**
   * Initialise tables via the adapter (runs the same DDL + metadata INSERT).
   * CREATE TABLE/INDEX are no-ops for KV adapters, but the db_metadata
   * INSERT OR REPLACE ensures version tracking works.
   */
  private async initializeTablesViaAdapter(): Promise<void> {
    if (!this.adapter) return;

    // DDL statements are no-ops in KV adapters — but we run them for consistency
    // Only the db_metadata insert actually matters
    await this.adapter.executeSql(
      'INSERT OR REPLACE INTO db_metadata (key, value) VALUES (?, ?);',
      ['version', String(DB_VERSION)],
    );
  }

  /**
   * Create a proxy SQLiteDatabase that delegates to the adapter.
   * This allows existing repositories (which call db.executeSql) to work unchanged.
   */
  private createAdapterProxy(): SQLiteDatabase {
    const adapter = this.adapter!;
    return {
      transaction: async (scope: (tx: SQLiteTransaction) => void) => {
        await adapter.transaction(async (adapterTx) => {
          const wrappedTx = {
            executeSql: (sql: string, p?: unknown[]) => adapterTx.executeSql(sql, p),
          } as unknown as SQLiteTransaction;
          scope(wrappedTx);
        });
      },
      readTransaction: async (scope: (tx: SQLiteTransaction) => void) => {
        // Delegate read transactions to normal transactions
        await adapter.transaction(async (adapterTx) => {
          const wrappedTx = {
            executeSql: (sql: string, p?: unknown[]) => adapterTx.executeSql(sql, p),
          } as unknown as SQLiteTransaction;
          scope(wrappedTx);
        });
      },
      executeSql: async (stat: string, params?: unknown[]) => {
        const result = await adapter.executeSql(stat, params ?? []);
        return [result] as unknown as [SQLiteExecuteResult];
      },
      attach: () => Promise.resolve(),
      detach: () => Promise.resolve(),
      close: () => adapter.close(),
    } as unknown as SQLiteDatabase;
  }

  /**
   * Create a skeletal mock DB with no-op operations (last-resort fallback).
   */
  private createMockDb(): SQLiteDatabase {
    return {
      transaction: (_scope: (tx: SQLiteTransaction) => void) => {
        logWarn('[Database] transaction called on Mock DB');
        return Promise.resolve({
          executeSql: (_sql: string, _params?: unknown[]) => { },
        } as unknown as SQLiteTransaction);
      },
      readTransaction: (_scope: (tx: SQLiteTransaction) => void) =>
        Promise.resolve({
          executeSql: (_sql: string, _params?: unknown[]) => { },
        } as unknown as SQLiteTransaction),
      executeSql: (_stat: string, _params?: unknown[]) => {
        logWarn('[Database] executeSql called on Mock DB');
        return Promise.resolve([
          {
            rows: { length: 0, item: (_i: number) => null, raw: () => [] },
            rowsAffected: 0,
            insertId: 0,
          } as unknown as SQLiteExecuteResult,
        ]);
      },
      attach: () => Promise.resolve(),
      detach: () => Promise.resolve(),
      close: () => Promise.resolve(),
    } as unknown as SQLiteDatabase;
  }
}

/**
 * Singleton Export
 */
export const database = new DatabaseConnection();
