/**
 * QuestionFactory Tests
 */

import { QuestionFactory } from '@domain/factories/QuestionFactory';

describe('QuestionFactory', () => {
    const baseParams = {
        templateId: 'template-1',
        labelKey: 'question.test',
    };

    describe('createTextQuestion', () => {
        it('should create a text question', () => {
            const question = QuestionFactory.createTextQuestion(baseParams);

            expect(question.type).toBe('text');
            expect(question.labelKey).toBe('question.test');
            expect(question.required).toBe(false);
        });

        it('should create a text question with research tags', () => {
            const question = QuestionFactory.createTextQuestion({
                ...baseParams,
                statisticGroup: 'demographics',
                researchTags: ['patient-info'],
            });

            expect(question.metadata.statisticGroup).toBe('demographics');
            expect(question.metadata.researchTags).toEqual(['patient-info']);
        });
    });

    describe('createTextareaQuestion', () => {
        it('should create a textarea question', () => {
            const question = QuestionFactory.createTextareaQuestion(baseParams);

            expect(question.type).toBe('textarea');
        });
    });

    describe('createNumberQuestion', () => {
        it('should create a number question with validation', () => {
            const question = QuestionFactory.createNumberQuestion({
                ...baseParams,
                min: 0,
                max: 200,
            });

            expect(question.type).toBe('number');
            expect(question.validation?.min).toBe(0);
            expect(question.validation?.max).toBe(200);
            expect(question.metadata.statisticGroup).toBe('clinical');
        });

        it('should create a number question with ICD-10 codes', () => {
            const question = QuestionFactory.createNumberQuestion({
                ...baseParams,
                icd10Codes: ['I10', 'I15'],
            });

            expect(question.metadata.icd10Codes).toEqual(['I10', 'I15']);
        });
    });

    describe('createDateQuestion', () => {
        it('should create a date question', () => {
            const question = QuestionFactory.createDateQuestion(baseParams);

            expect(question.type).toBe('date');
            expect(question.metadata.statisticGroup).toBe('demographics');
        });

        it('should create a date question with constraints', () => {
            const question = QuestionFactory.createDateQuestion({
                ...baseParams,
                minDate: '2000-01-01',
                maxDate: '2025-12-31',
            });

            expect(question.validation?.minDate).toBe('2000-01-01');
            expect(question.validation?.maxDate).toBe('2025-12-31');
        });
    });

    describe('createBirthdateQuestion', () => {
        it('should create a birthdate question with appropriate constraints', () => {
            const question = QuestionFactory.createBirthdateQuestion(baseParams);

            expect(question.type).toBe('date');
            expect(question.validation?.minDate).toBeDefined();
            expect(question.validation?.maxDate).toBeDefined();
            expect(question.metadata.statisticGroup).toBe('demographics');
            expect(question.metadata.gdprRelated).toBe(true);
        });
    });

    describe('createRadioQuestion', () => {
        it('should create a radio question with options', () => {
            const question = QuestionFactory.createRadioQuestion({
                ...baseParams,
                options: [
                    { value: 1, labelKey: 'option.a' },
                    { value: 2, labelKey: 'option.b' },
                ],
            });

            expect(question.type).toBe('radio');
            expect(question.options).toHaveLength(2);
        });

        it('should throw if no options provided', () => {
            expect(() =>
                QuestionFactory.createRadioQuestion({
                    ...baseParams,
                    options: [],
                }),
            ).toThrow('Radio question must have at least one option');
        });
    });

    describe('createYesNoQuestion', () => {
        it('should create a yes/no question', () => {
            const question = QuestionFactory.createYesNoQuestion(baseParams);

            expect(question.type).toBe('radio');
            expect(question.options).toHaveLength(2);
            expect(question.options?.[0].value).toBe(1);
            expect(question.options?.[1].value).toBe(0);
        });
    });

    describe('createSelectQuestion', () => {
        it('should create a select question', () => {
            const question = QuestionFactory.createSelectQuestion({
                ...baseParams,
                options: [
                    { value: 'a', labelKey: 'option.a' },
                    { value: 'b', labelKey: 'option.b' },
                ],
            });

            expect(question.type).toBe('select');
        });

        it('should throw if no options provided', () => {
            expect(() =>
                QuestionFactory.createSelectQuestion({
                    ...baseParams,
                    options: [],
                }),
            ).toThrow('Select question must have at least one option');
        });
    });

    describe('createMultiSelectQuestion', () => {
        it('should create a multi-select question', () => {
            const question = QuestionFactory.createMultiSelectQuestion({
                ...baseParams,
                options: [
                    { value: 1, labelKey: 'option.a' },
                    { value: 2, labelKey: 'option.b' },
                ],
            });

            expect(question.type).toBe('multiselect');
        });
    });

    describe('createCheckboxQuestion', () => {
        it('should create a single checkbox question', () => {
            const question = QuestionFactory.createCheckboxQuestion(baseParams);

            expect(question.type).toBe('checkbox');
        });

        it('should create a GDPR-related checkbox', () => {
            const question = QuestionFactory.createCheckboxQuestion({
                ...baseParams,
                gdprRelated: true,
            });

            expect(question.metadata.gdprRelated).toBe(true);
        });
    });

    describe('createMultiCheckboxQuestion', () => {
        it('should create a multi-checkbox question', () => {
            const question = QuestionFactory.createMultiCheckboxQuestion({
                ...baseParams,
                options: [
                    { value: 1, labelKey: 'option.a' },
                    { value: 2, labelKey: 'option.b' },
                ],
            });

            expect(question.type).toBe('checkbox');
            expect(question.options).toHaveLength(2);
        });
    });

    describe('createConsentQuestion', () => {
        it('should create a required consent question', () => {
            const question = QuestionFactory.createConsentQuestion({
                ...baseParams,
                consentType: 'required',
            });

            expect(question.type).toBe('checkbox');
            expect(question.required).toBe(true);
            expect(question.metadata.statisticGroup).toBe('consent');
            expect(question.metadata.gdprRelated).toBe(true);
        });

        it('should create an optional consent question', () => {
            const question = QuestionFactory.createConsentQuestion({
                ...baseParams,
                consentType: 'optional',
            });

            expect(question.required).toBe(false);
        });
    });

    describe('createMedicalQuestion', () => {
        it('should create a medical question with ICD-10 codes', () => {
            const question = QuestionFactory.createMedicalQuestion({
                ...baseParams,
                type: 'radio',
                options: [
                    { value: 1, labelKey: 'option.yes' },
                    { value: 0, labelKey: 'option.no' },
                ],
                icd10Codes: ['E11'],
                researchTags: ['diabetes'],
            });

            expect(question.type).toBe('radio');
            expect(question.metadata.statisticGroup).toBe('clinical');
            expect(question.metadata.icd10Codes).toEqual(['E11']);
            expect(question.metadata.researchTags).toEqual(['diabetes']);
        });
    });

    describe('createFromTemplate', () => {
        it('should create multiple questions from a template array', () => {
            const questions = QuestionFactory.createFromTemplate('template-1', [
                { type: 'text', labelKey: 'q1' },
                { type: 'number', labelKey: 'q2', required: true },
                { type: 'date', labelKey: 'q3', sectionId: 'section-1' },
            ]);

            expect(questions).toHaveLength(3);
            expect(questions[0].type).toBe('text');
            expect(questions[1].type).toBe('number');
            expect(questions[1].required).toBe(true);
            expect(questions[2].sectionId).toBe('section-1');
        });

        it('should assign sort order based on position', () => {
            const questions = QuestionFactory.createFromTemplate('template-1', [
                { type: 'text', labelKey: 'q1' },
                { type: 'text', labelKey: 'q2' },
                { type: 'text', labelKey: 'q3' },
            ]);

            expect(questions[0].metadata.sortOrder).toBe(1);
            expect(questions[1].metadata.sortOrder).toBe(2);
            expect(questions[2].metadata.sortOrder).toBe(3);
        });
    });
});
