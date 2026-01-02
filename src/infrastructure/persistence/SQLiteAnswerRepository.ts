/**
 * SQLite Answer Repository Implementation
 */

import { SQLiteDatabase } from 'react-native-sqlite-storage';
import { AnswerEntity, Answer, AnswerValue } from '@domain/entities/Answer';
import { IAnswerRepository } from '@domain/repositories/IAnswerRepository';
import { database } from './DatabaseConnection';
import { encryptionService } from '../encryption/NativeEncryptionService';
import { EncryptedDataVO } from '@domain/value-objects/EncryptedData';

export class SQLiteAnswerRepository implements IAnswerRepository {
  private async getDb(): Promise<SQLiteDatabase> {
    return database.connect();
  }

  /**
   * Antwort speichern
   */
  async save(answer: AnswerEntity): Promise<void> {
    const db = await this.getDb();
    const json = answer.toJSON();

    await db.executeSql(
      `INSERT OR REPLACE INTO answers (
        id, questionnaire_id, question_id, encrypted_value, question_type,
        source_type, confidence, answered_at, updated_at, audit_log
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      [
        json.id,
        json.questionnaireId,
        json.questionId,
        json.encryptedValue,
        json.questionType,
        json.sourceType,
        json.confidence ?? null,
        json.answeredAt.getTime(),
        json.updatedAt.getTime(),
        JSON.stringify(json.auditLog),
      ],
    );
  }

  /**
   * Mehrere Antworten auf einmal speichern (Batch - Performance!)
   */
  async saveMany(answers: AnswerEntity[]): Promise<void> {
    const db = await this.getDb();

    // Transaction für Atomarität
    await db.transaction(async tx => {
      for (const answer of answers) {
        const json = answer.toJSON();
        
        await tx.executeSql(
          `INSERT OR REPLACE INTO answers (
            id, questionnaire_id, question_id, encrypted_value, question_type,
            source_type, confidence, answered_at, updated_at, audit_log
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
          [
            json.id,
            json.questionnaireId,
            json.questionId,
            json.encryptedValue,
            json.questionType,
            json.sourceType,
            json.confidence ?? null,
            json.answeredAt.getTime(),
            json.updatedAt.getTime(),
            JSON.stringify(json.auditLog),
          ],
        );
      }
    });
  }

  /**
   * Antwort anhand ID finden
   */
  async findById(id: string): Promise<AnswerEntity | null> {
    const db = await this.getDb();
    const [result] = await db.executeSql('SELECT * FROM answers WHERE id = ?;', [id]);

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows.item(0);
    return this.mapRowToEntity(row);
  }

  /**
   * Alle Antworten für einen Fragebogen finden
   */
  async findByQuestionnaireId(questionnaireId: string): Promise<AnswerEntity[]> {
    const db = await this.getDb();
    const [result] = await db.executeSql(
      'SELECT * FROM answers WHERE questionnaire_id = ? ORDER BY answered_at ASC;',
      [questionnaireId],
    );

    const answers: AnswerEntity[] = [];
    for (let i = 0; i < result.rows.length; i++) {
      const row = result.rows.item(i);
      answers.push(this.mapRowToEntity(row));
    }

    return answers;
  }

  /**
   * Antwort für spezifische Frage finden
   */
  async findByQuestionId(
    questionnaireId: string,
    questionId: string,
  ): Promise<AnswerEntity | null> {
    const db = await this.getDb();
    const [result] = await db.executeSql(
      'SELECT * FROM answers WHERE questionnaire_id = ? AND question_id = ?;',
      [questionnaireId, questionId],
    );

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows.item(0);
    return this.mapRowToEntity(row);
  }

  /**
   * Antwort löschen
   */
  async delete(id: string): Promise<void> {
    const db = await this.getDb();
    await db.executeSql('DELETE FROM answers WHERE id = ?;', [id]);
  }

  /**
   * Alle Antworten eines Fragebogens löschen
   */
  async deleteByQuestionnaireId(questionnaireId: string): Promise<void> {
    const db = await this.getDb();
    await db.executeSql('DELETE FROM answers WHERE questionnaire_id = ?;', [questionnaireId]);
  }

  /**
   * Antworten als Map zurückgeben (questionId -> decrypted value)
   * 
   * Achtung: Requires decryption key!
   */
  async getAnswersMap(
    questionnaireId: string,
    decryptionKey: string,
  ): Promise<Map<string, AnswerValue>> {
    const answers = await this.findByQuestionnaireId(questionnaireId);
    const answersMap = new Map<string, AnswerValue>();

    for (const answer of answers) {
      try {
        // Decrypt answer value
        const encryptedData = EncryptedDataVO.fromString(answer.encryptedValue);
        const decryptedJson = await encryptionService.decrypt(encryptedData, decryptionKey);
        const value = JSON.parse(decryptedJson) as AnswerValue;

        answersMap.set(answer.questionId, value);
      } catch (error) {
        // Decryption failed - skip this answer
        console.error(`Failed to decrypt answer ${answer.id}:`, error);
      }
    }

    return answersMap;
  }

  /**
   * Helper: Row zu Entity mappen
   */
  private mapRowToEntity(row: Record<string, unknown>): AnswerEntity {
    const answerData: Answer = {
      id: row.id as string,
      questionnaireId: row.questionnaire_id as string,
      questionId: row.question_id as string,
      encryptedValue: row.encrypted_value as string,
      questionType: row.question_type as Answer['questionType'],
      sourceType: row.source_type as Answer['sourceType'],
      confidence: (row.confidence as number | null) ?? undefined,
      answeredAt: new Date(row.answered_at as number),
      updatedAt: new Date(row.updated_at as number),
      auditLog: JSON.parse(row.audit_log as string).map((l: Answer['auditLog'][0]) => ({
        ...l,
        timestamp: new Date(l.timestamp),
      })),
    };

    return AnswerEntity.fromJSON(answerData);
  }
}
