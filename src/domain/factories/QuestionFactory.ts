/**
 * QuestionFactory - Factory for creating standardized QuestionUniverse instances
 *
 * BENEFITS:
 * - Consistent question creation
 * - Validation at creation time
 * - Default metadata assignment
 * - Simplified API for common question types
 */

import {
    QuestionUniverseEntity,
    QuestionType,
    QuestionOption,
    Condition,
    QuestionUniverseMetadata,
} from '@domain/entities/QuestionUniverse';

/**
 * Common parameters for all question types
 */
interface BaseQuestionParams {
    templateId: string;
    labelKey: string;
    sectionId?: string;
    placeholderKey?: string;
    required?: boolean;
    conditions?: Condition[];
    dependsOn?: string;
}

/**
 * QuestionFactory - Creates standardized question instances
 */
export class QuestionFactory {
    // =============== Text Questions ===============

    /**
     * Create a single-line text question
     */
    static createTextQuestion(
        params: BaseQuestionParams & {
            statisticGroup?: string;
            researchTags?: string[];
        },
    ): QuestionUniverseEntity {
        return QuestionUniverseEntity.create({
            ...params,
            type: 'text',
            metadata: {
                statisticGroup: params.statisticGroup,
                researchTags: params.researchTags,
            },
        });
    }

    /**
     * Create a multi-line textarea question
     */
    static createTextareaQuestion(
        params: BaseQuestionParams & {
            statisticGroup?: string;
            researchTags?: string[];
        },
    ): QuestionUniverseEntity {
        return QuestionUniverseEntity.create({
            ...params,
            type: 'textarea',
            metadata: {
                statisticGroup: params.statisticGroup,
                researchTags: params.researchTags,
            },
        });
    }

    // =============== Number Questions ===============

    /**
     * Create a numeric input question
     */
    static createNumberQuestion(
        params: BaseQuestionParams & {
            min?: number;
            max?: number;
            statisticGroup?: string;
            researchTags?: string[];
            icd10Codes?: string[];
        },
    ): QuestionUniverseEntity {
        return QuestionUniverseEntity.create({
            ...params,
            type: 'number',
            validation:
                params.min !== undefined || params.max !== undefined
                    ? { min: params.min, max: params.max }
                    : undefined,
            metadata: {
                statisticGroup: params.statisticGroup ?? 'clinical',
                researchTags: params.researchTags,
                icd10Codes: params.icd10Codes,
            },
        });
    }

    // =============== Date Questions ===============

    /**
     * Create a date input question
     */
    static createDateQuestion(
        params: BaseQuestionParams & {
            minDate?: string;
            maxDate?: string;
            statisticGroup?: string;
        },
    ): QuestionUniverseEntity {
        return QuestionUniverseEntity.create({
            ...params,
            type: 'date',
            validation:
                params.minDate !== undefined || params.maxDate !== undefined
                    ? { minDate: params.minDate, maxDate: params.maxDate }
                    : undefined,
            metadata: {
                statisticGroup: params.statisticGroup ?? 'demographics',
            },
        });
    }

    /**
     * Create a birthdate question with appropriate constraints
     */
    static createBirthdateQuestion(
        params: BaseQuestionParams,
    ): QuestionUniverseEntity {
        const today = new Date().toISOString().split('T')[0];
        const minYear = new Date().getFullYear() - 120;
        const minDate = `${minYear}-01-01`;

        return QuestionUniverseEntity.create({
            ...params,
            type: 'date',
            validation: {
                minDate,
                maxDate: today,
            },
            metadata: {
                statisticGroup: 'demographics',
                gdprRelated: true,
            },
        });
    }

    // =============== Choice Questions ===============

    /**
     * Create a single-choice radio question
     */
    static createRadioQuestion(
        params: BaseQuestionParams & {
            options: QuestionOption[];
            statisticGroup?: string;
            researchTags?: string[];
        },
    ): QuestionUniverseEntity {
        if (!params.options || params.options.length === 0) {
            throw new Error('Radio question must have at least one option');
        }

        return QuestionUniverseEntity.create({
            ...params,
            type: 'radio',
            options: params.options,
            metadata: {
                statisticGroup: params.statisticGroup,
                researchTags: params.researchTags,
            },
        });
    }

    /**
     * Create a yes/no binary question
     */
    static createYesNoQuestion(
        params: BaseQuestionParams & {
            statisticGroup?: string;
            researchTags?: string[];
            icd10Codes?: string[];
        },
    ): QuestionUniverseEntity {
        return QuestionUniverseEntity.create({
            ...params,
            type: 'radio',
            options: [
                { value: 1, labelKey: 'common.yes' },
                { value: 0, labelKey: 'common.no' },
            ],
            metadata: {
                statisticGroup: params.statisticGroup,
                researchTags: params.researchTags,
                icd10Codes: params.icd10Codes,
            },
        });
    }

    /**
     * Create a single-select dropdown question
     */
    static createSelectQuestion(
        params: BaseQuestionParams & {
            options: QuestionOption[];
            statisticGroup?: string;
            researchTags?: string[];
        },
    ): QuestionUniverseEntity {
        if (!params.options || params.options.length === 0) {
            throw new Error('Select question must have at least one option');
        }

        return QuestionUniverseEntity.create({
            ...params,
            type: 'select',
            options: params.options,
            metadata: {
                statisticGroup: params.statisticGroup,
                researchTags: params.researchTags,
            },
        });
    }

    /**
     * Create a multi-select question
     */
    static createMultiSelectQuestion(
        params: BaseQuestionParams & {
            options: QuestionOption[];
            statisticGroup?: string;
            researchTags?: string[];
        },
    ): QuestionUniverseEntity {
        if (!params.options || params.options.length === 0) {
            throw new Error('Multi-select question must have at least one option');
        }

        return QuestionUniverseEntity.create({
            ...params,
            type: 'multiselect',
            options: params.options,
            metadata: {
                statisticGroup: params.statisticGroup,
                researchTags: params.researchTags,
            },
        });
    }

    // =============== Checkbox Questions ===============

    /**
     * Create a single checkbox (boolean) question
     */
    static createCheckboxQuestion(
        params: BaseQuestionParams & {
            statisticGroup?: string;
            gdprRelated?: boolean;
        },
    ): QuestionUniverseEntity {
        return QuestionUniverseEntity.create({
            ...params,
            type: 'checkbox',
            metadata: {
                statisticGroup: params.statisticGroup,
                gdprRelated: params.gdprRelated,
            },
        });
    }

    /**
     * Create a multi-checkbox question
     */
    static createMultiCheckboxQuestion(
        params: BaseQuestionParams & {
            options: QuestionOption[];
            statisticGroup?: string;
            researchTags?: string[];
        },
    ): QuestionUniverseEntity {
        if (!params.options || params.options.length === 0) {
            throw new Error('Multi-checkbox question must have at least one option');
        }

        return QuestionUniverseEntity.create({
            ...params,
            type: 'checkbox',
            options: params.options,
            metadata: {
                statisticGroup: params.statisticGroup,
                researchTags: params.researchTags,
            },
        });
    }

    // =============== GDPR/Consent Questions ===============

    /**
     * Create a GDPR consent question
     */
    static createConsentQuestion(
        params: BaseQuestionParams & {
            consentType: 'required' | 'optional';
        },
    ): QuestionUniverseEntity {
        return QuestionUniverseEntity.create({
            ...params,
            type: 'checkbox',
            required: params.consentType === 'required',
            metadata: {
                statisticGroup: 'consent',
                gdprRelated: true,
            },
        });
    }

    // =============== Medical Questions ===============

    /**
     * Create a medical symptom question with ICD-10 mapping
     */
    static createMedicalQuestion(
        params: BaseQuestionParams & {
            type: 'radio' | 'checkbox' | 'number';
            options?: QuestionOption[];
            icd10Codes: string[];
            researchTags?: string[];
        },
    ): QuestionUniverseEntity {
        return QuestionUniverseEntity.create({
            ...params,
            type: params.type,
            options: params.options,
            metadata: {
                statisticGroup: 'clinical',
                icd10Codes: params.icd10Codes,
                researchTags: params.researchTags,
            },
        });
    }

    // =============== Bulk Creation ===============

    /**
     * Create multiple questions from a template array
     */
    static createFromTemplate(
        templateId: string,
        questions: Array<{
            type: QuestionType;
            labelKey: string;
            sectionId?: string;
            required?: boolean;
            options?: QuestionOption[];
            metadata?: Partial<QuestionUniverseMetadata>;
        }>,
    ): QuestionUniverseEntity[] {
        return questions.map((q, index) =>
            QuestionUniverseEntity.create({
                templateId,
                type: q.type,
                labelKey: q.labelKey,
                sectionId: q.sectionId,
                required: q.required,
                options: q.options,
                metadata: {
                    ...q.metadata,
                    sortOrder: index + 1,
                },
            }),
        );
    }
}
