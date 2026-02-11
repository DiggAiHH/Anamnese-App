/**
 * InMemoryQuestionnaireRepository Tests
 *
 * Tests questionnaire CRUD and template loading.
 *
 * @security No PII in tests.
 */

import { InMemoryQuestionnaireRepository } from '@infrastructure/persistence/InMemoryQuestionnaireRepository';
import { QuestionnaireEntity } from '@domain/entities/Questionnaire';

beforeAll(() => {
  Object.defineProperty(globalThis, 'crypto', {
    value: {
      ...globalThis.crypto,
      randomUUID: () => '00000000-0000-0000-0000-000000000001',
    },
    writable: true,
  });
});

describe('InMemoryQuestionnaireRepository', () => {
  let repo: InMemoryQuestionnaireRepository;
  const patientId = '00000000-0000-0000-0000-cccccccccccc';

  let uuidCounter = 0;
  const nextUUID = (): void => {
    uuidCounter++;
    const hex = uuidCounter.toString(16).padStart(12, '0');
    globalThis.crypto.randomUUID = () => `00000000-0000-0000-0000-${hex}`;
  };

  const createQuestionnaire = (pid = patientId): QuestionnaireEntity => {
    nextUUID();
    return QuestionnaireEntity.create({
      patientId: pid,
      version: '1.0.0',
      sections: [
        {
          id: 'section-1',
          titleKey: 'test.section',
          descriptionKey: 'test.desc',
          order: 1,
          questions: [{ id: 'q1', type: 'text', labelKey: 'test.q1', required: true }],
        },
      ],
    });
  };

  beforeEach(() => {
    repo = new InMemoryQuestionnaireRepository();
    uuidCounter = 0;
  });

  afterEach(() => {
    repo.clear();
  });

  describe('save()', () => {
    it('saves a questionnaire', async () => {
      await repo.save(createQuestionnaire());
      expect(repo.size()).toBe(1);
    });
  });

  describe('findById()', () => {
    it('returns questionnaire by id', async () => {
      const qn = createQuestionnaire();
      await repo.save(qn);
      const found = await repo.findById(qn.id);
      expect(found).not.toBeNull();
      expect(found!.patientId).toBe(patientId);
    });

    it('returns null for non-existent id', async () => {
      expect(await repo.findById('missing')).toBeNull();
    });
  });

  describe('findByPatientId()', () => {
    it('returns all questionnaires for a patient', async () => {
      await repo.save(createQuestionnaire());
      await repo.save(createQuestionnaire());
      const results = await repo.findByPatientId(patientId);
      expect(results).toHaveLength(2);
    });

    it('returns empty for unknown patient', async () => {
      expect(await repo.findByPatientId('unknown')).toEqual([]);
    });
  });

  describe('delete()', () => {
    it('removes questionnaire by id', async () => {
      const qn = createQuestionnaire();
      await repo.save(qn);
      await repo.delete(qn.id);
      expect(repo.size()).toBe(0);
    });
  });

  describe('loadTemplate()', () => {
    it('returns default template sections', async () => {
      const sections = await repo.loadTemplate();
      expect(sections.length).toBeGreaterThan(0);
      expect(sections[0].id).toBeDefined();
      expect(sections[0].questions.length).toBeGreaterThan(0);
    });

    it('returns deep copy (mutation-safe)', async () => {
      const a = await repo.loadTemplate();
      const b = await repo.loadTemplate();
      expect(a).toEqual(b);
      a[0].titleKey = 'MUTATED';
      const c = await repo.loadTemplate();
      expect(c[0].titleKey).not.toBe('MUTATED');
    });
  });

  describe('getLatestTemplateVersion()', () => {
    it('returns version string', async () => {
      const v = await repo.getLatestTemplateVersion();
      expect(typeof v).toBe('string');
      expect(v).toBe('1.0.0');
    });
  });

  describe('setTemplate()', () => {
    it('overrides template for testing', async () => {
      repo.setTemplate(
        [
          {
            id: 'custom',
            titleKey: 'custom.title',
            descriptionKey: 'custom.desc',
            order: 1,
            questions: [],
          },
        ],
        '2.0.0',
      );
      const sections = await repo.loadTemplate();
      expect(sections).toHaveLength(1);
      expect(sections[0].id).toBe('custom');

      const version = await repo.getLatestTemplateVersion();
      expect(version).toBe('2.0.0');
    });
  });

  describe('utility methods', () => {
    it('clear() removes all questionnaires', async () => {
      await repo.save(createQuestionnaire());
      repo.clear();
      expect(repo.size()).toBe(0);
    });

    it('getAll() returns raw data', async () => {
      await repo.save(createQuestionnaire());
      expect(repo.getAll()).toHaveLength(1);
    });
  });
});
