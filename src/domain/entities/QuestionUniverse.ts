/**
 * QuestionUniverse Entity - Each question is a standalone universe
 *
 * DESIGN PHILOSOPHY:
 * - Every question has a persistent, globally unique ID
 * - Questions can exist independently of sections/questionnaires
 * - Rich metadata enables research, statistics, and AI analysis
 *
 * VERBINDUNG:
 * QuestionUniverse (Entity)
 *   → IQuestionUniverseRepository (Domain)
 *   → SQLiteQuestionUniverseRepository (Infrastructure)
 *   → QuestionCard (Presentation)
 */

import { z } from 'zod';

// Re-export QuestionType for consistency
export type QuestionType =
    | 'text'
    | 'textarea'
    | 'number'
    | 'date'
    | 'checkbox'
    | 'radio'
    | 'select'
    | 'multiselect';

// Condition Schema (shared with Questionnaire.ts)
export const ConditionSchema = z.object({
    questionId: z.string(),
    operator: z.enum(['equals', 'not_equals', 'contains', 'not_contains', 'greater', 'less']),
    value: z.union([z.string(), z.number(), z.boolean(), z.array(z.string()), z.array(z.number())]),
});

export type Condition = z.infer<typeof ConditionSchema>;

/**
 * Metadata schema for research, statistics, and medical coding
 */
export const QuestionUniverseMetadataSchema = z.object({
    /** Statistical grouping, e.g., "cardiovascular", "demographics" */
    statisticGroup: z.string().optional(),

    /** Research tags for filtering/analysis, e.g., ["diabetes", "hypertension"] */
    researchTags: z.array(z.string()).optional(),

    /** ICD-10 codes for medical coding, e.g., ["E11", "I10"] */
    icd10Codes: z.array(z.string()).optional(),

    /** GDT field ID for export mapping */
    gdtFieldId: z.string().optional(),

    /** Numeric ID for compartment encoding (integer-only answers) */
    compartmentId: z.number().int().optional(),

    /** Global sort order across all questions */
    sortOrder: z.number().int().optional(),

    /** Whether this question can be reused in multiple questionnaires */
    isReusable: z.boolean().default(false),

    /** Optional concept grouping within a section */
    concept: z.string().optional(),

    /** GDPR-related flag for privacy handling */
    gdprRelated: z.boolean().default(false),
});

export type QuestionUniverseMetadata = z.infer<typeof QuestionUniverseMetadataSchema>;

/**
 * Option schema for choice questions
 */
export const QuestionOptionSchema = z.object({
    value: z.union([z.string(), z.number()]),
    labelKey: z.string(),
});

export type QuestionOption = z.infer<typeof QuestionOptionSchema>;

/**
 * Validation schema for input constraints
 */
export const QuestionValidationSchema = z.object({
    min: z.number().optional(),
    max: z.number().optional(),
    pattern: z.string().optional(),
    minDate: z.string().optional(), // ISO 8601
    maxDate: z.string().optional(),
});

export type QuestionValidation = z.infer<typeof QuestionValidationSchema>;

/**
 * Main QuestionUniverse schema
 */
export const QuestionUniverseSchema = z.object({
    /** Persistent UUID - never changes */
    id: z.string().uuid(),

    /** Reference to template/section for grouping */
    templateId: z.string(),

    /** Section ID this question belongs to */
    sectionId: z.string().optional(),

    /** Question type determines input rendering */
    type: z.enum(['text', 'textarea', 'number', 'date', 'checkbox', 'radio', 'select', 'multiselect']),

    /** i18n key for question label */
    labelKey: z.string(),

    /** i18n key for placeholder text */
    placeholderKey: z.string().optional(),

    /** Whether an answer is required */
    required: z.boolean().default(false),

    /** Options for choice questions */
    options: z.array(QuestionOptionSchema).optional(),

    /** Validation rules */
    validation: QuestionValidationSchema.optional(),

    /** Conditional display rules */
    conditions: z.array(ConditionSchema).optional(),

    /** Parent question ID for dependent questions */
    dependsOn: z.string().optional(),

    /** Rich metadata for research/statistics */
    metadata: QuestionUniverseMetadataSchema,

    /** Creation timestamp */
    createdAt: z.date(),

    /** Last update timestamp */
    updatedAt: z.date(),

    /** Schema version for migrations */
    version: z.number().int().default(1),
});

export type QuestionUniverse = z.infer<typeof QuestionUniverseSchema>;

/**
 * QuestionUniverse Entity Class
 *
 * Immutable entity representing a single question as a first-class citizen.
 * Provides factory methods, getters, and helper functions for research/analysis.
 */
export class QuestionUniverseEntity {
    private constructor(private readonly data: QuestionUniverse) {
        QuestionUniverseSchema.parse(data);
    }

    // =============== Getters ===============

    get id(): string {
        return this.data.id;
    }

    get templateId(): string {
        return this.data.templateId;
    }

    get sectionId(): string | undefined {
        return this.data.sectionId;
    }

    get type(): QuestionType {
        return this.data.type;
    }

    get labelKey(): string {
        return this.data.labelKey;
    }

    get placeholderKey(): string | undefined {
        return this.data.placeholderKey;
    }

    get required(): boolean {
        return this.data.required;
    }

    get options(): QuestionOption[] | undefined {
        return this.data.options;
    }

    get validation(): QuestionValidation | undefined {
        return this.data.validation;
    }

    get conditions(): Condition[] | undefined {
        return this.data.conditions;
    }

    get dependsOn(): string | undefined {
        return this.data.dependsOn;
    }

    get metadata(): QuestionUniverseMetadata {
        return this.data.metadata;
    }

    get createdAt(): Date {
        return this.data.createdAt;
    }

    get updatedAt(): Date {
        return this.data.updatedAt;
    }

    get version(): number {
        return this.data.version;
    }

    // =============== Factory Methods ===============

    /**
     * Create a new QuestionUniverse entity
     */
    static create(params: {
        templateId: string;
        type: QuestionType;
        labelKey: string;
        sectionId?: string;
        placeholderKey?: string;
        required?: boolean;
        options?: QuestionOption[];
        validation?: QuestionValidation;
        conditions?: Condition[];
        dependsOn?: string;
        metadata?: Partial<QuestionUniverseMetadata>;
    }): QuestionUniverseEntity {
        const now = new Date();

        return new QuestionUniverseEntity({
            id: crypto.randomUUID(),
            templateId: params.templateId,
            sectionId: params.sectionId,
            type: params.type,
            labelKey: params.labelKey,
            placeholderKey: params.placeholderKey,
            required: params.required ?? false,
            options: params.options,
            validation: params.validation,
            conditions: params.conditions,
            dependsOn: params.dependsOn,
            metadata: {
                isReusable: false,
                gdprRelated: false,
                ...params.metadata,
            },
            createdAt: now,
            updatedAt: now,
            version: 1,
        });
    }

    /**
     * Create from existing Question (legacy migration)
     */
    static fromLegacyQuestion(
        question: {
            id: string;
            type: QuestionType;
            labelKey: string;
            placeholderKey?: string;
            required?: boolean;
            options?: Array<{ value: string | number; labelKey: string }>;
            validation?: QuestionValidation;
            conditions?: Condition[];
            dependsOn?: string;
            metadata?: Record<string, unknown>;
        },
        sectionId: string,
        templateId: string,
    ): QuestionUniverseEntity {
        const legacyMeta = question.metadata ?? {};

        return QuestionUniverseEntity.create({
            templateId,
            sectionId,
            type: question.type,
            labelKey: question.labelKey,
            placeholderKey: question.placeholderKey,
            required: question.required,
            options: question.options,
            validation: question.validation,
            conditions: question.conditions,
            dependsOn: question.dependsOn,
            metadata: {
                compartmentId:
                    typeof legacyMeta.compartmentId === 'number' ? legacyMeta.compartmentId : undefined,
                gdtFieldId: typeof legacyMeta.fieldName === 'string' ? legacyMeta.fieldName : undefined,
                gdprRelated: Boolean(legacyMeta.gdprRelated),
                concept: typeof legacyMeta.compartmentConcept === 'string'
                    ? legacyMeta.compartmentConcept
                    : undefined,
            },
        });
    }

    // =============== Serialization ===============

    /**
     * Convert to plain object for storage
     */
    toJSON(): QuestionUniverse {
        return { ...this.data };
    }

    /**
     * Create entity from stored JSON
     */
    static fromJSON(json: QuestionUniverse): QuestionUniverseEntity {
        return new QuestionUniverseEntity({
            ...json,
            createdAt: new Date(json.createdAt),
            updatedAt: new Date(json.updatedAt),
        });
    }

    // =============== Research Helpers ===============

    /**
     * Check if question has a specific research tag
     */
    hasResearchTag(tag: string): boolean {
        return this.data.metadata.researchTags?.includes(tag) ?? false;
    }

    /**
     * Check if question matches an ICD-10 code
     */
    matchesIcd10(code: string): boolean {
        return this.data.metadata.icd10Codes?.includes(code) ?? false;
    }

    /**
     * Check if question belongs to a statistic group
     */
    inStatisticGroup(group: string): boolean {
        return this.data.metadata.statisticGroup === group;
    }

    /**
     * Check if question is GDPR-related
     */
    isGdprRelated(): boolean {
        return this.data.metadata.gdprRelated ?? false;
    }

    /**
     * Get compartment ID for encoding (if available)
     */
    getCompartmentId(): number | undefined {
        return this.data.metadata.compartmentId;
    }

    // =============== Update Methods (immutable) ===============

    /**
     * Update metadata (returns new entity)
     */
    withMetadata(updates: Partial<QuestionUniverseMetadata>): QuestionUniverseEntity {
        return new QuestionUniverseEntity({
            ...this.data,
            metadata: {
                ...this.data.metadata,
                ...updates,
            },
            updatedAt: new Date(),
        });
    }

    /**
     * Add research tag (returns new entity)
     */
    addResearchTag(tag: string): QuestionUniverseEntity {
        const existingTags = this.data.metadata.researchTags ?? [];
        if (existingTags.includes(tag)) {
            return this;
        }
        return this.withMetadata({
            researchTags: [...existingTags, tag],
        });
    }

    /**
     * Add ICD-10 code (returns new entity)
     */
    addIcd10Code(code: string): QuestionUniverseEntity {
        const existingCodes = this.data.metadata.icd10Codes ?? [];
        if (existingCodes.includes(code)) {
            return this;
        }
        return this.withMetadata({
            icd10Codes: [...existingCodes, code],
        });
    }
}
