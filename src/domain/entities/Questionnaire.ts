/**
 * Questionnaire Entity - repräsentiert einen Fragebogen mit Sektionen und Fragen
 * 
 * Business Rules:
 * - Conditional Logic: Fragen können basierend auf Antworten ein-/ausgeblendet werden
 * - Validation: Jede Antwort wird validiert
 * - Progress Tracking: Fortschritt wird berechnet
 */

import { z } from 'zod';

// Question Types
export type QuestionType =
  | 'text'
  | 'textarea'
  | 'number'
  | 'date'
  | 'checkbox'
  | 'radio'
  | 'select'
  | 'multiselect';

// Conditional Logic
export const ConditionSchema = z.object({
  questionId: z.string(),
  operator: z.enum(['equals', 'not_equals', 'contains', 'not_contains', 'greater', 'less']),
  value: z.union([z.string(), z.number(), z.boolean(), z.array(z.string())]),
});

export type Condition = z.infer<typeof ConditionSchema>;

// Question
export const QuestionSchema = z.object({
  id: z.string(),
  type: z.enum([
    'text',
    'textarea',
    'number',
    'date',
    'checkbox',
    'radio',
    'select',
    'multiselect',
  ]),
  labelKey: z.string(), // i18n key
  placeholderKey: z.string().optional(),
  required: z.boolean().default(false),
  options: z
    .array(
      z.object({
        value: z.string(),
        labelKey: z.string(),
      }),
    )
    .optional(),
  validation: z
    .object({
      min: z.number().optional(),
      max: z.number().optional(),
      pattern: z.string().optional(),
      minDate: z.string().optional(), // ISO 8601
      maxDate: z.string().optional(),
    })
    .optional(),
  conditions: z.array(ConditionSchema).optional(), // Zeige Frage nur wenn alle Conditions erfüllt
  dependsOn: z.string().optional(), // Parent question ID
  metadata: z.record(z.unknown()).optional(), // Zusätzliche Daten (z.B. für GDT Mapping)
});

export type Question = z.infer<typeof QuestionSchema>;

// Section
export const SectionSchema = z.object({
  id: z.string(),
  titleKey: z.string(),
  descriptionKey: z.string().optional(),
  questions: z.array(QuestionSchema),
  order: z.number(),
});

export type Section = z.infer<typeof SectionSchema>;

// Questionnaire
export const QuestionnaireSchema = z.object({
  id: z.string().uuid(),
  version: z.string(),
  patientId: z.string().uuid(),
  sections: z.array(SectionSchema),
  createdAt: z.date(),
  updatedAt: z.date(),
  completedAt: z.date().nullable().optional(),
  status: z.enum(['draft', 'in_progress', 'completed']),
});

export type Questionnaire = z.infer<typeof QuestionnaireSchema>;

/**
 * Questionnaire Entity
 */
export class QuestionnaireEntity {
  private constructor(private readonly data: Questionnaire) {
    QuestionnaireSchema.parse(data);
  }

  static create(patientId: string, sections: Section[], version?: string): QuestionnaireEntity;
  static create(params: { patientId: string; sections: Section[]; version?: string }): QuestionnaireEntity;
  static create(
    patientOrParams: string | { patientId: string; sections: Section[]; version?: string },
    sections?: Section[],
    version = '1.0.0',
  ): QuestionnaireEntity {
    const { patientId, sections: sectionList, version: providedVersion } =
      typeof patientOrParams === 'string'
        ? { patientId: patientOrParams, sections: sections ?? [], version }
        : {
            patientId: patientOrParams.patientId,
            sections: patientOrParams.sections,
            version: patientOrParams.version ?? version,
          };

    if (!sectionList || sectionList.length === 0) {
      throw new Error('Questionnaire must have at least one section');
    }

    const id = crypto.randomUUID();
    const now = new Date();

    return new QuestionnaireEntity({
      id,
      version: providedVersion ?? version,
      patientId,
      sections: [...sectionList].sort((a, b) => a.order - b.order),
      createdAt: now,
      updatedAt: now,
      completedAt: null,
      status: 'draft',
    });
  }

  // Getters
  get id(): string {
    return this.data.id;
  }

  get patientId(): string {
    return this.data.patientId;
  }

  get version(): string {
    return this.data.version;
  }

  get sections(): Section[] {
    return this.data.sections;
  }

  get status(): Questionnaire['status'] {
    return this.data.status;
  }

  get createdAt(): Date {
    return this.data.createdAt;
  }

  get updatedAt(): Date {
    return this.data.updatedAt;
  }

  get completedAt(): Date | null | undefined {
    return this.data.completedAt;
  }

  // Business Logic

  /**
   * Findet eine Frage anhand ihrer ID
   */
  findQuestion(questionId: string): Question | undefined {
    for (const section of this.data.sections) {
      const question = section.questions.find(q => q.id === questionId);
      if (question) return question;
    }
    return undefined;
  }

  /**
   * Findet Sektion anhand der ID
   */
  findSection(sectionId: string): Section | undefined {
    return this.data.sections.find(s => s.id === sectionId);
  }

  /**
   * Gibt alle Fragen zurück (flach)
   */
  getAllQuestions(): Question[] {
    return this.data.sections.flatMap(s => s.questions);
  }

  /**
   * Zählt Gesamtanzahl der Fragen
   */
  getTotalQuestions(): number {
    return this.getAllQuestions().length;
  }

  /**
   * Berechnet Anzahl der Pflichtfragen
   */
  getRequiredQuestionsCount(): number {
    return this.getAllQuestions().filter(q => q.required).length;
  }

  /**
   * Status auf "in_progress" setzen
   */
  markAsStarted(): QuestionnaireEntity {
    return this.updateStatus('in_progress');
  }

  /**
   * Fragebogen als abgeschlossen markieren
   */
  markAsCompleted(): QuestionnaireEntity {
    return this.updateStatus('completed');
  }

  /**
   * Prüft ob Conditional Logic erfüllt ist
   */
  static evaluateConditions(
    question: Question,
    answers: Map<string, unknown>,
  ): boolean {
    if (!question.conditions || question.conditions.length === 0) {
      return true; // Keine Conditions = immer anzeigen
    }

    // Alle Conditions müssen erfüllt sein (AND Logik)
    return question.conditions.every(condition => {
      const answerValue = answers.get(condition.questionId);
      
      switch (condition.operator) {
        case 'equals':
          return answerValue === condition.value;
        case 'not_equals':
          return answerValue !== condition.value;
        case 'contains':
          return Array.isArray(answerValue) && answerValue.includes(condition.value);
        case 'not_contains':
          return !Array.isArray(answerValue) || !answerValue.includes(condition.value);
        case 'greater':
          return typeof answerValue === 'number' && answerValue > (condition.value as number);
        case 'less':
          return typeof answerValue === 'number' && answerValue < (condition.value as number);
        default:
          return false;
      }
    });
  }

  evaluateConditions(
    question: Question,
    answers: Map<string, unknown>,
  ): boolean {
    return QuestionnaireEntity.evaluateConditions(question, answers);
  }

  /**
   * Gibt sichtbare Fragen einer Sektion zurück (basierend auf Conditions)
   */
  getVisibleQuestions(
    answers: Map<string, unknown>,
    sectionId?: string,
  ): Question[] {
    const sectionsToCheck = sectionId
      ? this.data.sections.filter(s => s.id === sectionId)
      : this.data.sections;

    const visibleQuestions: Question[] = [];

    sectionsToCheck.forEach(section => {
      section.questions.forEach(question => {
        if (QuestionnaireEntity.evaluateConditions(question, answers)) {
          visibleQuestions.push(question);
        }
      });
    });

    return visibleQuestions;
  }

  /**
   * Fortschritt in Prozent (sichtbare Fragen)
   */
  calculateProgress(answers: Map<string, unknown>): number {
    const visibleQuestions = this.getVisibleQuestions(answers);
    if (visibleQuestions.length === 0) return 0;

    const answeredVisible = visibleQuestions.filter(q => answers.has(q.id));
    return Math.round((answeredVisible.length / visibleQuestions.length) * 100);
  }

  /**
   * Status aktualisieren
   */
  updateStatus(status: Questionnaire['status']): QuestionnaireEntity {
    const now = new Date();
    return new QuestionnaireEntity({
      ...this.data,
      status,
      updatedAt: now,
      completedAt: status === 'completed' ? now : null,
    });
  }

  /**
   * Zu Plain Object konvertieren
   */
  toJSON(): Questionnaire {
    return {
      ...this.data,
    };
  }

  /**
   * Von Plain Object erstellen
   */
  static fromJSON(json: Questionnaire): QuestionnaireEntity {
    return new QuestionnaireEntity({
      ...json,
      createdAt: new Date(json.createdAt),
      updatedAt: new Date(json.updatedAt),
      completedAt: json.completedAt ? new Date(json.completedAt) : null,
    });
  }
}
