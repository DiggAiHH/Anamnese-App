import { QuestionnaireEntity, QuestionType, Section } from '@domain/entities/Questionnaire';

describe('QuestionnaireEntity', () => {
  const sections: Section[] = [
    {
      id: 'personal',
      titleKey: 'sections.personal.title',
      descriptionKey: 'sections.personal.description',
      order: 1,
      questions: [
        {
          id: 'first_name',
          labelKey: 'questions.first_name',
          type: 'text' as QuestionType,
          required: true,
          validation: { min: 2, max: 50 },
        },
        {
          id: 'gender',
          labelKey: 'questions.gender',
          type: 'radio' as QuestionType,
          required: true,
          options: [
            { value: 'male', labelKey: 'options.male' },
            { value: 'female', labelKey: 'options.female' },
          ],
        },
      ],
    },
    {
      id: 'womens_health',
      titleKey: 'sections.womens_health.title',
      order: 2,
      questions: [
        {
          id: 'is_pregnant',
          labelKey: 'questions.is_pregnant',
          type: 'radio' as QuestionType,
          required: false,
          options: [
            { value: 'yes', labelKey: 'options.yes' },
            { value: 'no', labelKey: 'options.no' },
          ],
          conditions: [
            { questionId: 'gender', operator: 'equals', value: 'female' },
          ],
        },
      ],
    },
  ];

  it('creates questionnaire with sections', () => {
    const questionnaire = QuestionnaireEntity.create({
      patientId: '11111111-1111-1111-1111-111111111111',
      version: '1.0.0',
      sections,
    });

    expect(questionnaire.sections).toHaveLength(2);
    expect(questionnaire.status).toBe('draft');
  });

  it('shows conditional questions when criteria met', () => {
    const questionnaire = QuestionnaireEntity.create('11111111-1111-1111-1111-111111111111', sections, '1.0.0');
    const visible = questionnaire.getVisibleQuestions(new Map([['gender', 'female']]));
    expect(visible.some(q => q.id === 'is_pregnant')).toBe(true);
  });

  it('hides conditional questions when criteria not met', () => {
    const questionnaire = QuestionnaireEntity.create('11111111-1111-1111-1111-111111111111', sections, '1.0.0');
    const visible = questionnaire.getVisibleQuestions(new Map([['gender', 'male']]));
    expect(visible.some(q => q.id === 'is_pregnant')).toBe(false);
  });

  it('computes progress based on visible answers', () => {
    const questionnaire = QuestionnaireEntity.create('11111111-1111-1111-1111-111111111111', sections, '1.0.0');
    const answers = new Map<string, unknown>([
      ['first_name', 'John'],
      ['gender', 'male'],
    ]);
    expect(questionnaire.calculateProgress(answers)).toBe(100);
  });
});
