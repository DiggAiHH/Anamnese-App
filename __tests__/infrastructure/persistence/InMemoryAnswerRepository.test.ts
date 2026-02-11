/**
 * InMemoryAnswerRepository Tests
 *
 * Tests answer CRUD, batch operations, and decryption map retrieval.
 *
 * @security No PII in tests. Encrypted values are synthetic.
 */

import { InMemoryAnswerRepository } from '@infrastructure/persistence/InMemoryAnswerRepository';
import { AnswerEntity } from '@domain/entities/Answer';

beforeAll(() => {
  Object.defineProperty(globalThis, 'crypto', {
    value: {
      ...globalThis.crypto,
      randomUUID: () => '00000000-0000-0000-0000-000000000001',
    },
    writable: true,
  });
});

describe('InMemoryAnswerRepository', () => {
  let repo: InMemoryAnswerRepository;
  const questionnaireId = '00000000-0000-0000-0000-aaaaaaaaaaaa';

  let uuidCounter = 0;
  const nextUUID = (): void => {
    uuidCounter++;
    const hex = uuidCounter.toString(16).padStart(12, '0');
    globalThis.crypto.randomUUID = () => `00000000-0000-0000-0000-${hex}`;
  };

  const createAnswer = (questionId = 'q1', value = 'encrypted-data'): AnswerEntity => {
    nextUUID();
    return AnswerEntity.create({
      questionnaireId,
      questionId,
      encryptedValue: value,
      questionType: 'text',
      sourceType: 'manual',
    });
  };

  beforeEach(() => {
    repo = new InMemoryAnswerRepository();
    uuidCounter = 0;
  });

  afterEach(() => {
    repo.clear();
  });

  describe('save()', () => {
    it('saves an answer', async () => {
      await repo.save(createAnswer());
      expect(repo.size()).toBe(1);
    });
  });

  describe('saveMany()', () => {
    it('saves multiple answers at once', async () => {
      const answers = [createAnswer('q1'), createAnswer('q2'), createAnswer('q3')];
      await repo.saveMany(answers);
      expect(repo.size()).toBe(3);
    });
  });

  describe('findById()', () => {
    it('returns answer by id', async () => {
      const answer = createAnswer('q1', 'test-value');
      await repo.save(answer);
      const found = await repo.findById(answer.id);
      expect(found).not.toBeNull();
      expect(found!.encryptedValue).toBe('test-value');
    });

    it('returns null for non-existent id', async () => {
      expect(await repo.findById('missing')).toBeNull();
    });
  });

  describe('findByQuestionnaireId()', () => {
    it('returns all answers for a questionnaire', async () => {
      await repo.save(createAnswer('q1'));
      await repo.save(createAnswer('q2'));
      const results = await repo.findByQuestionnaireId(questionnaireId);
      expect(results).toHaveLength(2);
    });

    it('returns empty for unknown questionnaire', async () => {
      expect(await repo.findByQuestionnaireId('unknown')).toEqual([]);
    });
  });

  describe('findByQuestionId()', () => {
    it('returns specific answer by questionnaire + question id', async () => {
      await repo.save(createAnswer('q1'));
      await repo.save(createAnswer('q2'));
      const found = await repo.findByQuestionId(questionnaireId, 'q2');
      expect(found).not.toBeNull();
      expect(found!.questionId).toBe('q2');
    });

    it('returns null when not found', async () => {
      expect(await repo.findByQuestionId(questionnaireId, 'missing')).toBeNull();
    });
  });

  describe('delete()', () => {
    it('removes answer by id', async () => {
      const answer = createAnswer();
      await repo.save(answer);
      await repo.delete(answer.id);
      expect(repo.size()).toBe(0);
    });
  });

  describe('deleteByQuestionnaireId()', () => {
    it('removes all answers for a questionnaire', async () => {
      await repo.save(createAnswer('q1'));
      await repo.save(createAnswer('q2'));
      await repo.deleteByQuestionnaireId(questionnaireId);
      expect(repo.size()).toBe(0);
    });
  });

  describe('getAnswersMap()', () => {
    it('returns map of questionId → decrypted value', async () => {
      await repo.save(createAnswer('q1', JSON.stringify('Hello')));
      await repo.save(createAnswer('q2', JSON.stringify(42)));
      const map = await repo.getAnswersMap(questionnaireId, 'unused-key');
      expect(map.get('q1')).toBe('Hello');
      expect(map.get('q2')).toBe(42);
    });

    it('falls back to raw string if value is not JSON', async () => {
      await repo.save(createAnswer('q1', 'not-json'));
      const map = await repo.getAnswersMap(questionnaireId, 'unused-key');
      expect(map.get('q1')).toBe('not-json');
    });

    it('returns empty map for empty questionnaire', async () => {
      const map = await repo.getAnswersMap('empty-qn', 'key');
      expect(map.size).toBe(0);
    });
  });

  describe('utility methods', () => {
    it('clear() removes all answers', async () => {
      await repo.save(createAnswer());
      repo.clear();
      expect(repo.size()).toBe(0);
    });

    it('getAll() returns raw data', async () => {
      await repo.save(createAnswer());
      expect(repo.getAll()).toHaveLength(1);
    });
  });
});
