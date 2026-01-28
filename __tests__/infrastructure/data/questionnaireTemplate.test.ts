import rawTemplate from '../../../src/infrastructure/data/questionnaire-template.json';

type Condition = {
  questionId: string;
  operator: string;
  value: string | number | boolean;
};

const template = rawTemplate as unknown as {
  sections: Array<{
    id: string;
    questions: Array<{
      id: string;
      conditions?: Condition[];
    }>;
  }>;
};

const findQuestion = (sectionId: string, questionId: string) => {
  const section = template.sections.find(s => s.id === sectionId);
  if (!section) return undefined;
  return section.questions.find(q => q.id === questionId);
};

const hasCondition = (conditions: Condition[] | undefined, expected: Condition) => {
  if (!conditions) return false;
  return conditions.some(
    c =>
      c.questionId === expected.questionId &&
      c.operator === expected.operator &&
      c.value === expected.value,
  );
};

describe('questionnaire-template dependencies', () => {
  it('shows station field only when stationaer is selected', () => {
    const question = findQuestion('q2000', '2001');
    expect(question).toBeDefined();
    expect(
      hasCondition(question?.conditions as Condition[] | undefined, {
        questionId: '2000',
        operator: 'equals',
        value: 2,
      }),
    ).toBe(true);
  });

  it('shows exam free-text only when Sonstiges is selected', () => {
    const question = findQuestion('q2000', '2005');
    expect(question).toBeDefined();
    expect(
      hasCondition(question?.conditions as Condition[] | undefined, {
        questionId: '2004',
        operator: 'equals',
        value: 'Sonstiges',
      }),
    ).toBe(true);
  });
});
