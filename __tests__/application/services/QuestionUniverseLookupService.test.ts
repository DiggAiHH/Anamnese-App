/**
 * QuestionUniverseLookupService Unit Tests
 *
 * Tests the cached bridge between legacy template question IDs
 * and QuestionUniverse entities.
 */

import { QuestionUniverseLookupService } from '../../../src/application/services/QuestionUniverseLookupService';
import { QuestionUniverseEntity } from '../../../src/domain/entities/QuestionUniverse';
import { IQuestionUniverseRepository } from '../../../src/domain/repositories/IQuestionUniverseRepository';

describe('QuestionUniverseLookupService', () => {
  let service: QuestionUniverseLookupService;
  let mockRepo: jest.Mocked<IQuestionUniverseRepository>;

  const createEntity = (
    templateId: string,
    overrides: Partial<Parameters<typeof QuestionUniverseEntity.create>[0]> = {},
  ) =>
    QuestionUniverseEntity.create({
      templateId,
      type: 'text',
      labelKey: `question.${templateId}`,
      metadata: {
        statisticGroup: 'cardiology',
        researchTags: ['heart', 'bloodpressure'],
        icd10Codes: ['I10', 'I25'],
        gdtFieldId: `gdt_${templateId}`,
        gdprRelated: false,
        isReusable: false,
      },
      ...overrides,
    });

  beforeEach(() => {
    mockRepo = {
      save: jest.fn(),
      saveAll: jest.fn(),
      findById: jest.fn(),
      findByTemplateId: jest.fn(),
      findBySectionId: jest.fn(),
      findAll: jest.fn(),
      delete: jest.fn(),
      deleteAll: jest.fn(),
      findByResearchTag: jest.fn(),
      findByIcd10Code: jest.fn(),
      findByStatisticGroup: jest.fn(),
      findGdprRelated: jest.fn(),
      count: jest.fn(),
      countByType: jest.fn(),
    };

    service = new QuestionUniverseLookupService(mockRepo);
  });

  describe('Lifecycle', () => {
    it('should not be initialized by default', () => {
      expect(service.isInitialized).toBe(false);
      expect(service.size).toBe(0);
    });

    it('should populate cache on initialize', async () => {
      const entities = [createEntity('1000'), createEntity('2000')];
      mockRepo.findAll.mockResolvedValue(entities);

      await service.initialize();

      expect(service.isInitialized).toBe(true);
      expect(service.size).toBe(2);
      expect(mockRepo.findAll).toHaveBeenCalledTimes(1);
    });

    it('should be idempotent on second initialize call', async () => {
      mockRepo.findAll.mockResolvedValue([createEntity('1000')]);

      await service.initialize();
      await service.initialize();

      expect(mockRepo.findAll).toHaveBeenCalledTimes(1);
    });

    it('should re-populate cache on refresh', async () => {
      const first = [createEntity('1000')];
      const second = [createEntity('1000'), createEntity('3000')];

      mockRepo.findAll.mockResolvedValueOnce(first).mockResolvedValueOnce(second);

      await service.initialize();
      expect(service.size).toBe(1);

      await service.refresh();
      expect(service.size).toBe(2);
      expect(mockRepo.findAll).toHaveBeenCalledTimes(2);
    });

    it('should clear cache on invalidate', async () => {
      mockRepo.findAll.mockResolvedValue([createEntity('1000')]);

      await service.initialize();
      expect(service.size).toBe(1);

      service.invalidate();
      expect(service.isInitialized).toBe(false);
      expect(service.size).toBe(0);
    });
  });

  describe('Lookups', () => {
    const entity1000 = createEntity('1000');
    const entity2000 = createEntity('2000', {
      metadata: {
        statisticGroup: 'neurology',
        researchTags: ['brain'],
        icd10Codes: ['G40'],
        gdtFieldId: undefined,
        gdprRelated: true,
        isReusable: false,
      },
    });

    beforeEach(async () => {
      mockRepo.findAll.mockResolvedValue([entity1000, entity2000]);
      await service.initialize();
    });

    it('getByTemplateId returns entity for existing ID', () => {
      const result = service.getByTemplateId('1000');
      expect(result).toBeDefined();
      expect(result?.templateId).toBe('1000');
      expect(result?.id).toBe(entity1000.id);
    });

    it('getByTemplateId returns undefined for missing ID', () => {
      expect(service.getByTemplateId('9999')).toBeUndefined();
    });

    it('getUniverseId returns UUID for existing template ID', () => {
      expect(service.getUniverseId('1000')).toBe(entity1000.id);
    });

    it('getMetadata returns metadata object', () => {
      const meta = service.getMetadata('1000');
      expect(meta?.statisticGroup).toBe('cardiology');
      expect(meta?.icd10Codes).toEqual(['I10', 'I25']);
    });

    it('getIcd10Codes returns codes array', () => {
      expect(service.getIcd10Codes('1000')).toEqual(['I10', 'I25']);
    });

    it('getIcd10Codes returns empty array for missing ID', () => {
      expect(service.getIcd10Codes('9999')).toEqual([]);
    });

    it('getStatisticGroup returns group name', () => {
      expect(service.getStatisticGroup('1000')).toBe('cardiology');
      expect(service.getStatisticGroup('2000')).toBe('neurology');
    });

    it('getGdtFieldId returns field ID when set', () => {
      expect(service.getGdtFieldId('1000')).toBe('gdt_1000');
    });

    it('getGdtFieldId returns undefined when not set', () => {
      expect(service.getGdtFieldId('2000')).toBeUndefined();
    });

    it('isGdprRelated returns correct boolean', () => {
      expect(service.isGdprRelated('1000')).toBe(false);
      expect(service.isGdprRelated('2000')).toBe(true);
    });

    it('isGdprRelated returns false for missing ID', () => {
      expect(service.isGdprRelated('9999')).toBe(false);
    });

    it('getByStatisticGroup groups entities correctly', () => {
      const groups = service.getByStatisticGroup();
      expect(groups.size).toBe(2);
      expect(groups.get('cardiology')?.length).toBe(1);
      expect(groups.get('neurology')?.length).toBe(1);
    });

    it('getByResearchTag filters by tag', () => {
      const heart = service.getByResearchTag('heart');
      expect(heart).toHaveLength(1);
      expect(heart[0].templateId).toBe('1000');

      const brain = service.getByResearchTag('brain');
      expect(brain).toHaveLength(1);
      expect(brain[0].templateId).toBe('2000');

      const unknown = service.getByResearchTag('nonexistent');
      expect(unknown).toHaveLength(0);
    });

    it('getAll returns all cached entities', () => {
      const all = service.getAll();
      expect(all).toHaveLength(2);
    });
  });
});
