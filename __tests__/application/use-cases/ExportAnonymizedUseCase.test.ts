/**
 * ExportAnonymizedUseCase Unit Tests
 *
 * Tests PII stripping, anonymization, and QuestionUniverse metadata enrichment.
 */

import { ExportAnonymizedUseCase } from '../../../src/application/use-cases/ExportAnonymizedUseCase';
import { PatientEntity } from '../../../src/domain/entities/Patient';
import { QuestionnaireEntity, type Section } from '../../../src/domain/entities/Questionnaire';
import { QuestionUniverseEntity } from '../../../src/domain/entities/QuestionUniverse';
import { InMemoryQuestionUniverseRepository } from '../../../src/infrastructure/persistence/InMemoryQuestionUniverseRepository';

const mockWriteFile = jest.fn();
const mockMkdir = jest.fn();

jest.mock('../../../src/shared/rnfsSafe', () => ({
  requireRNFS: () => ({
    DocumentDirectoryPath: '/docs',
    mkdir: mockMkdir,
    writeFile: mockWriteFile,
  }),
}));

jest.mock('../../../src/shared/platformCapabilities', () => ({
  supportsRNFS: true,
}));

describe('ExportAnonymizedUseCase', () => {
  let patient: PatientEntity;
  let questionnaire: QuestionnaireEntity;

  const section: Section = {
    id: 's1',
    title: 'Section 1',
    questions: [
      {
        id: 'q100',
        type: 'text',
        labelKey: 'question.name',
        required: true,
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
      },
      {
        id: 'q300',
        type: 'checkbox',
        labelKey: 'question.allergies',
        required: false,
      },
    ],
    order: 1,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers().setSystemTime(new Date('2026-03-01T00:00:00.000Z'));

    patient = PatientEntity.create({
      firstName: 'Max',
      lastName: 'Mustermann',
      birthDate: '1990-05-15',
      language: 'de',
      gender: 'male',
    });

    questionnaire = QuestionnaireEntity.create(patient.id, [section], '1.0.0');
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  const createBasicUseCase = (
    answersMap: Map<string, unknown> = new Map(),
    universeRepo?: InMemoryQuestionUniverseRepository,
  ) => {
    return new ExportAnonymizedUseCase(
      { findById: jest.fn().mockResolvedValue(patient) } as never,
      { findById: jest.fn().mockResolvedValue(questionnaire) } as never,
      { getAnswersMap: jest.fn().mockResolvedValue(answersMap) } as never,
      universeRepo,
    );
  };

  it('should export successfully without QuestionUniverse repo', async () => {
    const answers = new Map<string, unknown>([['q100', 'John'], ['q200', 1]]);
    const useCase = createBasicUseCase(answers);

    const result = await useCase.execute({
      patientId: patient.id,
      questionnaireId: questionnaire.id,
      encryptionKey: 'key123',
    });

    expect(result.success).toBe(true);
    expect(result.filePath).toContain('anamnese_anon_');
  });

  it('should include only year of birth (no full date)', async () => {
    const useCase = createBasicUseCase();

    const result = await useCase.execute({
      patientId: patient.id,
      questionnaireId: questionnaire.id,
      encryptionKey: 'key',
    });

    expect(result.success).toBe(true);
    expect(mockWriteFile).toHaveBeenCalledTimes(1);
    const written = JSON.parse(mockWriteFile.mock.calls[0][1]);
    expect(written.demographics.yearOfBirth).toBe(1990);
    // Must NOT contain exact birthdate
    expect(JSON.stringify(written)).not.toContain('1990-05-15');
  });

  it('should not include PII (name, address) in export', async () => {
    const answers = new Map<string, unknown>([['q100', 'Test']]);
    const useCase = createBasicUseCase(answers);

    const result = await useCase.execute({
      patientId: patient.id,
      questionnaireId: questionnaire.id,
      encryptionKey: 'key',
    });

    expect(result.success).toBe(true);
    expect(mockWriteFile).toHaveBeenCalledTimes(1);
    const written = JSON.parse(mockWriteFile.mock.calls[0][1]);
    const jsonStr = JSON.stringify(written);
    expect(jsonStr).not.toContain('Max');
    expect(jsonStr).not.toContain('Mustermann');
  });

  describe('QuestionUniverse Metadata Enrichment', () => {
    let universeRepo: InMemoryQuestionUniverseRepository;

    beforeEach(async () => {
      universeRepo = new InMemoryQuestionUniverseRepository();

      // Populate with QuestionUniverse entities for q100 and q300
      await universeRepo.save(
        QuestionUniverseEntity.create({
          templateId: 'q100',
          type: 'text',
          labelKey: 'question.name',
          metadata: {
            statisticGroup: 'demographics',
            gdprRelated: true,
            isReusable: false,
          },
        }),
      );

      await universeRepo.save(
        QuestionUniverseEntity.create({
          templateId: 'q300',
          type: 'checkbox',
          labelKey: 'question.allergies',
          metadata: {
            statisticGroup: 'allergies',
            researchTags: ['allergy', 'immunology'],
            icd10Codes: ['T78.4', 'J30'],
            isReusable: false,
          },
        }),
      );
    });

    it('should attach metadata to enriched answers', async () => {
      const answers = new Map<string, unknown>([
        ['q100', 'John'],
        ['q300', true],
      ]);

      const useCase = createBasicUseCase(answers, universeRepo);

      await useCase.execute({
        patientId: patient.id,
        questionnaireId: questionnaire.id,
        encryptionKey: 'key',
      });

      const written = JSON.parse(mockWriteFile.mock.calls[0][1]);

      // q100 should have statisticGroup
      expect(written.answers['q100'].value).toBe('John');
      expect(written.answers['q100'].statisticGroup).toBe('demographics');

      // q300 should have researchTags + icd10Codes
      expect(written.answers['q300'].value).toBe(true);
      expect(written.answers['q300'].researchTags).toEqual(['allergy', 'immunology']);
      expect(written.answers['q300'].icd10Codes).toEqual(['T78.4', 'J30']);
    });

    it('should set export version to 2.0 when enriched', async () => {
      const answers = new Map<string, unknown>([['q100', 'test']]);
      const useCase = createBasicUseCase(answers, universeRepo);

      await useCase.execute({
        patientId: patient.id,
        questionnaireId: questionnaire.id,
        encryptionKey: 'key',
      });

      const written = JSON.parse(mockWriteFile.mock.calls[0][1]);
      expect(written.version).toBe('2.0');
    });

    it('should work gracefully when QuestionUniverse has no matching entry', async () => {
      // q200 has no QuestionUniverse entity
      const answers = new Map<string, unknown>([['q200', 1]]);
      const useCase = createBasicUseCase(answers, universeRepo);

      await useCase.execute({
        patientId: patient.id,
        questionnaireId: questionnaire.id,
        encryptionKey: 'key',
      });

      const written = JSON.parse(mockWriteFile.mock.calls[0][1]);
      // Should still have the value
      expect(written.answers['q200'].value).toBe(1);
      // But no metadata fields
      expect(written.answers['q200'].statisticGroup).toBeUndefined();
      expect(written.answers['q200'].icd10Codes).toBeUndefined();
    });
  });
});
