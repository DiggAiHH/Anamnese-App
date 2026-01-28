/**
 * Answer Validator
 *
 * Validates answer data before persistence.
 * Uses ValidationResult type for consistent error handling.
 */

import {
  ValidationResult,
  ValidationError,
  validationOk,
  validationErr,
  BackendErrorCode,
} from '@shared/BackendError';
import type { Question, QuestionType } from '../entities/Questionnaire';
import type { AnswerValue } from '../entities/Answer';

/**
 * Answer validation rules.
 */
export class AnswerValidator {
  /**
   * Validate an answer value against a question definition.
   */
  static validateAnswer(
    question: Question,
    value: AnswerValue | undefined,
  ): ValidationResult {
    const errors: ValidationError[] = [];

    // Check required
    if (question.required && this.isEmpty(value)) {
      errors.push({
        field: question.id,
        message: 'Dieses Feld ist erforderlich',
        code: BackendErrorCode.REQUIRED_FIELD_MISSING,
      });
      return validationErr(errors);
    }

    // Skip further validation if empty and not required
    if (this.isEmpty(value) || value === undefined || value === null) {
      return validationOk();
    }

    // Type-specific validation (value is now guaranteed non-null/undefined)
    const typeResult = this.validateType(question, value);
    if (!typeResult.valid) {
      return typeResult;
    }

    // Range validation for numbers
    if (question.type === 'number' && typeof value === 'number') {
      const rangeResult = this.validateNumberRange(question, value);
      if (!rangeResult.valid) {
        return rangeResult;
      }
    }

    // Date validation
    if (question.type === 'date' && typeof value === 'string') {
      const dateResult = this.validateDate(question, value);
      if (!dateResult.valid) {
        return dateResult;
      }
    }

    // Pattern validation for text
    if (
      (question.type === 'text' || question.type === 'textarea') &&
      typeof value === 'string' &&
      question.validation?.pattern
    ) {
      const patternResult = this.validatePattern(question, value);
      if (!patternResult.valid) {
        return patternResult;
      }
    }

    return validationOk();
  }

  /**
   * Validate multiple answers at once.
   */
  static validateAnswers(
    questions: Question[],
    answers: Map<string, AnswerValue>,
  ): ValidationResult {
    const errors: ValidationError[] = [];

    for (const question of questions) {
      const value = answers.get(question.id);
      const result = this.validateAnswer(question, value);
      if (!result.valid) {
        errors.push(...result.errors);
      }
    }

    return errors.length > 0 ? validationErr(errors) : validationOk();
  }

  // Helper methods

  private static isEmpty(value: AnswerValue | undefined): boolean {
    if (value === null || value === undefined) return true;
    if (typeof value === 'string') return value.trim().length === 0;
    if (Array.isArray(value)) return value.length === 0;
    return false;
  }

  private static validateType(
    question: Question,
    value: AnswerValue,
  ): ValidationResult {
    const errors: ValidationError[] = [];
    const { type, id } = question;

    const typeChecks: Record<QuestionType, () => boolean> = {
      text: () => typeof value === 'string',
      textarea: () => typeof value === 'string',
      number: () => typeof value === 'number' && !isNaN(value),
      date: () => typeof value === 'string',
      checkbox: () => typeof value === 'boolean' || Array.isArray(value),
      radio: () => typeof value === 'string' || typeof value === 'number',
      select: () => typeof value === 'string' || typeof value === 'number',
      multiselect: () => Array.isArray(value),
    };

    const isValid = typeChecks[type]?.() ?? true;

    if (!isValid) {
      errors.push({
        field: id,
        message: `Ungültiger Datentyp für ${type}`,
        code: BackendErrorCode.INVALID_INPUT,
      });
    }

    return errors.length > 0 ? validationErr(errors) : validationOk();
  }

  private static validateNumberRange(
    question: Question,
    value: number,
  ): ValidationResult {
    const errors: ValidationError[] = [];
    const { validation, id } = question;

    if (validation?.min !== undefined && value < validation.min) {
      errors.push({
        field: id,
        message: `Wert muss mindestens ${validation.min} sein`,
        code: BackendErrorCode.INVALID_INPUT,
      });
    }

    if (validation?.max !== undefined && value > validation.max) {
      errors.push({
        field: id,
        message: `Wert darf höchstens ${validation.max} sein`,
        code: BackendErrorCode.INVALID_INPUT,
      });
    }

    return errors.length > 0 ? validationErr(errors) : validationOk();
  }

  private static validateDate(
    question: Question,
    value: string,
  ): ValidationResult {
    const errors: ValidationError[] = [];
    const { validation, id } = question;

    const date = new Date(value);
    if (isNaN(date.getTime())) {
      errors.push({
        field: id,
        message: 'Ungültiges Datumsformat',
        code: BackendErrorCode.INVALID_INPUT,
      });
      return validationErr(errors);
    }

    if (validation?.minDate) {
      const minDate = new Date(validation.minDate);
      if (date < minDate) {
        errors.push({
          field: id,
          message: `Datum muss nach ${validation.minDate} liegen`,
          code: BackendErrorCode.INVALID_INPUT,
        });
      }
    }

    if (validation?.maxDate) {
      const maxDate = new Date(validation.maxDate);
      if (date > maxDate) {
        errors.push({
          field: id,
          message: `Datum muss vor ${validation.maxDate} liegen`,
          code: BackendErrorCode.INVALID_INPUT,
        });
      }
    }

    return errors.length > 0 ? validationErr(errors) : validationOk();
  }

  private static validatePattern(
    question: Question,
    value: string,
  ): ValidationResult {
    const errors: ValidationError[] = [];
    const pattern = question.validation?.pattern;

    if (pattern) {
      try {
        const regex = new RegExp(pattern);
        if (!regex.test(value)) {
          errors.push({
            field: question.id,
            message: 'Eingabe entspricht nicht dem erwarteten Format',
            code: BackendErrorCode.INVALID_INPUT,
          });
        }
      } catch {
        // Invalid regex pattern - skip validation
      }
    }

    return errors.length > 0 ? validationErr(errors) : validationOk();
  }
}
