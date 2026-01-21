/**
 * SQLite Questionnaire Repository Implementation
 */

import type { SQLiteDatabase } from 'react-native-sqlite-storage';
import { QuestionnaireEntity, Questionnaire, Section } from '@domain/entities/Questionnaire';
import { IQuestionnaireRepository } from '@domain/repositories/IQuestionnaireRepository';
import { database } from './DatabaseConnection';
import template from '../data/questionnaire-template.json';

type QuestionnaireTemplate = {
  version?: string;
  sections: Section[];
  versions?: Record<string, { sections: Section[] }>;
};

export class SQLiteQuestionnaireRepository implements IQuestionnaireRepository {
  private async getDb(): Promise<SQLiteDatabase> {
    return database.connect();
  }

  /**
   * Fragebogen speichern
   */
  async save(questionnaire: QuestionnaireEntity): Promise<void> {
    const db = await this.getDb();
    const json = questionnaire.toJSON();

    await db.executeSql(
      `INSERT OR REPLACE INTO questionnaires (
        id, patient_id, version, sections, status, created_at, updated_at, completed_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
      [
        json.id,
        json.patientId,
        json.version,
        JSON.stringify(json.sections),
        json.status,
        json.createdAt.getTime(),
        json.updatedAt.getTime(),
        json.completedAt?.getTime() ?? null,
      ],
    );
  }

  /**
   * Fragebogen anhand ID finden
   */
  async findById(id: string): Promise<QuestionnaireEntity | null> {
    const db = await this.getDb();
    const [result] = await db.executeSql('SELECT * FROM questionnaires WHERE id = ?;', [id]);

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows.item(0);
    return this.mapRowToEntity(row);
  }

  /**
   * Alle Fragebögen abrufen
   */
  async findAll(): Promise<QuestionnaireEntity[]> {
    const db = await this.getDb();
    const [result] = await db.executeSql('SELECT * FROM questionnaires ORDER BY created_at DESC;');

    const questionnaires: QuestionnaireEntity[] = [];
    for (let i = 0; i < result.rows.length; i++) {
      const row = result.rows.item(i);
      questionnaires.push(this.mapRowToEntity(row));
    }

    return questionnaires;
  }

  /**
   * Fragebögen für einen Patienten finden
   */
  async findByPatientId(patientId: string): Promise<QuestionnaireEntity[]> {
    const db = await this.getDb();
    const [result] = await db.executeSql(
      'SELECT * FROM questionnaires WHERE patient_id = ? ORDER BY created_at DESC;',
      [patientId],
    );

    const questionnaires: QuestionnaireEntity[] = [];
    for (let i = 0; i < result.rows.length; i++) {
      const row = result.rows.item(i);
      questionnaires.push(this.mapRowToEntity(row));
    }

    return questionnaires;
  }

  /**
   * Fragebogen löschen
   */
  async delete(id: string): Promise<void> {
    const db = await this.getDb();
    await db.executeSql('DELETE FROM questionnaires WHERE id = ?;', [id]);
  }

  /**
   * Fragebogen-Template laden
   *
   * Hinweis: Template wird aus JSON-Datei geladen, nicht aus DB
   */
  async loadTemplate(version?: string): Promise<Section[]> {
    const tpl = template as unknown as QuestionnaireTemplate;

    // Wenn Version spezifiziert, entsprechende Version laden
    if (version && tpl.versions && tpl.versions[version]) {
      return tpl.versions[version].sections;
    }

    // Sonst default/latest Version
    return tpl.sections;
  }

  /**
   * Neueste Template-Version abrufen
   */
  async getLatestTemplateVersion(): Promise<string> {
    const tpl = template as unknown as QuestionnaireTemplate;
    return tpl.version ?? '1.0.0';
  }

  /**
   * Helper: Row zu Entity mappen
   */
  private mapRowToEntity(row: Record<string, unknown>): QuestionnaireEntity {
    const questionnaireData: Questionnaire = {
      id: row.id as string,
      patientId: row.patient_id as string,
      version: row.version as string,
      sections: JSON.parse(row.sections as string),
      status: row.status as Questionnaire['status'],
      createdAt: new Date(row.created_at as number),
      updatedAt: new Date(row.updated_at as number),
      completedAt: row.completed_at ? new Date(row.completed_at as number) : undefined,
    };

    return QuestionnaireEntity.fromJSON(questionnaireData);
  }
}
