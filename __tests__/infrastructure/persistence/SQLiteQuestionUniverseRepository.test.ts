jest.mock('@shared/logger', () => ({
    logError: jest.fn(),
    logWarn: jest.fn(),
    logDebug: jest.fn(),
}));

import { SQLiteQuestionUniverseRepository } from '../../../src/infrastructure/persistence/SQLiteQuestionUniverseRepository';
import { QuestionUniverseEntity } from '../../../src/domain/entities/QuestionUniverse';

const mockExecuteSql = jest.fn();
const mockTxExecuteSql = jest.fn();

const mockDb = {
    executeSql: mockExecuteSql,
    transaction: jest.fn(
        async (fn: (tx: { executeSql: typeof mockTxExecuteSql }) => Promise<void>) => {
            await fn({ executeSql: mockTxExecuteSql });
        },
    ),
};

jest.mock('../../../src/infrastructure/persistence/DatabaseConnection', () => ({
    database: {
        connect: jest.fn(async () => mockDb),
        executeSql: (...args: any[]) => (mockExecuteSql as any)(...args),
        transaction: (...args: any[]) => (mockDb.transaction as any)(...args),
    },
}));

describe('SQLiteQuestionUniverseRepository', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        // Default mock implementation for executeSql returning empty rows
        mockExecuteSql.mockResolvedValue({
            rows: {
                length: 0,
                item: () => null,
            },
        });
    });

    it('save() executes correct SQL', async () => {
        const repo = new SQLiteQuestionUniverseRepository();
        const question = QuestionUniverseEntity.create({
            templateId: 'tpl1',
            type: 'text',
            labelKey: 'test.label',
            required: true,
            metadata: { statisticGroup: 'test' },
        });

        await repo.save(question);

        expect(mockExecuteSql).toHaveBeenCalledTimes(1);
        expect(mockExecuteSql.mock.calls[0][0]).toContain('INSERT OR REPLACE INTO questions');
        // Check key params
        const params = mockExecuteSql.mock.calls[0][1];
        expect(params[0]).toBe(question.id);
        expect(params[1]).toBe('tpl1');
        expect(params[3]).toBe('text');
        expect(params[6]).toBe(1); // required=true
        expect(params[11]).toContain('"statisticGroup":"test"'); // metadata
    });

    it('findById() maps row to entity correctly', async () => {
        const repo = new SQLiteQuestionUniverseRepository();

        const now = new Date();
        const mockRow = {
            id: '123e4567-e89b-12d3-a456-426614174000',
            template_id: '123e4567-e89b-12d3-a456-426614174001',
            type: 'text',
            label_key: 'test.label',
            required: 1,
            metadata_json: JSON.stringify({ statisticGroup: 'target' }),
            created_at: now.getTime(),
            updated_at: now.getTime(),
            version: 1,
            // Optional fields null
            section_id: null,
            placeholder_key: null,
            options_json: null,
            validation_json: null,
            conditions_json: null,
            depends_on: null,
        };

        mockExecuteSql.mockResolvedValueOnce({
            rows: {
                length: 1,
                item: () => mockRow,
            },
        });

        const result = await repo.findById('123e4567-e89b-12d3-a456-426614174000');

        expect(result).not.toBeNull();
        expect(result!.id).toBe('123e4567-e89b-12d3-a456-426614174000');
        expect(result!.templateId).toBe('123e4567-e89b-12d3-a456-426614174001');
        expect(result!.required).toBe(true);
        expect(result!.metadata.statisticGroup).toBe('target');
    });

    it('findByResearchTag() filters results', async () => {
        const repo = new SQLiteQuestionUniverseRepository();

        const now = new Date();
        const row1 = {
            id: '123e4567-e89b-12d3-a456-426614174000',
            template_id: 't1',
            type: 'text',
            label_key: 'l1',
            required: 0,
            metadata_json: JSON.stringify({ researchTags: ['tagA', 'tagB'] }),
            created_at: now.getTime(),
            updated_at: now.getTime(),
            version: 1,
        };

        const row2 = {
            id: '123e4567-e89b-12d3-a456-426614174002',
            template_id: 't2',
            type: 'text',
            label_key: 'l2',
            required: 0,
            metadata_json: JSON.stringify({ researchTags: ['tagC'] }), // matches query but not tag
            created_at: now.getTime(),
            updated_at: now.getTime(),
            version: 1,
        };

        // return both as if SQL LIKE matched loosely
        mockExecuteSql.mockResolvedValueOnce({
            rows: {
                length: 2,
                item: (i: number) => [row1, row2][i],
            },
        });

        const results = await repo.findByResearchTag('tagA');

        expect(results.length).toBe(1);
        expect(results[0].id).toBe('123e4567-e89b-12d3-a456-426614174000');
        expect(mockExecuteSql.mock.calls[0][1][0]).toBe('%tagA%');
    });
});
