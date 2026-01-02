/**
 * Repository Interface für Answer Entity
 */

import { AnswerEntity, AnswerValue } from '../entities/Answer';

export interface IAnswerRepository {
  /**
   * Antwort speichern
   */
  save(answer: AnswerEntity): Promise<void>;

  /**
   * Mehrere Antworten auf einmal speichern (Batch)
   */
  saveMany(answers: AnswerEntity[]): Promise<void>;

  /**
   * Antwort anhand ID finden
   */
  findById(id: string): Promise<AnswerEntity | null>;

  /**
   * Alle Antworten für einen Fragebogen finden
   */
  findByQuestionnaireId(questionnaireId: string): Promise<AnswerEntity[]>;

  /**
   * Antwort für spezifische Frage finden
   */
  findByQuestionId(
    questionnaireId: string,
    questionId: string,
  ): Promise<AnswerEntity | null>;

  /**
   * Antwort löschen
   */
  delete(id: string): Promise<void>;

  /**
   * Alle Antworten eines Fragebogens löschen
   */
  deleteByQuestionnaireId(questionnaireId: string): Promise<void>;

  /**
   * Antworten als Map zurückgeben (questionId -> decrypted value)
   * Achtung: Erfordert Decryption!
   */
  getAnswersMap(
    questionnaireId: string,
    decryptionKey: string,
  ): Promise<Map<string, AnswerValue>>;
}
