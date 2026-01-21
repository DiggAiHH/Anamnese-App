jest.mock('@shared/logger', () => ({
  logError: jest.fn(),
  logWarn: jest.fn(),
  logDebug: jest.fn(),
}));

import { SQLiteAnswerRepository } from '../../../src/infrastructure/persistence/SQLiteAnswerRepository';
import { AnswerEntity, type Answer, type AnswerValue } from '../../../src/domain/entities/Answer';
import { EncryptedDataVO } from '../../../src/domain/value-objects/EncryptedData';
import { logError } from '@shared/logger';

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
  },
}));

const mockDecrypt = jest.fn();

jest.mock('../../../src/infrastructure/encryption/encryptionService', () => ({
  encryptionService: {
    decrypt: (...args: unknown[]) => mockDecrypt(...args),
  },
}));

describe('SQLiteAnswerRepository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('saveMany() uses a transaction and writes each answer', async () => {
    const repo = new SQLiteAnswerRepository();

    const encrypted = EncryptedDataVO.create({
      ciphertext: 'AA==',
      iv: 'AA==',
      authTag: 'AA==',
      salt: 'AA==',
    }).toString();

    const answerJson1: Answer = {
      id: '22222222-2222-2222-2222-222222222222',
      questionnaireId: '33333333-3333-3333-3333-333333333333',
      questionId: 'q1',
      encryptedValue: encrypted,
      questionType: 'text',
      answeredAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
      sourceType: 'manual',
      confidence: undefined,
      auditLog: [{ action: 'created', timestamp: new Date('2026-01-01T00:00:00.000Z') }],
    };

    const answerJson2: Answer = {
      ...answerJson1,
      id: '44444444-4444-4444-4444-444444444444',
      questionId: 'q2',
    };

    const a1 = AnswerEntity.fromJSON(answerJson1);
    const a2 = AnswerEntity.fromJSON(answerJson2);

    await repo.saveMany([a1, a2]);

    expect(mockDb.transaction).toHaveBeenCalledTimes(1);
    expect(mockTxExecuteSql).toHaveBeenCalledTimes(2);
    expect(String(mockTxExecuteSql.mock.calls[0][0])).toContain('INSERT OR REPLACE INTO answers');
    expect(mockTxExecuteSql.mock.calls[0][1][0]).toBe(answerJson1.id);
    expect(mockTxExecuteSql.mock.calls[1][1][0]).toBe(answerJson2.id);
  });

  it('findByQuestionId() returns null if no rows', async () => {
    const repo = new SQLiteAnswerRepository();

    mockExecuteSql.mockResolvedValueOnce([
      {
        rows: {
          length: 0,
          item: () => null,
        },
      },
    ]);

    const out = await repo.findByQuestionId('33333333-3333-3333-3333-333333333333', 'q1');
    expect(out).toBeNull();
  });

  it('getAnswersMap() decrypts values and returns questionId -> value map', async () => {
    const repo = new SQLiteAnswerRepository();

    const encrypted = EncryptedDataVO.create({
      ciphertext: 'AA==',
      iv: 'AA==',
      authTag: 'AA==',
      salt: 'AA==',
    }).toString();

    const answerRow = {
      id: '22222222-2222-2222-2222-222222222222',
      questionnaire_id: '33333333-3333-3333-3333-333333333333',
      question_id: 'q1',
      encrypted_value: encrypted,
      question_type: 'text',
      source_type: 'manual',
      confidence: null,
      answered_at: new Date('2026-01-01T00:00:00.000Z').getTime(),
      updated_at: new Date('2026-01-01T00:00:00.000Z').getTime(),
      audit_log: JSON.stringify([
        { action: 'created', timestamp: new Date('2026-01-01T00:00:00.000Z') },
      ]),
    };

    // findByQuestionnaireId() will call executeSql
    mockExecuteSql.mockResolvedValueOnce([
      {
        rows: {
          length: 1,
          item: () => answerRow,
        },
      },
    ]);

    const stored: AnswerValue = 'hello';
    mockDecrypt.mockResolvedValueOnce(JSON.stringify(stored));

    const out = await repo.getAnswersMap('33333333-3333-3333-3333-333333333333', 'base64key');

    expect(mockDecrypt).toHaveBeenCalledTimes(1);
    expect(out.get('q1')).toBe('hello');
  });

  it('getAnswersMap() skips when decrypt fails for one of multiple answers', async () => {
    const repo = new SQLiteAnswerRepository();

    const encrypted1 = EncryptedDataVO.create({
      ciphertext: 'AQ==',
      iv: 'AQ==',
      authTag: 'AQ==',
      salt: 'AQ==',
    }).toString();

    const encrypted2 = EncryptedDataVO.create({
      ciphertext: 'Ag==',
      iv: 'Ag==',
      authTag: 'Ag==',
      salt: 'Ag==',
    }).toString();

    const rows = [
      {
        id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        questionnaire_id: '33333333-3333-3333-3333-333333333333',
        question_id: 'q1',
        encrypted_value: encrypted1,
        question_type: 'text',
        source_type: 'manual',
        confidence: null,
        answered_at: new Date('2026-01-01T00:00:00.000Z').getTime(),
        updated_at: new Date('2026-01-01T00:00:00.000Z').getTime(),
        audit_log: JSON.stringify([
          { action: 'created', timestamp: new Date('2026-01-01T00:00:00.000Z') },
        ]),
      },
      {
        id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
        questionnaire_id: '33333333-3333-3333-3333-333333333333',
        question_id: 'q2',
        encrypted_value: encrypted2,
        question_type: 'text',
        source_type: 'manual',
        confidence: null,
        answered_at: new Date('2026-01-01T00:00:01.000Z').getTime(),
        updated_at: new Date('2026-01-01T00:00:01.000Z').getTime(),
        audit_log: JSON.stringify([
          { action: 'created', timestamp: new Date('2026-01-01T00:00:01.000Z') },
        ]),
      },
    ];

    mockExecuteSql.mockResolvedValueOnce([
      {
        rows: {
          length: rows.length,
          item: (i: number) => rows[i],
        },
      },
    ]);

    mockDecrypt.mockRejectedValueOnce(new Error('decrypt failed'));
    mockDecrypt.mockResolvedValueOnce(JSON.stringify('world' satisfies AnswerValue));

    const out = await repo.getAnswersMap('33333333-3333-3333-3333-333333333333', 'base64key');

    expect(mockDecrypt).toHaveBeenCalledTimes(2);
    expect(out.has('q1')).toBe(false);
    expect(out.get('q2')).toBe('world');
    expect((logError as unknown as jest.Mock).mock.calls.length).toBe(1);
  });
});
