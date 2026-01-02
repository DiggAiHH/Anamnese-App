/**
 * SQLite Patient Repository Implementation
 * 
 * Implementiert IPatientRepository für lokale Datenbank
 */

import { SQLiteDatabase } from 'react-native-sqlite-storage';
import { PatientEntity, Patient } from '@domain/entities/Patient';
import { IPatientRepository } from '@domain/repositories/IPatientRepository';
import { database } from './DatabaseConnection';

export class SQLitePatientRepository implements IPatientRepository {
  private async getDb(): Promise<SQLiteDatabase> {
    return database.connect();
  }

  /**
   * Patient speichern
   */
  async save(patient: PatientEntity): Promise<void> {
    const db = await this.getDb();
    const json = patient.toJSON();

    await db.executeSql(
      `INSERT OR REPLACE INTO patients (
        id, encrypted_data, language, created_at, updated_at, gdpr_consents, audit_log
      ) VALUES (?, ?, ?, ?, ?, ?, ?);`,
      [
        json.id,
        JSON.stringify(json.encryptedData),
        json.language,
        json.createdAt.getTime(),
        json.updatedAt.getTime(),
        JSON.stringify(json.gdprConsents),
        JSON.stringify(json.auditLog),
      ],
    );
  }

  /**
   * Patient anhand ID finden
   */
  async findById(id: string): Promise<PatientEntity | null> {
    const db = await this.getDb();
    const [result] = await db.executeSql('SELECT * FROM patients WHERE id = ?;', [id]);

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows.item(0);
    return this.mapRowToEntity(row);
  }

  /**
   * Alle Patienten abrufen
   */
  async findAll(): Promise<PatientEntity[]> {
    const db = await this.getDb();
    const [result] = await db.executeSql('SELECT * FROM patients ORDER BY created_at DESC;');

    const patients: PatientEntity[] = [];
    for (let i = 0; i < result.rows.length; i++) {
      const row = result.rows.item(i);
      patients.push(this.mapRowToEntity(row));
    }

    return patients;
  }

  /**
   * Patient löschen
   */
  async delete(id: string): Promise<void> {
    const db = await this.getDb();
    await db.executeSql('DELETE FROM patients WHERE id = ?;', [id]);
  }

  /**
   * Patient existiert?
   */
  async exists(id: string): Promise<boolean> {
    const db = await this.getDb();
    const [result] = await db.executeSql('SELECT COUNT(*) as count FROM patients WHERE id = ?;', [
      id,
    ]);

    return result.rows.item(0).count > 0;
  }

  /**
   * Patienten suchen (limitiert wegen Verschlüsselung)
   * Hinweis: Kann nur nach unverschlüsselten Feldern suchen (z.B. language)
   */
  async search(query: string): Promise<PatientEntity[]> {
    const db = await this.getDb();
    const [result] = await db.executeSql(
      `SELECT * FROM patients WHERE language LIKE ? ORDER BY created_at DESC;`,
      [`%${query}%`],
    );

    const patients: PatientEntity[] = [];
    for (let i = 0; i < result.rows.length; i++) {
      const row = result.rows.item(i);
      patients.push(this.mapRowToEntity(row));
    }

    return patients;
  }

  /**
   * Helper: Row zu Entity mappen
   */
  private mapRowToEntity(row: Record<string, unknown>): PatientEntity {
    const patientData: Patient = {
      id: row.id as string,
      encryptedData: JSON.parse(row.encrypted_data as string),
      language: row.language as Patient['language'],
      createdAt: new Date(row.created_at as number),
      updatedAt: new Date(row.updated_at as number),
      gdprConsents: JSON.parse(row.gdpr_consents as string).map(
        (c: Patient['gdprConsents'][0]) => ({
          ...c,
          timestamp: new Date(c.timestamp),
        }),
      ),
      auditLog: JSON.parse(row.audit_log as string).map((l: Patient['auditLog'][0]) => ({
        ...l,
        timestamp: new Date(l.timestamp),
      })),
    };

    return PatientEntity.fromJSON(patientData);
  }
}
