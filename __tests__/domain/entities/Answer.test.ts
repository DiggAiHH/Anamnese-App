import { AnswerEntity } from '@domain/entities/Answer';

describe('AnswerEntity', () => {
  const baseParams = {
    questionnaireId: '00000000-0000-0000-0000-000000000001',
    questionId: 'q1',
    encryptedValue: 'ciphertext-base64',
    questionType: 'text' as const,
  };

  it('creates an answer with defaults', () => {
    const answer = AnswerEntity.create({ ...baseParams, sourceType: 'manual' });

    expect(answer.id).toBeDefined();
    expect(answer.encryptedValue).toBe('ciphertext-base64');
    expect(answer.sourceType).toBe('manual');
    expect(answer.auditLog[0].action).toBe('created');
  });

  it('accepts AI metadata and tracks confidence', () => {
    const answer = AnswerEntity.create({
      ...baseParams,
      questionId: 'q2',
      sourceType: 'voice',
      confidence: 0.9,
    });

    expect(answer.isAIGenerated()).toBe(true);
    expect(answer.hasHighConfidence()).toBe(true);
  });

  it('updates value immutably and appends audit log', () => {
    const answer = AnswerEntity.create({ ...baseParams, sourceType: 'manual' });
    const updated = answer.update('new-cipher', 'ocr');

    expect(updated.encryptedValue).toBe('new-cipher');
    expect(updated.sourceType).toBe('ocr');
    expect(updated.updatedAt.getTime()).toBeGreaterThanOrEqual(answer.updatedAt.getTime());
    expect(updated.auditLog).toHaveLength(2);
  });
});
