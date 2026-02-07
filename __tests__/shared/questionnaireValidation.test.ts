import type { Question } from '../../src/domain/entities/Questionnaire';
import { isMissingRequiredAnswer } from '../../src/shared/questionnaireValidation';

describe('isMissingRequiredAnswer', () => {
  it('treats required single checkbox as missing when unchecked', () => {
    const question: Question = {
      id: '9100',
      type: 'checkbox',
      labelKey: 'questions.9100',
      required: true,
    };

    expect(isMissingRequiredAnswer(question, false)).toBe(true);
    expect(isMissingRequiredAnswer(question, true)).toBe(false);
  });

  it('treats empty string as missing for text questions', () => {
    const question: Question = {
      id: '1',
      type: 'text',
      labelKey: 'questions.1',
      required: true,
    };

    expect(isMissingRequiredAnswer(question, '')).toBe(true);
    expect(isMissingRequiredAnswer(question, 'ok')).toBe(false);
  });

  it('treats empty checkbox bitset as missing for multiselect', () => {
    const question: Question = {
      id: '2',
      type: 'multiselect',
      labelKey: 'questions.2',
      required: true,
      options: [{ value: 1, labelKey: 'options.ja' }],
    };

    expect(isMissingRequiredAnswer(question, 0)).toBe(true);
    expect(isMissingRequiredAnswer(question, 1)).toBe(false);
  });
});
