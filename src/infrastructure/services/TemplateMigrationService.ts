import { SQLiteQuestionUniverseRepository } from '../persistence/SQLiteQuestionUniverseRepository';
import { QuestionUniverseEntity } from '../../domain/entities/QuestionUniverse';
import { logInfo, logError } from '@shared/logger';
import { database } from '../persistence/DatabaseConnection';
import template from '../data/questionnaire-template.json';

// Type definitions for JSON template
type JsonQuestion = {
    id: string;
    type: string;
    labelKey: string;
    required?: boolean;
    metadata?: Record<string, unknown>;
    options?: Array<{ value: string | number; labelKey: string }>;
    validation?: {
        min?: number;
        max?: number;
        pattern?: string;
        minDate?: string;
        maxDate?: string;
    };
    conditions?: Array<{
        questionId: string;
        operator: string;
        value: string | number | boolean | string[] | number[];
    }>;
    placeholderKey?: string;
    dependsOn?: string;
};

type JsonSection = {
    id: string;
    questions: JsonQuestion[];
};

type JsonTemplate = {
    version: string;
    sections: JsonSection[];
};

const MIGRATION_VERSION_KEY = 'template_migration_version';

/**
 * Service to migrate the static JSON template into the Question Universe database.
 *
 * Version-aware: stores the template version in db_metadata.
 * Re-migration occurs only when the template version changes.
 */
export class TemplateMigrationService {
    private repository: SQLiteQuestionUniverseRepository;

    constructor() {
        this.repository = new SQLiteQuestionUniverseRepository();
    }

    /**
     * Get the currently migrated template version from db_metadata.
     */
    private async getMigratedVersion(): Promise<string | null> {
        try {
            const result = await database.executeSql(
                'SELECT value FROM db_metadata WHERE key = ?;',
                [MIGRATION_VERSION_KEY],
            );
            if (result.rows.length === 0) return null;
            const row = result.rows.item(0) as Record<string, string>;
            return row.value ?? null;
        } catch (_e: unknown) {
            return null;
        }
    }

    /**
     * Store the migrated template version in db_metadata.
     */
    private async setMigratedVersion(version: string): Promise<void> {
        await database.executeSql(
            'INSERT OR REPLACE INTO db_metadata (key, value) VALUES (?, ?);',
            [MIGRATION_VERSION_KEY, version],
        );
    }

    /**
     * Run the migration (version-aware).
     *
     * - First run: imports all questions from template.
     * - Subsequent runs: skips if template version matches stored version.
     * - Template version change: deletes all questions and re-imports.
     *
     * @returns Number of questions in the universe after migration.
     */
    async migrate(): Promise<number> {
        try {
            const tpl = template as unknown as JsonTemplate;
            const templateVersion = tpl.version;

            const migratedVersion = await this.getMigratedVersion();
            const existing = await this.repository.findAll();

            // Already migrated with same version → skip
            if (migratedVersion === templateVersion && existing.length > 0) {
                logInfo(
                    `Question Universe already at template v${templateVersion} (${existing.length} questions). Skipping.`,
                );
                return existing.length;
            }

            // Version mismatch or first run
            if (migratedVersion && migratedVersion !== templateVersion) {
                logInfo(
                    `Template version changed: ${migratedVersion} → ${templateVersion}. Re-migrating.`,
                );
                await this.repository.deleteAll();
            } else {
                logInfo(`First migration: Template v${templateVersion}`);
            }

            let count = 0;

            for (const section of tpl.sections) {
                for (const q of section.questions) {
                    const meta = (q.metadata ?? {}) as Record<string, unknown>;

                    const entity = QuestionUniverseEntity.create({
                        templateId: q.id,
                        sectionId: section.id,
                        type: q.type as 'text' | 'textarea' | 'number' | 'date' | 'checkbox' | 'radio' | 'select' | 'multiselect',
                        labelKey: q.labelKey,
                        placeholderKey: q.placeholderKey,
                        required: q.required,
                        options: q.options,
                        validation: q.validation,
                        conditions: q.conditions as { questionId: string; operator: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'greater' | 'less'; value: string | number | boolean | string[] | number[]; }[] | undefined,
                        dependsOn: q.dependsOn,
                        metadata: {
                            statisticGroup: typeof meta.statisticGroup === 'string'
                                ? meta.statisticGroup : 'general',
                            compartmentId: typeof meta.compartmentId === 'number'
                                ? meta.compartmentId : undefined,
                            gdtFieldId: typeof meta.fieldName === 'string'
                                ? meta.fieldName : undefined,
                            gdprRelated: Boolean(meta.gdprRelated),
                            concept: typeof meta.compartmentConcept === 'string'
                                ? meta.compartmentConcept : undefined,
                            researchTags: Array.isArray(meta.researchTags)
                                ? (meta.researchTags as string[]) : undefined,
                            icd10Codes: Array.isArray(meta.icd10Codes)
                                ? (meta.icd10Codes as string[]) : undefined,
                            isReusable: false,
                        },
                    });

                    await this.repository.save(entity);
                    count++;
                }
            }

            await this.setMigratedVersion(templateVersion);
            logInfo(`Migration complete. Imported ${count} questions (template v${templateVersion}).`);
            return count;

        } catch (error) {
            logError('Migration failed', error);
            throw error;
        }
    }
}
