/**
 * Answer Entity - repräsentiert eine Antwort auf eine Frage
 * 
 * Business Rules:
 * - Antworten sind verschlüsselt
 * - Validation basiert auf Question Definition
 * - Audit Trail für DSGVO Compliance
 */

import { z } from 'zod';
import { Question, QuestionType } from './Questionnaire';

// Answer Value Types
export type AnswerValue =
  | string
  | number
  | boolean
  | string[] // legacy multiselect/checkbox
  | Date
  | null;

export const AnswerSchema = z.object({
  id: z.string().uuid(),
  questionnaireId: z.string().uuid(),
  questionId: z.string(),
  // Verschlüsselte Antwort
  encryptedValue: z.string(),
  // Metadaten (unverschlüsselt)
  questionType: z.enum([
    'text',
    'textarea',
    'number',
    'date',
    'checkbox',
    'radio',
    'select',
    'multiselect',
  ]),
  answeredAt: z.date(),
  updatedAt: z.date(),
  // Optionale Spracherkennung/OCR Daten
  sourceType: z.enum(['manual', 'voice', 'ocr']).default('manual'),
  confidence: z.number().min(0).max(1).optional(), // Für voice/OCR
  // Audit für DSGVO
  auditLog: z.array(
    z.object({
      action: z.enum(['created', 'updated', 'deleted']),
      timestamp: z.date(),
      details: z.string().optional(),
    }),
  ),
});

export type Answer = z.infer<typeof AnswerSchema>;

/**
 * Answer Entity mit Validation
 */
export class AnswerEntity {
  private constructor(private readonly data: Answer) {
    AnswerSchema.parse(data);
  }

  static create(params: {
    questionnaireId: string;
    questionId: string;
    encryptedValue: string;
    questionType: QuestionType;
    sourceType?: Answer['sourceType'];
    confidence?: number;
  }): AnswerEntity {
    const id = crypto.randomUUID();
    const now = new Date();

    return new AnswerEntity({
      id,
      questionnaireId: params.questionnaireId,
      questionId: params.questionId,
      encryptedValue: params.encryptedValue,
      questionType: params.questionType,
      answeredAt: now,
      updatedAt: now,
      sourceType: params.sourceType ?? 'manual',
      confidence: params.confidence,
      auditLog: [
        {
          action: 'created',
          timestamp: now,
          details: `Answer created via ${params.sourceType ?? 'manual'}`,
        },
      ],
    });
  }

  // Getters
  get id(): string {
    return this.data.id;
  }

  get questionnaireId(): string {
    return this.data.questionnaireId;
  }

  get questionId(): string {
    return this.data.questionId;
  }

  get encryptedValue(): string {
    return this.data.encryptedValue;
  }

  get questionType(): QuestionType {
    return this.data.questionType;
  }

  get sourceType(): Answer['sourceType'] {
    return this.data.sourceType;
  }

  get confidence(): number | undefined {
    return this.data.confidence;
  }

  get answeredAt(): Date {
    return this.data.answeredAt;
  }

  get updatedAt(): Date {
    return this.data.updatedAt;
  }

  get auditLog(): Answer['auditLog'] {
    return this.data.auditLog;
  }

  // Business Logic

  /**
   * Antwort aktualisieren
   */
  update(encryptedValue: string, sourceType?: Answer['sourceType']): AnswerEntity {
    const now = new Date();
    return new AnswerEntity({
      ...this.data,
      encryptedValue,
      sourceType: sourceType ?? this.data.sourceType,
      updatedAt: now,
      auditLog: [
        ...this.data.auditLog,
        {
          action: 'updated',
          timestamp: now,
          details: `Answer updated via ${sourceType ?? this.data.sourceType}`,
        },
      ],
    });
  }

  /**
   * Audit Log hinzufügen
   */
  addAuditLog(action: Answer['auditLog'][0]['action'], details?: string): AnswerEntity {
    return new AnswerEntity({
      ...this.data,
      auditLog: [
        ...this.data.auditLog,
        {
          action,
          timestamp: new Date(),
          details,
        },
      ],
    });
  }

  /**
   * Prüft ob Antwort per Spracherkennung/OCR erstellt wurde
   */
  isAIGenerated(): boolean {
    return this.data.sourceType === 'voice' || this.data.sourceType === 'ocr';
  }

  /**
   * Prüft ob Confidence-Score ausreichend ist (>= 0.7)
   */
  hasHighConfidence(): boolean {
    return this.data.confidence !== undefined && this.data.confidence >= 0.7;
  }

  /**
   * Zu Plain Object konvertieren
   */
  toJSON(): Answer {
    return {
      ...this.data,
    };
  }

  /**
   * Von Plain Object erstellen
   */
  static fromJSON(json: Answer): AnswerEntity {
    return new AnswerEntity({
      ...json,
      answeredAt: new Date(json.answeredAt),
      updatedAt: new Date(json.updatedAt),
      auditLog: json.auditLog.map(l => ({
        ...l,
        timestamp: new Date(l.timestamp),
      })),
    });
  }
}

/**
 * Answer Validation Rules
 * 
 * Wird vom ValidationService verwendet
 */
export class AnswerValidator {
  private static parseDateInput(value: string): Date | null {
    const trimmed = value.trim();

    // ISO (YYYY-MM-DD)
    const iso = /^\d{4}-\d{2}-\d{2}$/;
    if (iso.test(trimmed)) {
      const d = new Date(`${trimmed}T00:00:00Z`);
      return Number.isNaN(d.getTime()) ? null : d;
    }

    // German format (DD.MM.YYYY)
    const de = /^(\d{2})\.(\d{2})\.(\d{4})$/;
    const match = trimmed.match(de);
    if (match) {
      const day = Number.parseInt(match[1], 10);
      const month = Number.parseInt(match[2], 10);
      const year = Number.parseInt(match[3], 10);

      if (!Number.isInteger(day) || !Number.isInteger(month) || !Number.isInteger(year)) return null;
      if (month < 1 || month > 12) return null;
      if (day < 1 || day > 31) return null;

      // Use UTC to avoid timezone shifts
      const d = new Date(Date.UTC(year, month - 1, day));

      // Validate that JS didn't overflow (e.g. 31.02.2024)
      if (d.getUTCFullYear() !== year || d.getUTCMonth() !== month - 1 || d.getUTCDate() !== day) {
        return null;
      }

      return d;
    }

    return null;
  }

  /**
   * Validiert eine Antwort basierend auf Frage-Definition
   */
  static validate(value: AnswerValue, question: Question): ValidationResult {
    const errors: string[] = [];

    // Required Check
    if (question.required && (value === null || value === undefined || value === '')) {
      errors.push('This field is required');
    }

    if (value === null || value === undefined) {
      return { valid: errors.length === 0, errors };
    }

    // Type-specific Validation
    switch (question.type) {
      case 'text':
      case 'textarea':
        if (typeof value !== 'string') {
          errors.push('Value must be a string');
        } else {
          if (question.validation?.min && value.length < question.validation.min) {
            errors.push(`Minimum length is ${question.validation.min}`);
          }
          if (question.validation?.max && value.length > question.validation.max) {
            errors.push(`Maximum length is ${question.validation.max}`);
          }
          if (question.validation?.pattern) {
            const regex = new RegExp(question.validation.pattern);
            if (!regex.test(value)) {
              errors.push('Invalid format');
            }
          }
        }
        break;

      case 'number':
        if (typeof value !== 'number') {
          errors.push('Value must be a number');
        } else {
          if (question.validation?.min !== undefined && value < question.validation.min) {
            errors.push(`Minimum value is ${question.validation.min}`);
          }
          if (question.validation?.max !== undefined && value > question.validation.max) {
            errors.push(`Maximum value is ${question.validation.max}`);
          }
        }
        break;

      case 'date':
        {
          const dateValue =
            value instanceof Date
              ? value
              : typeof value === 'string'
                ? AnswerValidator.parseDateInput(value)
                : null;

          if (!dateValue) {
            errors.push('Value must be a valid date');
            break;
          }

          if (question.validation?.minDate) {
            const minDate = new Date(question.validation.minDate);
            if (dateValue < minDate) {
              errors.push(`Date must be after ${minDate.toLocaleDateString()}`);
            }
          }
          if (question.validation?.maxDate) {
            const maxDate = new Date(question.validation.maxDate);
            if (dateValue > maxDate) {
              errors.push(`Date must be before ${maxDate.toLocaleDateString()}`);
            }
          }
        }
        break;

      case 'checkbox':
      case 'multiselect':
        if (question.type === 'checkbox' && (!question.options || question.options.length === 0)) {
          if (typeof value !== 'boolean') {
            errors.push('Value must be a boolean');
          }
          break;
        }

        // New: bitset integer
        if (typeof value === 'number') {
          if (!Number.isInteger(value) || value < 0) {
            errors.push('Value must be a non-negative integer');
          }
          break;
        }

        // Legacy: array of option values
        if (!Array.isArray(value)) {
          errors.push('Value must be an array or integer bitset');
        } else {
          const validOptions = question.options?.map(o => o.value) ?? [];
          const invalidOptions = value.filter(v => !validOptions.some(opt => String(opt) === String(v)));
          if (invalidOptions.length > 0) {
            errors.push(`Invalid options: ${invalidOptions.join(', ')}`);
          }
        }
        break;

      case 'radio':
      case 'select':
        if (typeof value !== 'string' && typeof value !== 'number') {
          errors.push('Value must be a string or number');
        } else {
          const validOptions = question.options?.map(o => o.value) ?? [];
          const isValid = validOptions.some((opt) => String(opt) === String(value));
          if (!isValid) {
            errors.push('Invalid option');
          }
        }
        break;
    }

    return { valid: errors.length === 0, errors };
  }
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}
