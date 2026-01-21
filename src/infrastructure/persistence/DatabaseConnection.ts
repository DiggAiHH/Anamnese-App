/**
 * SQLite Database Setup
 * 
 * Verwendet react-native-sqlite-storage für lokale Datenbank
 * DSGVO-konform: Alle Daten lokal, verschlüsselt
 */

import { Platform } from 'react-native';
import { isRNFSAvailable, requireRNFS } from '@shared/rnfsSafe';

// Type imports only (no runtime evaluation)
import type { SQLiteDatabase, SQLiteTransaction } from 'react-native-sqlite-storage';

// Re-export types for consumers
export type { SQLiteDatabase, SQLiteTransaction };

// Define SQLiteExecuteResult interface locally to avoid import-time crash
export interface SQLiteExecuteResult {
  rows: {
    length: number;
    item: (index: number) => any;
    raw?: () => any[];
  };
  rowsAffected: number;
  insertId?: number;
}

// Conditional import: Only load react-native-sqlite-storage on non-Windows platforms
// This prevents "cannot read undefined" crash at module load time on Windows
let SQLite: typeof import('react-native-sqlite-storage').default | null = null;
if (Platform.OS !== 'windows') {
  try {
    SQLite = require('react-native-sqlite-storage').default;
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
  private readonly dbName: string;

  constructor(dbName = DB_NAME) {
    this.dbName = dbName;
  }

  /**
   * Öffnet Datenbankverbindung
   */
  async connect(): Promise<SQLiteDatabase> {
    if (this.db) {
      return this.db;
    }

    if (Platform.OS === 'windows') {
      console.warn('[Database] SQLite is not supported on Windows. Using Mock DB.');
      // Return a skeletal mock that satisfies the minimal interface used here
      // casting to unknown as SQLiteDatabase to satisfy TS
      this.db = {
        transaction: (_scope: (tx: SQLiteTransaction) => void) => {
          console.warn('[Database] transaction called on Windows Mock DB');
          return Promise.resolve({
             executeSql: (_sql: string, _params?: any[]) => {},
          } as unknown as SQLiteTransaction); 
        },
        readTransaction: (_scope: (tx: SQLiteTransaction) => void) => Promise.resolve({
             executeSql: (_sql: string, _params?: any[]) => {},
        } as unknown as SQLiteTransaction),
        executeSql: (_stat: string, _params?: any[]) => {
           console.warn('[Database] executeSql called on Windows Mock DB');
           return Promise.resolve([{
             rows: { length: 0, item: (_i: number) => null, raw: () => [] },
             rowsAffected: 0,
             insertId: 0,
           } as unknown as SQLiteExecuteResult]);
        },
        attach: () => Promise.resolve(),
        detach: () => Promise.resolve(),
        close: () => Promise.resolve(),
      } as unknown as SQLiteDatabase;
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
      throw new Error(`Failed to connect to database: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * SQL Helper that ensures connection and returns first result set
   */
  async executeSql(statement: string, params: unknown[] = []): Promise<SQLiteExecuteResult> {
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

    // Set DB version
    await this.db.executeSql(`
      INSERT OR REPLACE INTO db_metadata (key, value)
      VALUES ('version', '${DB_VERSION}');
    `);
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
    if (!this.db) throw new Error('Database not connected');

    const [patientsResult] = await this.db.executeSql('SELECT COUNT(*) as count FROM patients;');
    const [questionnairesResult] = await this.db.executeSql('SELECT COUNT(*) as count FROM questionnaires;');
    const [answersResult] = await this.db.executeSql('SELECT COUNT(*) as count FROM answers;');
    const [documentsResult] = await this.db.executeSql('SELECT COUNT(*) as count FROM documents;');

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
      patients: (patientsResult.rows.item(0) as { count: number }).count,
      questionnaires: (questionnairesResult.rows.item(0) as { count: number }).count,
      answers: (answersResult.rows.item(0) as { count: number }).count,
      documents: (documentsResult.rows.item(0) as { count: number }).count,
      dbSize,
    };
  }
}

/**
 * Singleton Export
 */
export const database = new DatabaseConnection();
