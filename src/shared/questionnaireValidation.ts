import type { Question } from '@domain/entities/Questionnaire';
import type { AnswerValue } from '@domain/entities/Answer';

export const isMissingRequiredAnswer = (question: Question, value: AnswerValue | undefined): boolean => {
  if (value === null || value === undefined) return true;

  if (question.type === 'checkbox' && !question.options) {
    return value !== true;
  }

  if (typeof value === 'string') return value.trim().length === 0;
  if (typeof value === 'boolean') return value === false;

  if (typeof value === 'number') {
    if (question.type === 'select' || question.type === 'radio') return value === 0;
    if (question.type === 'checkbox' || question.type === 'multiselect') return value === 0;
    return false;
  }

  if (Array.isArray(value)) return value.length === 0;
  return false;
};
