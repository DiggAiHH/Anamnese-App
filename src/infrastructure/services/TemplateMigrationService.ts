import { SQLiteQuestionUniverseRepository } from '../persistence/SQLiteQuestionUniverseRepository';
import { QuestionUniverseEntity } from '../../domain/entities/QuestionUniverse';
import { logInfo, logError } from '@shared/logger';
import template from '../data/questionnaire-template.json';

// Type definitions for JSON template
type JsonQuestion = {
    id: string;
    type: string;
    labelKey: string;
    required?: boolean;
    metadata?: Record<string, any>;
    options?: Array<{ value: string | number; labelKey: string }>;
    validation?: any;
    conditions?: any[];
    placeholderKey?: string;
};

type JsonSection = {
    id: string;
    questions: JsonQuestion[];
};

type JsonTemplate = {
    version: string;
    sections: JsonSection[];
};

/**
 * Service to migrate the static JSON template into the Question Universe database.
 */
export class TemplateMigrationService {
    private repository: SQLiteQuestionUniverseRepository;

    constructor() {
        this.repository = new SQLiteQuestionUniverseRepository();
    }

    /**
     * Run the migration.
     * @returns Number of questions migrated
     */
    async migrate(): Promise<number> {
        logInfo('Starting migration: Template -> Question Universe');
        let count = 0;

        try {
            const tpl = template as unknown as JsonTemplate;
            logInfo(`Loaded template version ${tpl.version}`);

            // Check if already migrated? 
            // A simple check is to count existing questions.
            const existing = await this.repository.findAll();
            if (existing.length > 0) {
                logInfo(`Database already has ${existing.length} questions. Skipping migration.`);
                return existing.length;
            }

            for (const section of tpl.sections) {
                for (const q of section.questions) {
                    const entity = QuestionUniverseEntity.create({
                        templateId: q.id,
                        sectionId: section.id,
                        type: q.type as any,
                        labelKey: q.labelKey,
                        placeholderKey: q.placeholderKey,
                        required: q.required,
                        options: q.options,
                        validation: q.validation,
                        conditions: q.conditions,
                        metadata: {
                            ...q.metadata,
                            statisticGroup: (q.metadata as any)?.statisticGroup ?? 'general',
                            isReusable: false,
                        }
                    });

                    await this.repository.save(entity);
                    count++;
                }
            }

            logInfo(`Migration complete. Imported ${count} questions.`);
            return count;

        } catch (error) {
            logError('Migration failed', error);
            throw error;
        }
    }
}
