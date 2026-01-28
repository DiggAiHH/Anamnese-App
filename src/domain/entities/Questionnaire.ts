/**
 * Questionnaire Entity - repräsentiert einen Fragebogen mit Sektionen und Fragen
 *
 * Business Rules:
 * - Conditional Logic: Fragen können basierend auf Antworten ein-/ausgeblendet werden
 * - Validation: Jede Antwort wird validiert
 * - Progress Tracking: Fortschritt wird berechnet
 */

import { z } from 'zod';
import {
  CompartmentInputType,
  CompartmentOption,
  CompartmentQuestion,
} from './CompartmentQuestion';

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
  value: z.union([z.string(), z.number(), z.boolean(), z.array(z.string()), z.array(z.number())]),
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
        value: z.union([z.string(), z.number()]),
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

  private static inferCompartmentInputType(question: Question): CompartmentInputType {
    if (question.type === 'multiselect' || question.type === 'checkbox') return 'multi';
    if (question.type === 'text' || question.type === 'textarea') return 'text';
    if (question.type === 'number') return 'number';
    if (question.type === 'date') return 'date';

    if (question.type === 'radio' || question.type === 'select') {
      const values = (question.options ?? [])
        .map(o => o.value)
        .map(v => (typeof v === 'number' ? v : Number.NaN))
        .filter(v => Number.isFinite(v));

      if (values.length === 2) {
        const unique = new Set(values);
        if (unique.has(0) && unique.has(1) && unique.size === 2) {
          return 'binary';
        }
      }

      return 'single';
    }

    return 'text';
  }

  /**
   * Converts the template questions into compartment questions using stable numeric IDs/orders.
   * This is the basis for integer-only answer encoding and later export mapping.
   */
  toCompartmentQuestions(): CompartmentQuestion[] {
    const result: CompartmentQuestion[] = [];

    // Fallback deterministic order if template didn't provide one
    let fallbackOrder = 1;

    for (const section of this.data.sections) {
      for (const question of section.questions) {
        const metadata = (question.metadata ?? {}) as Record<string, unknown>;

        const compartmentIdRaw = metadata.compartmentId;
        const compartmentId =
          typeof compartmentIdRaw === 'number'
            ? compartmentIdRaw
            : Number.parseInt(String(question.id), 10);

        if (!Number.isInteger(compartmentId)) {
          throw new Error(`Missing or invalid compartmentId for question ${question.id}`);
        }

        const compartmentOrderRaw = metadata.compartmentOrder;
        const compartmentOrder =
          typeof compartmentOrderRaw === 'number' && Number.isInteger(compartmentOrderRaw)
            ? compartmentOrderRaw
            : fallbackOrder;

        const codeRaw = metadata.compartmentCode ?? metadata.fieldName;
        const code = String(codeRaw ?? question.id).trim();
        const sectionLabel = String(
          metadata.compartmentSection ?? section.titleKey ?? section.id,
        ).trim();
        const conceptLabel = String(metadata.compartmentConcept ?? section.id).trim();
        const label = String(question.labelKey).trim();

        const inputType = QuestionnaireEntity.inferCompartmentInputType(question);

        let options: CompartmentOption[] | undefined;
        if (inputType === 'single' || inputType === 'multi') {
          const mapped = (question.options ?? [])
            .map(o => {
              const value =
                typeof o.value === 'number' ? o.value : Number.parseInt(String(o.value), 10);
              if (!Number.isInteger(value)) return null;
              return {
                value,
                label: String(o.labelKey),
              };
            })
            .filter((v): v is CompartmentOption => v !== null);

          if (mapped.length > 0) {
            options = mapped;
          }
        }

        const gdprRelated = Boolean(metadata.gdprRelated);

        result.push(
          new CompartmentQuestion({
            id: compartmentId,
            order: compartmentOrder,
            code,
            section: sectionLabel,
            concept: conceptLabel,
            label,
            inputType,
            options,
            required: Boolean(question.required),
            gdprRelated,
          }),
        );

        fallbackOrder++;
      }
    }

    return result;
  }

  static create(patientId: string, sections: Section[], version?: string): QuestionnaireEntity;
  static create(params: {
    patientId: string;
    sections: Section[];
    version?: string;
  }): QuestionnaireEntity;
  static create(
    patientOrParams: string | { patientId: string; sections: Section[]; version?: string },
    sections?: Section[],
    version = '1.0.0',
  ): QuestionnaireEntity {
    const {
      patientId,
      sections: sectionList,
      version: providedVersion,
    } = typeof patientOrParams === 'string'
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
  static evaluateConditions(question: Question, answers: Map<string, unknown>): boolean {
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
          // Back-compat: array-based multiselect
          if (Array.isArray(answerValue)) {
            return answerValue.includes(condition.value as never);
          }

          // New: bitset integer multiselect
          if (
            typeof answerValue === 'number' &&
            typeof condition.value === 'number' &&
            Number.isInteger(answerValue) &&
            Number.isInteger(condition.value) &&
            condition.value >= 0
          ) {
            // condition.value is bit position
            const mask = 1 << condition.value;
            return (answerValue & mask) !== 0;
          }

          return false;
        case 'not_contains':
          if (Array.isArray(answerValue)) {
            return !answerValue.includes(condition.value as never);
          }

          if (
            typeof answerValue === 'number' &&
            typeof condition.value === 'number' &&
            Number.isInteger(answerValue) &&
            Number.isInteger(condition.value) &&
            condition.value >= 0
          ) {
            const mask = 1 << condition.value;
            return (answerValue & mask) === 0;
          }

          return true;
        case 'greater':
          return typeof answerValue === 'number' && answerValue > (condition.value as number);
        case 'less':
          return typeof answerValue === 'number' && answerValue < (condition.value as number);
        default:
          return false;
      }
    });
  }

  evaluateConditions(question: Question, answers: Map<string, unknown>): boolean {
    return QuestionnaireEntity.evaluateConditions(question, answers);
  }

  /**
   * Gibt sichtbare Fragen einer Sektion zurück (basierend auf Conditions)
   */
  getVisibleQuestions(answers: Map<string, unknown>, sectionId?: string): Question[] {
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
