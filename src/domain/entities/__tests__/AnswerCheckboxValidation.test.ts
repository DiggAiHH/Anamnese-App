import { AnswerValidator } from '../Answer';
import type { Question } from '../Questionnaire';

describe('AnswerValidator checkbox handling', () => {
  it('accepts boolean for checkbox without options', () => {
    const question: Question = {
      id: 'confirm',
      type: 'checkbox',
      labelKey: 'Confirm',
      required: true,
    };

    const result = AnswerValidator.validate(true, question);
    expect(result.valid).toBe(true);
  });

  it('rejects boolean for checkbox with options', () => {
    const question: Question = {
      id: 'symptoms',
      type: 'checkbox',
      labelKey: 'Symptoms',
      required: false,
      options: [
        { value: 1, labelKey: 'A' },
        { value: 2, labelKey: 'B' },
      ],
    };

    const result = AnswerValidator.validate(true, question);
    expect(result.valid).toBe(false);
  });
});
