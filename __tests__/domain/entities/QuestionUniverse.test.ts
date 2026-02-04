/**
 * QuestionUniverse Entity Tests
 */

import { QuestionUniverseEntity, QuestionUniverseSchema } from '@domain/entities/QuestionUniverse';

describe('QuestionUniverseEntity', () => {
    describe('create', () => {
        it('should create a text question with minimal params', () => {
            const question = QuestionUniverseEntity.create({
                templateId: 'template-1',
                type: 'text',
                labelKey: 'question.name',
            });

            expect(question.id).toBeDefined();
            expect(question.templateId).toBe('template-1');
            expect(question.type).toBe('text');
            expect(question.labelKey).toBe('question.name');
            expect(question.required).toBe(false);
            expect(question.version).toBe(1);
        });

        it('should create a required radio question with options', () => {
            const question = QuestionUniverseEntity.create({
                templateId: 'template-1',
                type: 'radio',
                labelKey: 'question.gender',
                required: true,
                options: [
                    { value: 1, labelKey: 'option.male' },
                    { value: 2, labelKey: 'option.female' },
                    { value: 3, labelKey: 'option.diverse' },
                ],
            });

            expect(question.required).toBe(true);
            expect(question.options).toHaveLength(3);
            expect(question.options?.[0].value).toBe(1);
        });

        it('should create a question with section ID', () => {
            const question = QuestionUniverseEntity.create({
                templateId: 'template-1',
                sectionId: 'section-demographics',
                type: 'date',
                labelKey: 'question.birthdate',
            });

            expect(question.sectionId).toBe('section-demographics');
        });

        it('should create a question with full metadata', () => {
            const question = QuestionUniverseEntity.create({
                templateId: 'template-1',
                type: 'number',
                labelKey: 'question.bloodPressure',
                metadata: {
                    statisticGroup: 'cardiovascular',
                    researchTags: ['hypertension', 'heart'],
                    icd10Codes: ['I10', 'I15'],
                    compartmentId: 42,
                    gdprRelated: false,
                },
            });

            expect(question.metadata.statisticGroup).toBe('cardiovascular');
            expect(question.metadata.researchTags).toEqual(['hypertension', 'heart']);
            expect(question.metadata.icd10Codes).toEqual(['I10', 'I15']);
            expect(question.metadata.compartmentId).toBe(42);
        });

        it('should set timestamps correctly', () => {
            const before = new Date();
            const question = QuestionUniverseEntity.create({
                templateId: 'template-1',
                type: 'text',
                labelKey: 'question.test',
            });
            const after = new Date();

            expect(question.createdAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
            expect(question.createdAt.getTime()).toBeLessThanOrEqual(after.getTime());
            expect(question.updatedAt.getTime()).toBe(question.createdAt.getTime());
        });
    });

    describe('fromLegacyQuestion', () => {
        it('should convert a legacy question to QuestionUniverse', () => {
            const legacyQuestion = {
                id: 'q001',
                type: 'text' as const,
                labelKey: 'question.firstName',
                required: true,
                metadata: {
                    compartmentId: 1,
                    fieldName: 'firstName',
                    gdprRelated: true,
                },
            };

            const question = QuestionUniverseEntity.fromLegacyQuestion(
                legacyQuestion,
                'section-1',
                'template-1',
            );

            expect(question.type).toBe('text');
            expect(question.labelKey).toBe('question.firstName');
            expect(question.required).toBe(true);
            expect(question.sectionId).toBe('section-1');
            expect(question.templateId).toBe('template-1');
            expect(question.metadata.compartmentId).toBe(1);
            expect(question.metadata.gdtFieldId).toBe('firstName');
            expect(question.metadata.gdprRelated).toBe(true);
        });
    });

    describe('toJSON / fromJSON', () => {
        it('should serialize and deserialize correctly', () => {
            const original = QuestionUniverseEntity.create({
                templateId: 'template-1',
                type: 'checkbox',
                labelKey: 'question.consent',
                required: true,
                metadata: {
                    statisticGroup: 'consent',
                    gdprRelated: true,
                },
            });

            const json = original.toJSON();
            const restored = QuestionUniverseEntity.fromJSON(json);

            expect(restored.id).toBe(original.id);
            expect(restored.type).toBe(original.type);
            expect(restored.labelKey).toBe(original.labelKey);
            expect(restored.required).toBe(original.required);
            expect(restored.metadata.statisticGroup).toBe(original.metadata.statisticGroup);
            expect(restored.createdAt.getTime()).toBe(original.createdAt.getTime());
        });
    });

    describe('research helpers', () => {
        it('hasResearchTag should return true if tag exists', () => {
            const question = QuestionUniverseEntity.create({
                templateId: 'template-1',
                type: 'text',
                labelKey: 'question.test',
                metadata: {
                    researchTags: ['diabetes', 'metabolism'],
                },
            });

            expect(question.hasResearchTag('diabetes')).toBe(true);
            expect(question.hasResearchTag('cardiology')).toBe(false);
        });

        it('matchesIcd10 should return true if code exists', () => {
            const question = QuestionUniverseEntity.create({
                templateId: 'template-1',
                type: 'text',
                labelKey: 'question.test',
                metadata: {
                    icd10Codes: ['E11', 'E12'],
                },
            });

            expect(question.matchesIcd10('E11')).toBe(true);
            expect(question.matchesIcd10('I10')).toBe(false);
        });

        it('inStatisticGroup should return true if group matches', () => {
            const question = QuestionUniverseEntity.create({
                templateId: 'template-1',
                type: 'text',
                labelKey: 'question.test',
                metadata: {
                    statisticGroup: 'cardiovascular',
                },
            });

            expect(question.inStatisticGroup('cardiovascular')).toBe(true);
            expect(question.inStatisticGroup('demographics')).toBe(false);
        });

        it('isGdprRelated should return correct value', () => {
            const gdprQuestion = QuestionUniverseEntity.create({
                templateId: 'template-1',
                type: 'text',
                labelKey: 'question.test',
                metadata: { gdprRelated: true },
            });

            const normalQuestion = QuestionUniverseEntity.create({
                templateId: 'template-1',
                type: 'text',
                labelKey: 'question.test',
                metadata: {},
            });

            expect(gdprQuestion.isGdprRelated()).toBe(true);
            expect(normalQuestion.isGdprRelated()).toBe(false);
        });

        it('getCompartmentId should return compartment ID', () => {
            const question = QuestionUniverseEntity.create({
                templateId: 'template-1',
                type: 'text',
                labelKey: 'question.test',
                metadata: { compartmentId: 42 },
            });

            expect(question.getCompartmentId()).toBe(42);
        });
    });

    describe('update methods', () => {
        it('withMetadata should create a new entity with updated metadata', () => {
            const original = QuestionUniverseEntity.create({
                templateId: 'template-1',
                type: 'text',
                labelKey: 'question.test',
                metadata: {
                    statisticGroup: 'demographics',
                },
            });

            const updated = original.withMetadata({
                statisticGroup: 'clinical',
                researchTags: ['new-tag'],
            });

            expect(original.metadata.statisticGroup).toBe('demographics');
            expect(updated.metadata.statisticGroup).toBe('clinical');
            expect(updated.metadata.researchTags).toEqual(['new-tag']);
            expect(updated.id).toBe(original.id);
            expect(updated.updatedAt.getTime()).toBeGreaterThanOrEqual(original.updatedAt.getTime());
        });

        it('addResearchTag should add a tag without duplicates', () => {
            const question = QuestionUniverseEntity.create({
                templateId: 'template-1',
                type: 'text',
                labelKey: 'question.test',
                metadata: {
                    researchTags: ['existing'],
                },
            });

            const updated1 = question.addResearchTag('new-tag');
            expect(updated1.metadata.researchTags).toEqual(['existing', 'new-tag']);

            const updated2 = updated1.addResearchTag('existing');
            expect(updated2.metadata.researchTags).toEqual(['existing', 'new-tag']);
        });

        it('addIcd10Code should add a code without duplicates', () => {
            const question = QuestionUniverseEntity.create({
                templateId: 'template-1',
                type: 'text',
                labelKey: 'question.test',
                metadata: {
                    icd10Codes: ['E11'],
                },
            });

            const updated1 = question.addIcd10Code('I10');
            expect(updated1.metadata.icd10Codes).toEqual(['E11', 'I10']);

            const updated2 = updated1.addIcd10Code('E11');
            expect(updated2.metadata.icd10Codes).toEqual(['E11', 'I10']);
        });
    });

    describe('schema validation', () => {
        it('should validate a correct question object', () => {
            const validQuestion = {
                id: '550e8400-e29b-41d4-a716-446655440000',
                templateId: 'template-1',
                type: 'text',
                labelKey: 'question.test',
                required: false,
                metadata: {},
                createdAt: new Date(),
                updatedAt: new Date(),
                version: 1,
            };

            expect(() => QuestionUniverseSchema.parse(validQuestion)).not.toThrow();
        });

        it('should reject invalid type', () => {
            const invalidQuestion = {
                id: '550e8400-e29b-41d4-a716-446655440000',
                templateId: 'template-1',
                type: 'invalid-type',
                labelKey: 'question.test',
                metadata: {},
                createdAt: new Date(),
                updatedAt: new Date(),
                version: 1,
            };

            expect(() => QuestionUniverseSchema.parse(invalidQuestion)).toThrow();
        });
    });
});
