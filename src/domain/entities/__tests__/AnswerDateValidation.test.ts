import { AnswerValidator } from '../Answer';
import type { Question } from '../Questionnaire';

describe('AnswerValidator date handling', () => {
  const question: Question = {
    id: 'birth_date',
    type: 'date',
    labelKey: 'Birth date',
    required: true,
  };

  it('accepts DD.MM.YYYY strings', () => {
    const result = AnswerValidator.validate('31.12.2024', question);
    expect(result.valid).toBe(true);
  });

  it('accepts YYYY-MM-DD strings', () => {
    const result = AnswerValidator.validate('2024-12-31', question);
    expect(result.valid).toBe(true);
  });

  it('rejects invalid date strings', () => {
    const result = AnswerValidator.validate('31.02.2024', question);
    expect(result.valid).toBe(false);
  });
});
