/**
 * TemplateMigrationService Unit Tests (Version-Aware)
 *
 * Tests version-aware migration logic:
 * - First run: imports all questions
 * - Same version: skips
 * - Version change: re-imports
 */

jest.mock('@shared/logger', () => ({
  logInfo: jest.fn(),
  logError: jest.fn(),
  logDebug: jest.fn(),
  logWarn: jest.fn(),
}));

// Mock DatabaseConnection
const mockExecuteSql = jest.fn();
jest.mock('@infrastructure/persistence/DatabaseConnection', () => ({
  database: {
    executeSql: (...args: unknown[]) => mockExecuteSql(...args),
  },
}));

// Mock the JSON template
jest.mock('../../../src/infrastructure/data/questionnaire-template.json', () => ({
  version: '3.0.0',
  sections: [
    {
      id: 'sec1',
      questions: [
        {
          id: 'q100',
          type: 'text',
          labelKey: 'question.name',
          required: true,
          metadata: { statisticGroup: 'demographics', fieldName: 'pat_name', gdprRelated: true },
        },
        {
          id: 'q200',
          type: 'radio',
          labelKey: 'question.gender',
          required: true,
          options: [
            { value: 1, labelKey: 'male' },
            { value: 2, labelKey: 'female' },
          ],
          metadata: { statisticGroup: 'demographics', compartmentId: 5, compartmentConcept: 'patient_info' },
        },
      ],
    },
    {
      id: 'sec2',
      questions: [
        {
          id: 'q300',
          type: 'checkbox',
          labelKey: 'question.allergies',
          metadata: {
            statisticGroup: 'allergies',
            researchTags: ['allergy', 'immunology'],
            icd10Codes: ['T78.4'],
          },
        },
      ],
    },
  ],
}));

// Mock SQLiteQuestionUniverseRepository
const mockSave = jest.fn();
const mockFindAll = jest.fn();
const mockDeleteAll = jest.fn();

jest.mock('@infrastructure/persistence/SQLiteQuestionUniverseRepository', () => ({
  SQLiteQuestionUniverseRepository: jest.fn().mockImplementation(() => ({
    save: mockSave,
    findAll: mockFindAll,
    deleteAll: mockDeleteAll,
  })),
}));

import { TemplateMigrationService } from '../../../src/infrastructure/services/TemplateMigrationService';
import { logInfo } from '@shared/logger';

describe('TemplateMigrationService', () => {
  let service: TemplateMigrationService;

  beforeEach(() => {
    jest.clearAllMocks();
    mockFindAll.mockResolvedValue([]);
    mockSave.mockResolvedValue(undefined);
    mockDeleteAll.mockResolvedValue(undefined);

    // Default: no version stored yet
    mockExecuteSql.mockResolvedValue({ rows: { length: 0, item: jest.fn() } });

    service = new TemplateMigrationService();
  });

  describe('First Migration', () => {
    it('should import all questions from template', async () => {
      const count = await service.migrate();

      expect(count).toBe(3); // 2 in sec1 + 1 in sec2
      expect(mockSave).toHaveBeenCalledTimes(3);
    });

    it('should store template version after migration', async () => {
      await service.migrate();

      // Expect INSERT OR REPLACE into db_metadata
      expect(mockExecuteSql).toHaveBeenCalledWith(
        'INSERT OR REPLACE INTO db_metadata (key, value) VALUES (?, ?);',
        ['template_migration_version', '3.0.0'],
      );
    });

    it('should log first migration message', async () => {
      await service.migrate();

      expect(logInfo).toHaveBeenCalledWith(expect.stringContaining('First migration'));
    });

    it('should extract metadata correctly', async () => {
      await service.migrate();

      // First call to save — q100 (demographics, gdprRelated, gdtFieldId=pat_name)
      const firstSaveArg = mockSave.mock.calls[0][0];
      expect(firstSaveArg.templateId).toBe('q100');
      expect(firstSaveArg.metadata.statisticGroup).toBe('demographics');
      expect(firstSaveArg.metadata.gdtFieldId).toBe('pat_name');
      expect(firstSaveArg.metadata.gdprRelated).toBe(true);

      // Second call — q200 (compartmentId, concept)
      const secondSaveArg = mockSave.mock.calls[1][0];
      expect(secondSaveArg.templateId).toBe('q200');
      expect(secondSaveArg.metadata.compartmentId).toBe(5);
      expect(secondSaveArg.metadata.concept).toBe('patient_info');

      // Third call — q300 (researchTags, icd10Codes)
      const thirdSaveArg = mockSave.mock.calls[2][0];
      expect(thirdSaveArg.templateId).toBe('q300');
      expect(thirdSaveArg.metadata.researchTags).toEqual(['allergy', 'immunology']);
      expect(thirdSaveArg.metadata.icd10Codes).toEqual(['T78.4']);
    });
  });

  describe('Same Version (Skip)', () => {
    it('should skip migration when version matches and questions exist', async () => {
      // Simulate: version already stored as 3.0.0
      mockExecuteSql.mockResolvedValueOnce({
        rows: { length: 1, item: () => ({ value: '3.0.0' }) },
      });

      // Simulate: questions already exist
      mockFindAll.mockResolvedValue([
        { id: '1', templateId: 'q100' },
        { id: '2', templateId: 'q200' },
        { id: '3', templateId: 'q300' },
      ]);

      const count = await service.migrate();

      expect(count).toBe(3);
      expect(mockSave).not.toHaveBeenCalled();
      expect(logInfo).toHaveBeenCalledWith(
        expect.stringContaining('Skipping'),
      );
    });
  });

  describe('Version Change (Re-migrate)', () => {
    it('should deleteAll and re-import on version mismatch', async () => {
      // Simulate: version 2.0.0 was stored
      mockExecuteSql.mockResolvedValueOnce({
        rows: { length: 1, item: () => ({ value: '2.0.0' }) },
      });

      // Existing questions from old version
      mockFindAll.mockResolvedValue([{ id: 'old1' }]);

      const count = await service.migrate();

      expect(mockDeleteAll).toHaveBeenCalledTimes(1);
      expect(mockSave).toHaveBeenCalledTimes(3);
      expect(count).toBe(3);
      expect(logInfo).toHaveBeenCalledWith(
        expect.stringContaining('Re-migrating'),
      );
    });
  });

  describe('Error Handling', () => {
    it('should throw on migration failure', async () => {
      mockSave.mockRejectedValue(new Error('DB write failed'));

      await expect(service.migrate()).rejects.toThrow('DB write failed');
    });
  });
});
