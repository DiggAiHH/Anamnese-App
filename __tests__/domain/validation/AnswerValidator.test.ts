/**
 * Unit tests for AnswerValidator.
 */

import { AnswerValidator } from '@domain/validation/AnswerValidator';
import { BackendErrorCode } from '@shared/BackendError';
import type { Question } from '@domain/entities/Questionnaire';
import type { AnswerValue } from '@domain/entities/Answer';

describe('AnswerValidator', () => {
  describe('validateAnswer()', () => {
    describe('required field validation', () => {
      const requiredQuestion: Question = {
        id: 'q1',
        type: 'text',
        labelKey: 'test.question',
        required: true,
      };

      it('should fail for undefined value on required question', () => {
        const result = AnswerValidator.validateAnswer(requiredQuestion, undefined);
        
        expect(result.valid).toBe(false);
        if (!result.valid) {
          expect(result.errors[0].code).toBe(BackendErrorCode.REQUIRED_FIELD_MISSING);
        }
      });

      it('should fail for empty string on required question', () => {
        const result = AnswerValidator.validateAnswer(requiredQuestion, '');
        
        expect(result.valid).toBe(false);
      });

      it('should fail for whitespace-only string on required question', () => {
        const result = AnswerValidator.validateAnswer(requiredQuestion, '   ');
        
        expect(result.valid).toBe(false);
      });

      it('should pass for non-empty value on required question', () => {
        const result = AnswerValidator.validateAnswer(requiredQuestion, 'valid answer');
        
        expect(result.valid).toBe(true);
      });
    });

    describe('optional field validation', () => {
      const optionalQuestion: Question = {
        id: 'q1',
        type: 'text',
        labelKey: 'test.question',
        required: false,
      };

      it('should pass for undefined value on optional question', () => {
        const result = AnswerValidator.validateAnswer(optionalQuestion, undefined);
        
        expect(result.valid).toBe(true);
      });

      it('should pass for empty string on optional question', () => {
        const result = AnswerValidator.validateAnswer(optionalQuestion, '');
        
        expect(result.valid).toBe(true);
      });
    });

    describe('text type validation', () => {
      const textQuestion: Question = {
        id: 'q1',
        type: 'text',
        labelKey: 'test.question',
        required: true,
      };

      it('should pass for string value', () => {
        const result = AnswerValidator.validateAnswer(textQuestion, 'test answer');
        
        expect(result.valid).toBe(true);
      });

      it('should fail for number value', () => {
        const result = AnswerValidator.validateAnswer(textQuestion, 123 as unknown as AnswerValue);
        
        expect(result.valid).toBe(false);
        if (!result.valid) {
          expect(result.errors[0].code).toBe(BackendErrorCode.INVALID_INPUT);
        }
      });
    });

    describe('number type validation', () => {
      const numberQuestion: Question = {
        id: 'q1',
        type: 'number',
        labelKey: 'test.question',
        required: true,
        validation: { min: 0, max: 100 },
      };

      it('should pass for valid number in range', () => {
        const result = AnswerValidator.validateAnswer(numberQuestion, 50);
        
        expect(result.valid).toBe(true);
      });

      it('should fail for number below min', () => {
        const result = AnswerValidator.validateAnswer(numberQuestion, -10);
        
        expect(result.valid).toBe(false);
        if (!result.valid) {
          expect(result.errors[0].message).toContain('mindestens');
        }
      });

      it('should fail for number above max', () => {
        const result = AnswerValidator.validateAnswer(numberQuestion, 150);
        
        expect(result.valid).toBe(false);
        if (!result.valid) {
          expect(result.errors[0].message).toContain('höchstens');
        }
      });
    });

    describe('date type validation', () => {
      const dateQuestion: Question = {
        id: 'q1',
        type: 'date',
        labelKey: 'test.question',
        required: true,
        validation: {
          minDate: '2020-01-01',
          maxDate: '2030-12-31',
        },
      };

      it('should pass for valid date in range', () => {
        const result = AnswerValidator.validateAnswer(dateQuestion, '2025-06-15');
        
        expect(result.valid).toBe(true);
      });

      it('should fail for date before minDate', () => {
        const result = AnswerValidator.validateAnswer(dateQuestion, '2019-01-01');
        
        expect(result.valid).toBe(false);
        if (!result.valid) {
          expect(result.errors[0].message).toContain('nach');
        }
      });

      it('should fail for date after maxDate', () => {
        const result = AnswerValidator.validateAnswer(dateQuestion, '2031-01-01');
        
        expect(result.valid).toBe(false);
        if (!result.valid) {
          expect(result.errors[0].message).toContain('vor');
        }
      });

      it('should fail for invalid date format', () => {
        const result = AnswerValidator.validateAnswer(dateQuestion, 'invalid-date');
        
        expect(result.valid).toBe(false);
        if (!result.valid) {
          expect(result.errors[0].message).toContain('Datumsformat');
        }
      });
    });

    describe('pattern validation', () => {
      const patternQuestion: Question = {
        id: 'q1',
        type: 'text',
        labelKey: 'test.question',
        required: true,
        validation: {
          pattern: '^[A-Z]{2}\\d{6}$', // e.g., AB123456
        },
      };

      it('should pass for value matching pattern', () => {
        const result = AnswerValidator.validateAnswer(patternQuestion, 'AB123456');
        
        expect(result.valid).toBe(true);
      });

      it('should fail for value not matching pattern', () => {
        const result = AnswerValidator.validateAnswer(patternQuestion, 'invalid');
        
        expect(result.valid).toBe(false);
        if (!result.valid) {
          expect(result.errors[0].message).toContain('Format');
        }
      });
    });

    describe('checkbox type validation', () => {
      const checkboxQuestion: Question = {
        id: 'q1',
        type: 'checkbox',
        labelKey: 'test.question',
        required: true,
      };

      it('should pass for boolean true', () => {
        const result = AnswerValidator.validateAnswer(checkboxQuestion, true);
        
        expect(result.valid).toBe(true);
      });

      it('should pass for array value', () => {
        const result = AnswerValidator.validateAnswer(checkboxQuestion, ['option1', 'option2']);
        
        expect(result.valid).toBe(true);
      });
    });

    describe('select/radio type validation', () => {
      const selectQuestion: Question = {
        id: 'q1',
        type: 'select',
        labelKey: 'test.question',
        required: true,
        options: [
          { value: 'opt1', labelKey: 'option1' },
          { value: 'opt2', labelKey: 'option2' },
        ],
      };

      it('should pass for string value', () => {
        const result = AnswerValidator.validateAnswer(selectQuestion, 'opt1');
        
        expect(result.valid).toBe(true);
      });

      it('should pass for numeric value', () => {
        const result = AnswerValidator.validateAnswer(selectQuestion, 1);
        
        expect(result.valid).toBe(true);
      });
    });
  });

  describe('validateAnswers()', () => {
    const questions: Question[] = [
      { id: 'q1', type: 'text', labelKey: 'q1', required: true },
      { id: 'q2', type: 'number', labelKey: 'q2', required: true, validation: { min: 0 } },
      { id: 'q3', type: 'text', labelKey: 'q3', required: false },
    ];

    it('should pass when all required questions are answered correctly', () => {
      const answers = new Map<string, AnswerValue>([
        ['q1', 'answer1'],
        ['q2', 10],
      ]);
      
      const result = AnswerValidator.validateAnswers(questions, answers);
      
      expect(result.valid).toBe(true);
    });

    it('should fail when required question is missing', () => {
      const answers = new Map<string, AnswerValue>([
        ['q2', 10],
      ]);
      
      const result = AnswerValidator.validateAnswers(questions, answers);
      
      expect(result.valid).toBe(false);
    });

    it('should collect multiple errors', () => {
      const answers = new Map<string, AnswerValue>([
        ['q1', ''],
        ['q2', -5],
      ]);
      
      const result = AnswerValidator.validateAnswers(questions, answers);
      
      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.errors.length).toBeGreaterThanOrEqual(2);
      }
    });
  });
});
