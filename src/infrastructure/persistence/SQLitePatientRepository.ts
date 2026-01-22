/**
 * SQLite Patient Repository Implementation
 * 
 * Implementiert IPatientRepository für lokale Datenbank
 */

import type { SQLiteDatabase } from 'react-native-sqlite-storage';
import { PatientEntity, Patient } from '@domain/entities/Patient';
import { IPatientRepository } from '@domain/repositories/IPatientRepository';
import { database } from './DatabaseConnection';
import { encryptionService } from '@infrastructure/encryption/encryptionService';
import { EncryptedDataVO } from '@domain/value-objects/EncryptedData';
import { getActiveEncryptionKey } from '@shared/keyManager';
import { logError, logWarn } from '@shared/logger';

export class SQLitePatientRepository implements IPatientRepository {
  private async getDb(): Promise<SQLiteDatabase> {
    return database.connect();
  }

  private maskEncryptedData(): Patient['encryptedData'] {
    return {
      firstName: '***',
      lastName: '***',
      birthDate: '****-**-**',
      gender: 'other',
      email: undefined,
      phone: undefined,
      insurance: undefined,
      insuranceNumber: undefined,
    };
  }

  private tryParsePlaintext(raw: string): Patient['encryptedData'] | null {
    const trimmed = raw.trim();
    if (!trimmed.startsWith('{')) return null;
    try {
      const parsed = JSON.parse(trimmed) as Patient['encryptedData'];
      if (!parsed || typeof parsed.firstName !== 'string' || typeof parsed.lastName !== 'string') {
        return null;
      }
      return parsed;
    } catch {
      return null;
    }
  }

  private async encryptPatientData(data: Patient['encryptedData'], key: string): Promise<string> {
    const json = JSON.stringify(data);
    const encrypted = await encryptionService.encrypt(json, key);
    return encrypted.toString();
  }

  private async decryptPatientData(
    raw: string,
    key: string | null,
  ): Promise<{ data: Patient['encryptedData']; wasPlaintext: boolean } | null> {
    const plaintext = this.tryParsePlaintext(raw);
    if (plaintext) {
      return { data: plaintext, wasPlaintext: true };
    }

    if (!key) {
      return { data: this.maskEncryptedData(), wasPlaintext: false };
    }

    try {
      const encryptedVO = EncryptedDataVO.fromString(raw);
      const decryptedJson = await encryptionService.decrypt(encryptedVO, key);
      const parsed = JSON.parse(decryptedJson) as Patient['encryptedData'];
      return { data: parsed, wasPlaintext: false };
    } catch (error) {
      logError('Failed to decrypt patient data', error);
      return { data: this.maskEncryptedData(), wasPlaintext: false };
    }
  }

  private async reencryptIfNeeded(patientId: string, plaintext: Patient['encryptedData']): Promise<void> {
    const key = getActiveEncryptionKey();
    if (!key) return;

    try {
      const encrypted = await this.encryptPatientData(plaintext, key);
      const db = await this.getDb();
      await db.executeSql(
        'UPDATE patients SET encrypted_data = ?, updated_at = ? WHERE id = ?;',
        [encrypted, new Date().getTime(), patientId],
      );
    } catch (error) {
      logWarn('Failed to re-encrypt legacy patient data.');
      logError('Re-encryption error', error);
    }
  }

  /**
   * Patient speichern
   */
  async save(patient: PatientEntity): Promise<void> {
    const db = await this.getDb();
    const json = patient.toJSON();

    const key = getActiveEncryptionKey();
    if (!key) {
      throw new Error('Encryption key missing. Please unlock the session.');
    }

    const encryptedData = await this.encryptPatientData(json.encryptedData, key);

    await db.executeSql(
      `INSERT OR REPLACE INTO patients (
        id, encrypted_data, language, created_at, updated_at, gdpr_consents, audit_log
      ) VALUES (?, ?, ?, ?, ?, ?, ?);`,
      [
        json.id,
        encryptedData,
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
      const entity = await this.mapRowToEntity(row);
      if (entity) patients.push(entity);
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
   * Patient aktualisieren
   */
  async update(patient: PatientEntity): Promise<void> {
    const db = await this.getDb();
    const json = patient.toJSON();

    const key = getActiveEncryptionKey();
    if (!key) {
      throw new Error('Encryption key missing. Please unlock the session.');
    }

    const encryptedData = await this.encryptPatientData(json.encryptedData, key);

    await db.executeSql(
      `UPDATE patients SET
        encrypted_data = ?,
        language = ?,
        updated_at = ?,
        gdpr_consents = ?,
        audit_log = ?
      WHERE id = ?;`,
      [
        encryptedData,
        json.language,
        new Date().getTime(),
        JSON.stringify(json.gdprConsents),
        JSON.stringify(json.auditLog),
        json.id,
      ],
    );
  }

  /**
   * Patient existiert?
   */
  async exists(id: string): Promise<boolean> {
    const db = await this.getDb();
    const [result] = await db.executeSql('SELECT COUNT(*) as count FROM patients WHERE id = ?;', [
      id,
    ]);

    if (!result?.rows || result.rows.length === 0) return false;
    const row = result.rows.item(0) as { count?: number } | null;
    const count = row?.count ?? 0;
    return count > 0;
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
      const entity = await this.mapRowToEntity(row);
      if (entity) patients.push(entity);
    }

    return patients;
  }

  /**
   * Helper: Row zu Entity mappen
   */
  private async mapRowToEntity(row: Record<string, unknown>): Promise<PatientEntity | null> {
    const key = getActiveEncryptionKey();
    const encryptedRaw = row.encrypted_data as string;

    const decrypted = await this.decryptPatientData(encryptedRaw, key);
    if (!decrypted) return null;

    if (decrypted.wasPlaintext && key) {
      await this.reencryptIfNeeded(row.id as string, decrypted.data);
    }

    const patientData: Patient = {
      id: row.id as string,
      encryptedData: decrypted.data,
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
