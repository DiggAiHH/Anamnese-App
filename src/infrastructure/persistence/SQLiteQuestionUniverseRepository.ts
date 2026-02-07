/**
 * SQLiteQuestionUniverseRepository - Production storage for QuestionUniverse
 *
 * IMPORTS:
 * - Uses DatabaseConnection for SQLite access
 * - Maps between SQL rows and QuestionUniverseEntity
 */

import { QuestionUniverseEntity, QuestionUniverseMetadata } from '@domain/entities/QuestionUniverse';
import { IQuestionUniverseRepository } from '@domain/repositories/IQuestionUniverseRepository';
import { database } from '@infrastructure/persistence/DatabaseConnection';

export class SQLiteQuestionUniverseRepository implements IQuestionUniverseRepository {

    /**
     * Helper to map SQL row to Entity
     */
    private mapRowToEntity(row: any): QuestionUniverseEntity {
        return QuestionUniverseEntity.fromJSON({
            id: row.id,
            templateId: row.template_id,
            sectionId: row.section_id || undefined,
            type: row.type as any,
            labelKey: row.label_key,
            placeholderKey: row.placeholder_key || undefined,
            required: Boolean(row.required),
            options: row.options_json ? JSON.parse(row.options_json) : undefined,
            validation: row.validation_json ? JSON.parse(row.validation_json) : undefined,
            conditions: row.conditions_json ? JSON.parse(row.conditions_json) : undefined,
            dependsOn: row.depends_on || undefined,
            metadata: JSON.parse(row.metadata_json) as QuestionUniverseMetadata, // Must be valid JSON
            createdAt: new Date(row.created_at),
            updatedAt: new Date(row.updated_at),
            version: row.version,
        });
    }

    // =============== CRUD Operations ===============

    async save(question: QuestionUniverseEntity): Promise<void> {
        const sql = `
      INSERT OR REPLACE INTO questions (
        id, template_id, section_id, type, label_key, placeholder_key, 
        required, options_json, validation_json, conditions_json, 
        depends_on, metadata_json, created_at, updated_at, version
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    `;

        const params = [
            question.id,
            question.templateId,
            question.sectionId || null,
            question.type,
            question.labelKey,
            question.placeholderKey || null,
            question.required ? 1 : 0,
            question.options ? JSON.stringify(question.options) : null,
            question.validation ? JSON.stringify(question.validation) : null,
            question.conditions ? JSON.stringify(question.conditions) : null,
            question.dependsOn || null,
            JSON.stringify(question.metadata),
            question.createdAt.getTime(),
            question.updatedAt.getTime(),
            question.version,
        ];

        await database.executeSql(sql, params);
    }

    async saveAll(questions: QuestionUniverseEntity[]): Promise<void> {
        // SQLite supports transactions, so we wrap multiple inserts
        await database.transaction(async tx => {
            const sql = `
        INSERT OR REPLACE INTO questions (
          id, template_id, section_id, type, label_key, placeholder_key, 
          required, options_json, validation_json, conditions_json, 
          depends_on, metadata_json, created_at, updated_at, version
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
      `;

            for (const question of questions) {
                const params = [
                    question.id,
                    question.templateId,
                    question.sectionId || null,
                    question.type,
                    question.labelKey,
                    question.placeholderKey || null,
                    question.required ? 1 : 0,
                    question.options ? JSON.stringify(question.options) : null,
                    question.validation ? JSON.stringify(question.validation) : null,
                    question.conditions ? JSON.stringify(question.conditions) : null,
                    question.dependsOn || null,
                    JSON.stringify(question.metadata),
                    question.createdAt.getTime(),
                    question.updatedAt.getTime(),
                    question.version,
                ];
                await tx.executeSql(sql, params);
            }
        });
    }

    async findById(id: string): Promise<QuestionUniverseEntity | null> {
        const result = await database.executeSql('SELECT * FROM questions WHERE id = ?;', [id]);
        if (result.rows.length === 0) return null;
        return this.mapRowToEntity(result.rows.item(0));
    }

    async delete(id: string): Promise<void> {
        await database.executeSql('DELETE FROM questions WHERE id = ?;', [id]);
    }

    async deleteAll(): Promise<void> {
        await database.executeSql('DELETE FROM questions;');
    }

    // =============== Query Operations ===============

    async findAll(): Promise<QuestionUniverseEntity[]> {
        const result = await database.executeSql('SELECT * FROM questions;');
        const questions: QuestionUniverseEntity[] = [];
        for (let i = 0; i < result.rows.length; i++) {
            questions.push(this.mapRowToEntity(result.rows.item(i)));
        }
        return questions;
    }

    async findByTemplateId(templateId: string): Promise<QuestionUniverseEntity[]> {
        const result = await database.executeSql('SELECT * FROM questions WHERE template_id = ?;', [templateId]);
        const questions: QuestionUniverseEntity[] = [];
        for (let i = 0; i < result.rows.length; i++) {
            questions.push(this.mapRowToEntity(result.rows.item(i)));
        }
        return questions;
    }

    async findBySectionId(sectionId: string): Promise<QuestionUniverseEntity[]> {
        const result = await database.executeSql('SELECT * FROM questions WHERE section_id = ?;', [sectionId]);
        const questions: QuestionUniverseEntity[] = [];
        for (let i = 0; i < result.rows.length; i++) {
            questions.push(this.mapRowToEntity(result.rows.item(i)));
        }
        return questions;
    }

    // =============== Research/Statistics Queries ===============

    /**
     * Note: SQLite JSON queries can be slow or unsupported depending on build.
     * For this implementation, we fetch all and filter in memory if necessary,
     * or use LIKE for basic optimization.
     */

    async findByResearchTag(tag: string): Promise<QuestionUniverseEntity[]> {
        // Heuristic: LIKE search in JSON string
        // This might return false positives if a tag is a substring of another string in metadata
        // Proper filtering is applied after mapping
        const result = await database.executeSql(
            'SELECT * FROM questions WHERE metadata_json LIKE ?;',
            [`%${tag}%`]
        );

        const questions: QuestionUniverseEntity[] = [];
        for (let i = 0; i < result.rows.length; i++) {
            const q = this.mapRowToEntity(result.rows.item(i));
            if (q.hasResearchTag(tag)) {
                questions.push(q);
            }
        }
        return questions;
    }

    async findByIcd10Code(code: string): Promise<QuestionUniverseEntity[]> {
        const result = await database.executeSql(
            'SELECT * FROM questions WHERE metadata_json LIKE ?;',
            [`%${code}%`]
        );

        const questions: QuestionUniverseEntity[] = [];
        for (let i = 0; i < result.rows.length; i++) {
            const q = this.mapRowToEntity(result.rows.item(i));
            if (q.matchesIcd10(code)) {
                questions.push(q);
            }
        }
        return questions;
    }

    async findByStatisticGroup(group: string): Promise<QuestionUniverseEntity[]> {
        const result = await database.executeSql(
            'SELECT * FROM questions WHERE metadata_json LIKE ?;',
            [`%${group}%`]
        );

        const questions: QuestionUniverseEntity[] = [];
        for (let i = 0; i < result.rows.length; i++) {
            const q = this.mapRowToEntity(result.rows.item(i));
            if (q.inStatisticGroup(group)) {
                questions.push(q);
            }
        }
        return questions;
    }

    async findGdprRelated(): Promise<QuestionUniverseEntity[]> {
        // "gdprRelated":true in JSON
        const result = await database.executeSql(
            'SELECT * FROM questions WHERE metadata_json LIKE ?;',
            ['%"gdprRelated":true%']
        );

        const questions: QuestionUniverseEntity[] = [];
        for (let i = 0; i < result.rows.length; i++) {
            questions.push(this.mapRowToEntity(result.rows.item(i)));
        }
        return questions;
    }

    // =============== Count Operations ===============

    async count(): Promise<number> {
        const result = await database.executeSql('SELECT COUNT(*) as count FROM questions;');
        if (result.rows.length === 0) return 0;
        return (result.rows.item(0) as any).count;
    }

    async countByType(type: string): Promise<number> {
        const result = await database.executeSql(
            'SELECT COUNT(*) as count FROM questions WHERE type = ?;',
            [type]
        );
        if (result.rows.length === 0) return 0;
        return (result.rows.item(0) as any).count;
    }
}
