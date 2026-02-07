import { IQuestionUniverseRepository } from '../../domain/repositories/IQuestionUniverseRepository';
import { IAnswerRepository } from '../../domain/repositories/IAnswerRepository';
import { SQLiteQuestionUniverseRepository } from '../../infrastructure/persistence/SQLiteQuestionUniverseRepository';
import { SQLiteAnswerRepository } from '../../infrastructure/persistence/SQLiteAnswerRepository';

export type GroupStatistics = {
    groupId: string;
    totalQuestions: number;
    answeredQuestions: number;
    completionRate: number;
};

export class AnalyticsService {
    private questionRepo: IQuestionUniverseRepository;
    private answerRepo: IAnswerRepository;

    constructor() {
        this.questionRepo = new SQLiteQuestionUniverseRepository();
        this.answerRepo = new SQLiteAnswerRepository();
    }

    /**
     * Calculate completion rates grouped by 'statisticGroup'
     */
    async getCompletionByGroup(questionnaireId: string): Promise<GroupStatistics[]> {
        const questions = await this.questionRepo.findAll();
        const answerEntities = await this.answerRepo.findByQuestionnaireId(questionnaireId);

        // Create Set of answered Question IDs
        const answeredIds = new Set(answerEntities.map(a => a.questionId));

        // Group questions by statisticGroup
        const groups = new Map<string, { total: number; answered: number }>();

        for (const q of questions) {
            const group = q.metadata.statisticGroup || 'Ungrouped';

            if (!groups.has(group)) {
                groups.set(group, { total: 0, answered: 0 });
            }

            const stats = groups.get(group)!;
            stats.total++;

            if (answeredIds.has(q.id)) {
                stats.answered++;
            }
        }

        // Convert to array
        return Array.from(groups.entries()).map(([groupId, stats]) => ({
            groupId,
            totalQuestions: stats.total,
            answeredQuestions: stats.answered,
            completionRate: stats.total > 0 ? (stats.answered / stats.total) : 0,
        }));
    }

    /**
     * Get all unique research tags available
     */
    async getAvailableResearchTags(): Promise<string[]> {
        const questions = await this.questionRepo.findAll();
        const tags = new Set<string>();

        questions.forEach(q => {
            q.metadata.researchTags?.forEach(tag => tags.add(tag));
        });

        return Array.from(tags).sort();
    }
}
