import { QuestionnaireEntity, type Section } from '../Questionnaire';

describe('QuestionnaireEntity.toCompartmentQuestions', () => {
  it('maps questions to CompartmentQuestion using metadata ids/orders', () => {
    const sections: Section[] = [
      {
        id: 'q0000',
        titleKey: '👤 Basisdaten',
        order: 1,
        questions: [
          {
            id: '1',
            type: 'text',
            labelKey: 'Vorname',
            required: true,
            metadata: {
              compartmentId: 1,
              compartmentOrder: 10,
              compartmentCode: '1',
              compartmentSection: '👤 Basisdaten',
              compartmentConcept: 'q0000',
            },
          },
          {
            id: '2',
            type: 'radio',
            labelKey: 'Ja/Nein',
            required: false,
            options: [
              { value: 1, labelKey: 'Ja' },
              { value: 0, labelKey: 'Nein' },
            ],
            metadata: {
              compartmentId: 2,
              compartmentOrder: 11,
              compartmentCode: '2',
              compartmentSection: '👤 Basisdaten',
              compartmentConcept: 'q0000',
            },
          },
        ],
      },
    ];

    const q = QuestionnaireEntity.create({
      patientId: crypto.randomUUID(),
      sections,
      version: 'test',
    });

    const compartments = q.toCompartmentQuestions();
    expect(compartments).toHaveLength(2);

    expect(compartments[0]).toMatchObject({
      id: 1,
      order: 10,
      code: '1',
      section: '👤 Basisdaten',
      concept: 'q0000',
      label: 'Vorname',
      inputType: 'text',
      required: true,
    });

    expect(compartments[1]).toMatchObject({
      id: 2,
      order: 11,
      inputType: 'binary',
    });
  });
});
