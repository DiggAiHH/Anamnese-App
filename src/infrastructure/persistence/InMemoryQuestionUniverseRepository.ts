/**
 * InMemoryQuestionUniverseRepository - In-memory implementation for testing
 *
 * USAGE:
 * - Unit tests
 * - Integration tests without database
 * - Development/prototyping
 */

import { QuestionUniverseEntity } from '@domain/entities/QuestionUniverse';
import { IQuestionUniverseRepository } from '@domain/repositories/IQuestionUniverseRepository';

export class InMemoryQuestionUniverseRepository implements IQuestionUniverseRepository {
    private questions: Map<string, QuestionUniverseEntity> = new Map();

    // =============== CRUD Operations ===============

    async save(question: QuestionUniverseEntity): Promise<void> {
        this.questions.set(question.id, question);
    }

    async saveAll(questions: QuestionUniverseEntity[]): Promise<void> {
        for (const question of questions) {
            this.questions.set(question.id, question);
        }
    }

    async findById(id: string): Promise<QuestionUniverseEntity | null> {
        return this.questions.get(id) ?? null;
    }

    async delete(id: string): Promise<void> {
        this.questions.delete(id);
    }

    async deleteAll(): Promise<void> {
        this.questions.clear();
    }

    // =============== Query Operations ===============

    async findAll(): Promise<QuestionUniverseEntity[]> {
        return Array.from(this.questions.values());
    }

    async findByTemplateId(templateId: string): Promise<QuestionUniverseEntity[]> {
        return Array.from(this.questions.values()).filter(q => q.templateId === templateId);
    }

    async findBySectionId(sectionId: string): Promise<QuestionUniverseEntity[]> {
        return Array.from(this.questions.values()).filter(q => q.sectionId === sectionId);
    }

    // =============== Research/Statistics Queries ===============

    async findByResearchTag(tag: string): Promise<QuestionUniverseEntity[]> {
        return Array.from(this.questions.values()).filter(q => q.hasResearchTag(tag));
    }

    async findByIcd10Code(code: string): Promise<QuestionUniverseEntity[]> {
        return Array.from(this.questions.values()).filter(q => q.matchesIcd10(code));
    }

    async findByStatisticGroup(group: string): Promise<QuestionUniverseEntity[]> {
        return Array.from(this.questions.values()).filter(q => q.inStatisticGroup(group));
    }

    async findGdprRelated(): Promise<QuestionUniverseEntity[]> {
        return Array.from(this.questions.values()).filter(q => q.isGdprRelated());
    }

    // =============== Count Operations ===============

    async count(): Promise<number> {
        return this.questions.size;
    }

    async countByType(type: string): Promise<number> {
        return Array.from(this.questions.values()).filter(q => q.type === type).length;
    }

    // =============== Test Helpers ===============

    /**
     * Clear all data (for test reset)
     */
    clear(): void {
        this.questions.clear();
    }

    /**
     * Get raw storage (for test assertions)
     */
    getAll(): QuestionUniverseEntity[] {
        return Array.from(this.questions.values());
    }
}
