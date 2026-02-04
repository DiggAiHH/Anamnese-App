/**
 * InMemoryQuestionUniverseRepository Tests
 */

import { InMemoryQuestionUniverseRepository } from '@infrastructure/persistence/InMemoryQuestionUniverseRepository';
import { QuestionUniverseEntity } from '@domain/entities/QuestionUniverse';

describe('InMemoryQuestionUniverseRepository', () => {
    let repository: InMemoryQuestionUniverseRepository;

    beforeEach(() => {
        repository = new InMemoryQuestionUniverseRepository();
    });

    // Helper to create test questions
    const createQuestion = (overrides: Partial<Parameters<typeof QuestionUniverseEntity.create>[0]> = {}) =>
        QuestionUniverseEntity.create({
            templateId: 'template-1',
            type: 'text',
            labelKey: 'question.test',
            ...overrides,
        });

    describe('CRUD operations', () => {
        it('should save and find a question by ID', async () => {
            const question = createQuestion();
            await repository.save(question);

            const found = await repository.findById(question.id);

            expect(found).not.toBeNull();
            expect(found?.id).toBe(question.id);
            expect(found?.labelKey).toBe(question.labelKey);
        });

        it('should return null for non-existent ID', async () => {
            const found = await repository.findById('non-existent-id');

            expect(found).toBeNull();
        });

        it('should save all questions in batch', async () => {
            const questions = [
                createQuestion({ labelKey: 'q1' }),
                createQuestion({ labelKey: 'q2' }),
                createQuestion({ labelKey: 'q3' }),
            ];

            await repository.saveAll(questions);

            const all = await repository.findAll();
            expect(all).toHaveLength(3);
        });

        it('should delete a question', async () => {
            const question = createQuestion();
            await repository.save(question);

            await repository.delete(question.id);

            const found = await repository.findById(question.id);
            expect(found).toBeNull();
        });

        it('should delete all questions', async () => {
            await repository.saveAll([
                createQuestion({ labelKey: 'q1' }),
                createQuestion({ labelKey: 'q2' }),
            ]);

            await repository.deleteAll();

            const all = await repository.findAll();
            expect(all).toHaveLength(0);
        });
    });

    describe('query operations', () => {
        beforeEach(async () => {
            await repository.saveAll([
                createQuestion({ templateId: 'template-1', sectionId: 'section-a', labelKey: 'q1' }),
                createQuestion({ templateId: 'template-1', sectionId: 'section-b', labelKey: 'q2' }),
                createQuestion({ templateId: 'template-2', sectionId: 'section-a', labelKey: 'q3' }),
            ]);
        });

        it('should find all questions', async () => {
            const all = await repository.findAll();

            expect(all).toHaveLength(3);
        });

        it('should find questions by template ID', async () => {
            const questions = await repository.findByTemplateId('template-1');

            expect(questions).toHaveLength(2);
            expect(questions.every(q => q.templateId === 'template-1')).toBe(true);
        });

        it('should find questions by section ID', async () => {
            const questions = await repository.findBySectionId('section-a');

            expect(questions).toHaveLength(2);
            expect(questions.every(q => q.sectionId === 'section-a')).toBe(true);
        });
    });

    describe('research/statistics queries', () => {
        beforeEach(async () => {
            await repository.saveAll([
                createQuestion({
                    labelKey: 'q1',
                    metadata: {
                        researchTags: ['diabetes', 'metabolism'],
                        icd10Codes: ['E11'],
                        statisticGroup: 'clinical',
                        gdprRelated: true,
                    },
                }),
                createQuestion({
                    labelKey: 'q2',
                    metadata: {
                        researchTags: ['diabetes'],
                        icd10Codes: ['E11', 'E12'],
                        statisticGroup: 'clinical',
                    },
                }),
                createQuestion({
                    labelKey: 'q3',
                    metadata: {
                        researchTags: ['cardiology'],
                        statisticGroup: 'demographics',
                    },
                }),
            ]);
        });

        it('should find questions by research tag', async () => {
            const diabetesQuestions = await repository.findByResearchTag('diabetes');
            expect(diabetesQuestions).toHaveLength(2);

            const cardiologyQuestions = await repository.findByResearchTag('cardiology');
            expect(cardiologyQuestions).toHaveLength(1);

            const unknownQuestions = await repository.findByResearchTag('unknown');
            expect(unknownQuestions).toHaveLength(0);
        });

        it('should find questions by ICD-10 code', async () => {
            const e11Questions = await repository.findByIcd10Code('E11');
            expect(e11Questions).toHaveLength(2);

            const e12Questions = await repository.findByIcd10Code('E12');
            expect(e12Questions).toHaveLength(1);
        });

        it('should find questions by statistic group', async () => {
            const clinicalQuestions = await repository.findByStatisticGroup('clinical');
            expect(clinicalQuestions).toHaveLength(2);

            const demographicsQuestions = await repository.findByStatisticGroup('demographics');
            expect(demographicsQuestions).toHaveLength(1);
        });

        it('should find GDPR-related questions', async () => {
            const gdprQuestions = await repository.findGdprRelated();
            expect(gdprQuestions).toHaveLength(1);
        });
    });

    describe('count operations', () => {
        beforeEach(async () => {
            await repository.saveAll([
                createQuestion({ type: 'text' }),
                createQuestion({ type: 'text' }),
                createQuestion({ type: 'number' }),
                createQuestion({ type: 'radio', options: [{ value: 1, labelKey: 'opt' }] }),
            ]);
        });

        it('should count total questions', async () => {
            const count = await repository.count();
            expect(count).toBe(4);
        });

        it('should count questions by type', async () => {
            expect(await repository.countByType('text')).toBe(2);
            expect(await repository.countByType('number')).toBe(1);
            expect(await repository.countByType('radio')).toBe(1);
            expect(await repository.countByType('date')).toBe(0);
        });
    });

    describe('test helpers', () => {
        it('should clear all data', async () => {
            await repository.save(createQuestion());

            repository.clear();

            expect(await repository.count()).toBe(0);
        });

        it('should get all for assertions', async () => {
            const q1 = createQuestion({ labelKey: 'q1' });
            const q2 = createQuestion({ labelKey: 'q2' });
            await repository.saveAll([q1, q2]);

            const all = repository.getAll();

            expect(all).toHaveLength(2);
        });
    });
});
