/**
 * IQuestionUniverseRepository - Repository interface for QuestionUniverse persistence
 *
 * DESIGN:
 * - Follows repository pattern from Clean Architecture
 * - Enables dependency injection for testing
 * - Supports research/statistics queries
 */

import { QuestionUniverseEntity } from '@domain/entities/QuestionUniverse';

export interface IQuestionUniverseRepository {
    // =============== CRUD Operations ===============

    /**
     * Save a question (create or update)
     */
    save(question: QuestionUniverseEntity): Promise<void>;

    /**
     * Save multiple questions in a batch
     */
    saveAll(questions: QuestionUniverseEntity[]): Promise<void>;

    /**
     * Find a question by its persistent UUID
     */
    findById(id: string): Promise<QuestionUniverseEntity | null>;

    /**
     * Delete a question by ID
     */
    delete(id: string): Promise<void>;

    /**
     * Delete all questions (use with caution)
     */
    deleteAll(): Promise<void>;

    // =============== Query Operations ===============

    /**
     * Find all questions
     */
    findAll(): Promise<QuestionUniverseEntity[]>;

    /**
     * Find questions by template ID
     */
    findByTemplateId(templateId: string): Promise<QuestionUniverseEntity[]>;

    /**
     * Find questions by section ID
     */
    findBySectionId(sectionId: string): Promise<QuestionUniverseEntity[]>;

    // =============== Research/Statistics Queries ===============

    /**
     * Find questions by research tag
     */
    findByResearchTag(tag: string): Promise<QuestionUniverseEntity[]>;

    /**
     * Find questions by ICD-10 code
     */
    findByIcd10Code(code: string): Promise<QuestionUniverseEntity[]>;

    /**
     * Find questions by statistic group
     */
    findByStatisticGroup(group: string): Promise<QuestionUniverseEntity[]>;

    /**
     * Find all GDPR-related questions
     */
    findGdprRelated(): Promise<QuestionUniverseEntity[]>;

    // =============== Count Operations ===============

    /**
     * Count total questions
     */
    count(): Promise<number>;

    /**
     * Count questions by type
     */
    countByType(type: string): Promise<number>;
}
