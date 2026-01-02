import { QuestionnaireEntity, QuestionType, Section } from '../Questionnaire';

describe('QuestionnaireEntity', () => {
  const sections: Section[] = [
    {
      id: 'personal',
      titleKey: 'sections.personal.title',
      descriptionKey: 'sections.personal.description',
      order: 2,
      questions: [
        {
          id: 'first_name',
          type: 'text' as QuestionType,
          labelKey: 'questions.first_name',
          required: true,
          validation: { min: 2, max: 50 },
        },
        {
          id: 'gender',
          type: 'radio' as QuestionType,
          labelKey: 'questions.gender',
          required: true,
          options: [
            { value: 'male', labelKey: 'male' },
            { value: 'female', labelKey: 'female' },
          ],
        },
      ],
    },
    {
      id: 'womens_health',
      titleKey: 'sections.womens_health.title',
      order: 1,
      questions: [
        {
          id: 'pregnancy',
          type: 'radio' as QuestionType,
          labelKey: 'questions.pregnancy',
          required: false,
          options: [
            { value: 'yes', labelKey: 'yes' },
            { value: 'no', labelKey: 'no' },
          ],
          conditions: [
            { questionId: 'gender', operator: 'equals', value: 'female' },
          ],
        },
      ],
    },
  ];

  it('creates and sorts sections by order', () => {
    const questionnaire = QuestionnaireEntity.create({
      patientId: '22222222-2222-2222-2222-222222222222',
      sections,
      version: '1.0.0',
    });

    expect(questionnaire.sections[0].id).toBe('womens_health');
    expect(questionnaire.status).toBe('draft');
    expect(questionnaire.completedAt).toBeNull();
  });

  it('evaluates conditional visibility', () => {
    const questionnaire = QuestionnaireEntity.create('22222222-2222-2222-2222-222222222222', sections, '1.0.0');
    const noAnswers = questionnaire.getVisibleQuestions(new Map());
    expect(noAnswers.map(q => q.id)).toEqual(['first_name', 'gender']);

    const withGender = questionnaire.getVisibleQuestions(new Map([['gender', 'female']]));
    expect(withGender.map(q => q.id)).toContain('pregnancy');
  });

  it('calculates progress based on visible answered questions', () => {
    const questionnaire = QuestionnaireEntity.create('22222222-2222-2222-2222-222222222222', sections, '1.0.0');
    const answers = new Map<string, unknown>();

    expect(questionnaire.calculateProgress(answers)).toBe(0);

    answers.set('first_name', 'Anna');
    expect(questionnaire.calculateProgress(answers)).toBe(50);

    answers.set('gender', 'female');
    answers.set('pregnancy', 'no');
    expect(questionnaire.calculateProgress(answers)).toBe(100);
  });
});
