/**
 * In-Memory Questionnaire Repository
 *
 * Deterministic implementation for testing purposes.
 *
 * @security TEST ONLY - Never use in production.
 */

import {
  QuestionnaireEntity,
  Questionnaire,
  Section,
} from '@domain/entities/Questionnaire';
import { IQuestionnaireRepository } from '@domain/repositories/IQuestionnaireRepository';

// Default test template
const DEFAULT_TEST_SECTIONS: Section[] = [
  {
    id: 'section-1',
    titleKey: 'sections.personal',
    descriptionKey: 'sections.personalDesc',
    order: 1,
    questions: [
      {
        id: 'q1',
        type: 'text',
        labelKey: 'questions.firstName',
        required: true,
      },
      {
        id: 'q2',
        type: 'text',
        labelKey: 'questions.lastName',
        required: true,
      },
    ],
  },
];

export class InMemoryQuestionnaireRepository implements IQuestionnaireRepository {
  private questionnaires = new Map<string, Questionnaire>();
  private templateSections: Section[] = DEFAULT_TEST_SECTIONS;
  private templateVersion = '1.0.0';

  async save(questionnaire: QuestionnaireEntity): Promise<void> {
    const json = questionnaire.toJSON();
    this.questionnaires.set(json.id, json);
  }

  async findById(id: string): Promise<QuestionnaireEntity | null> {
    const data = this.questionnaires.get(id);
    if (!data) {
      return null;
    }
    return QuestionnaireEntity.fromJSON(data);
  }

  async findByPatientId(patientId: string): Promise<QuestionnaireEntity[]> {
    const results: QuestionnaireEntity[] = [];
    for (const data of this.questionnaires.values()) {
      if (data.patientId === patientId) {
        results.push(QuestionnaireEntity.fromJSON(data));
      }
    }
    return results;
  }

  async delete(id: string): Promise<void> {
    this.questionnaires.delete(id);
  }

  async loadTemplate(_version?: string): Promise<Section[]> {
    // Return a deep copy to prevent mutation
    return JSON.parse(JSON.stringify(this.templateSections)) as Section[];
  }

  async getLatestTemplateVersion(): Promise<string> {
    return this.templateVersion;
  }

  // Test utility methods
  clear(): void {
    this.questionnaires.clear();
  }

  size(): number {
    return this.questionnaires.size;
  }

  getAll(): Questionnaire[] {
    return Array.from(this.questionnaires.values());
  }

  /**
   * Set custom template for testing.
   */
  setTemplate(sections: Section[], version = '1.0.0'): void {
    this.templateSections = sections;
    this.templateVersion = version;
  }
}
