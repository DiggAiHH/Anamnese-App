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

  private getTemplateSections(version?: string): Section[] {
    const tpl = template as unknown as QuestionnaireTemplate;

    const sections =
      version && tpl.versions && tpl.versions[version]
        ? tpl.versions[version].sections
        : tpl.sections;

    return [...sections].sort((a, b) => a.order - b.order);
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
    return this.getTemplateSections(version);
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
    const version = row.version as string;
    const storedSections = JSON.parse(row.sections as string) as Section[];

    // Normalize ordering against the canonical template, so older persisted questionnaires
    // don't keep stale/misordered section/question sequences after template updates.
    const templateSections = this.getTemplateSections(version);

    const templateSectionMeta = new Map<
      string,
      { order: number; index: number; questionIndex: Map<string, number> }
    >(
      templateSections.map((s, index) => [
        s.id,
        {
          order: s.order,
          index,
          questionIndex: new Map(s.questions.map((q, qi) => [q.id, qi])),
        },
      ]),
    );

    const normalizedSections = storedSections
      .map((section, originalIndex) => {
        const meta = templateSectionMeta.get(section.id);

        const normalizedQuestions = meta
          ? [...section.questions].sort((a, b) => {
              const ai = meta.questionIndex.get(a.id);
              const bi = meta.questionIndex.get(b.id);

              if (ai === undefined && bi === undefined) return 0;
              if (ai === undefined) return 1;
              if (bi === undefined) return -1;
              return ai - bi;
            })
          : section.questions;

        return {
          ...section,
          order: meta?.order ?? section.order,
          questions: normalizedQuestions,
          // used for stable sorting below (not persisted)
          __originalIndex: originalIndex,
        } as Section & { __originalIndex: number };
      })
      .sort((a, b) => {
        const ma = templateSectionMeta.get(a.id);
        const mb = templateSectionMeta.get(b.id);

        const ao = ma?.order ?? a.order ?? Number.POSITIVE_INFINITY;
        const bo = mb?.order ?? b.order ?? Number.POSITIVE_INFINITY;
        if (ao !== bo) return ao - bo;

        const ai = ma?.index ?? a.__originalIndex;
        const bi = mb?.index ?? b.__originalIndex;
        return ai - bi;
      })
      .map(({ __originalIndex: _ignored, ...section }) => section as Section);

    const questionnaireData: Questionnaire = {
      id: row.id as string,
      patientId: row.patient_id as string,
      version,
      sections: normalizedSections,
      status: row.status as Questionnaire['status'],
      createdAt: new Date(row.created_at as number),
      updatedAt: new Date(row.updated_at as number),
      completedAt: row.completed_at ? new Date(row.completed_at as number) : undefined,
    };

    return QuestionnaireEntity.fromJSON(questionnaireData);
  }
}
