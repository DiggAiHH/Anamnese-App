/**
 * AnalyticsService Unit Tests
 *
 * Tests the getCompletionByGroup method with the
 * templateId bugfix (was using UUID instead of legacy ID).
 */

jest.mock('@shared/logger', () => ({
  logInfo: jest.fn(),
  logError: jest.fn(),
  logDebug: jest.fn(),
  logWarn: jest.fn(),
}));

// Mock SQLite repos to prevent real DB access
jest.mock('@infrastructure/persistence/SQLiteQuestionUniverseRepository', () => ({
  SQLiteQuestionUniverseRepository: jest.fn().mockImplementation(() => ({
    findAll: jest.fn(),
  })),
}));

jest.mock('@infrastructure/persistence/SQLiteAnswerRepository', () => ({
  SQLiteAnswerRepository: jest.fn().mockImplementation(() => ({
    findByQuestionnaireId: jest.fn(),
  })),
}));

import { AnalyticsService } from '../../../src/application/services/AnalyticsService';
import { SQLiteQuestionUniverseRepository } from '../../../src/infrastructure/persistence/SQLiteQuestionUniverseRepository';
import { SQLiteAnswerRepository } from '../../../src/infrastructure/persistence/SQLiteAnswerRepository';

describe('AnalyticsService', () => {
  let service: AnalyticsService;
  let mockQuestionRepo: jest.Mocked<{ findAll: jest.Mock }>;
  let mockAnswerRepo: jest.Mocked<{ findByQuestionnaireId: jest.Mock }>;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AnalyticsService();

    // Get the mock instances created by the constructor
    mockQuestionRepo = (SQLiteQuestionUniverseRepository as jest.Mock).mock.results[0].value;
    mockAnswerRepo = (SQLiteAnswerRepository as jest.Mock).mock.results[0].value;
  });

  describe('getCompletionByGroup (templateId fix)', () => {
    it('should match answers by templateId, not UUID', async () => {
      // Questions with UUIDs and templateIds
      mockQuestionRepo.findAll.mockResolvedValue([
        {
          id: 'uuid-aaa-111',
          templateId: '1000',
          metadata: { statisticGroup: 'cardiology' },
        },
        {
          id: 'uuid-bbb-222',
          templateId: '2000',
          metadata: { statisticGroup: 'cardiology' },
        },
        {
          id: 'uuid-ccc-333',
          templateId: '3000',
          metadata: { statisticGroup: 'neurology' },
        },
      ]);

      // Answers stored with LEGACY template IDs (not UUIDs)
      mockAnswerRepo.findByQuestionnaireId.mockResolvedValue([
        { questionId: '1000' },
        { questionId: '3000' },
      ]);

      const stats = await service.getCompletionByGroup('test-qnr-id');

      // cardiology: 1 of 2 answered = 50%
      const cardio = stats.find(s => s.groupId === 'cardiology');
      expect(cardio).toBeDefined();
      expect(cardio!.totalQuestions).toBe(2);
      expect(cardio!.answeredQuestions).toBe(1);
      expect(cardio!.completionRate).toBe(0.5);

      // neurology: 1 of 1 answered = 100%
      const neuro = stats.find(s => s.groupId === 'neurology');
      expect(neuro).toBeDefined();
      expect(neuro!.totalQuestions).toBe(1);
      expect(neuro!.answeredQuestions).toBe(1);
      expect(neuro!.completionRate).toBe(1);
    });

    it('should return 0% completion for groups with no answers', async () => {
      mockQuestionRepo.findAll.mockResolvedValue([
        {
          id: 'uuid-111',
          templateId: '5000',
          metadata: { statisticGroup: 'dermatology' },
        },
      ]);

      mockAnswerRepo.findByQuestionnaireId.mockResolvedValue([]);

      const stats = await service.getCompletionByGroup('test-qnr-id');

      expect(stats).toHaveLength(1);
      expect(stats[0].completionRate).toBe(0);
      expect(stats[0].answeredQuestions).toBe(0);
    });

    it('should group questions without statisticGroup as "Ungrouped"', async () => {
      mockQuestionRepo.findAll.mockResolvedValue([
        {
          id: 'uuid-x',
          templateId: '9000',
          metadata: {},
        },
      ]);

      mockAnswerRepo.findByQuestionnaireId.mockResolvedValue([]);

      const stats = await service.getCompletionByGroup('qnr');

      expect(stats[0].groupId).toBe('Ungrouped');
    });
  });

  describe('getAvailableResearchTags', () => {
    it('should return unique sorted tags', async () => {
      mockQuestionRepo.findAll.mockResolvedValue([
        { metadata: { researchTags: ['heart', 'bp'] } },
        { metadata: { researchTags: ['bp', 'diabetes'] } },
        { metadata: { researchTags: undefined } },
      ]);

      const tags = await service.getAvailableResearchTags();

      expect(tags).toEqual(['bp', 'diabetes', 'heart']);
    });
  });
});
