/**
 * In-Memory Answer Repository
 *
 * Deterministic implementation for testing purposes.
 * No encryption - stores data in plain format for test assertions.
 *
 * @security TEST ONLY - Never use in production.
 */

import { AnswerEntity, Answer, AnswerValue } from '@domain/entities/Answer';
import { IAnswerRepository } from '@domain/repositories/IAnswerRepository';

export class InMemoryAnswerRepository implements IAnswerRepository {
  private answers = new Map<string, Answer>();

  async save(answer: AnswerEntity): Promise<void> {
    const json = answer.toJSON();
    this.answers.set(json.id, json);
  }

  async saveMany(answers: AnswerEntity[]): Promise<void> {
    for (const answer of answers) {
      await this.save(answer);
    }
  }

  async findById(id: string): Promise<AnswerEntity | null> {
    const data = this.answers.get(id);
    if (!data) {
      return null;
    }
    return AnswerEntity.fromJSON(data);
  }

  async findByQuestionnaireId(questionnaireId: string): Promise<AnswerEntity[]> {
    const results: AnswerEntity[] = [];
    for (const data of this.answers.values()) {
      if (data.questionnaireId === questionnaireId) {
        results.push(AnswerEntity.fromJSON(data));
      }
    }
    return results;
  }

  async findByQuestionId(
    questionnaireId: string,
    questionId: string,
  ): Promise<AnswerEntity | null> {
    for (const data of this.answers.values()) {
      if (data.questionnaireId === questionnaireId && data.questionId === questionId) {
        return AnswerEntity.fromJSON(data);
      }
    }
    return null;
  }

  async delete(id: string): Promise<void> {
    this.answers.delete(id);
  }

  async deleteByQuestionnaireId(questionnaireId: string): Promise<void> {
    const toDelete: string[] = [];
    for (const [id, data] of this.answers.entries()) {
      if (data.questionnaireId === questionnaireId) {
        toDelete.push(id);
      }
    }
    for (const id of toDelete) {
      this.answers.delete(id);
    }
  }

  async getAnswersMap(
    questionnaireId: string,
    _decryptionKey: string,
  ): Promise<Map<string, AnswerValue>> {
    const result = new Map<string, AnswerValue>();

    for (const data of this.answers.values()) {
      if (data.questionnaireId === questionnaireId) {
        // In test mode, encryptedValue is actually plain JSON
        try {
          const value = JSON.parse(data.encryptedValue) as AnswerValue;
          result.set(data.questionId, value);
        } catch {
          // If not JSON, use as-is (string)
          result.set(data.questionId, data.encryptedValue);
        }
      }
    }
    return result;
  }

  // Test utility methods
  clear(): void {
    this.answers.clear();
  }

  size(): number {
    return this.answers.size;
  }

  getAll(): Answer[] {
    return Array.from(this.answers.values());
  }
}
