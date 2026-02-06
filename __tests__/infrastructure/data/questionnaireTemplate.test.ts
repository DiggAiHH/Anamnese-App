import rawTemplate from '../../../src/infrastructure/data/questionnaire-template.json';

const template = rawTemplate as unknown as {
  sections: Array<{
    id: string;
    questions: Array<{
      id: string;
      type?: string;
      nextMap?: Record<string, string | string[]>;
    }>;
  }>;
};

const findQuestion = (sectionId: string, questionId: string) => {
  const section = template.sections.find(s => s.id === sectionId);
  if (!section) return undefined;
  return section.questions.find(q => q.id === questionId);
};

describe('questionnaire-template dependencies', () => {
  it('section q2000 contains Versicherungsstatus question', () => {
    const question = findQuestion('q2000', '2000');
    expect(question).toBeDefined();
    expect(question?.type).toBe('select');
  });

  it('section q2001 contains follow-up Termin question', () => {
    const question = findQuestion('q2001', '2001');
    expect(question).toBeDefined();
    expect(question?.type).toBe('select');
  });

  it('question 2000 in q2000 has nextMap routing for Privat-Selbstzahler', () => {
    const question = findQuestion('q2000', '2000') as { nextMap?: Record<string, string> };
    expect(question).toBeDefined();
    expect(question?.nextMap).toBeDefined();
    expect(question?.nextMap?.['Privat-Selbstzahler']).toBe('q2001');
  });
});
