/**
 * @fileoverview Unit tests for LoadQuestionnaireUseCase resume behavior
 */

import { LoadQuestionnaireUseCase } from '../../../src/application/use-cases/LoadQuestionnaireUseCase';
import { QuestionnaireEntity, Section } from '../../../src/domain/entities/Questionnaire';
import { IQuestionnaireRepository } from '../../../src/domain/repositories/IQuestionnaireRepository';
import { IAnswerRepository } from '../../../src/domain/repositories/IAnswerRepository';
import { IPatientRepository } from '../../../src/domain/repositories/IPatientRepository';

const buildSectionTemplate = (): Section[] => [
  {
    id: 'section-1',
    titleKey: 'section.title',
    descriptionKey: 'section.desc',
    order: 1,
    questions: [
      {
        id: 'question-1',
        type: 'text',
        labelKey: 'question.label',
        required: false,
      },
    ],
  },
];

const buildQuestionnaire = (params: {
  id: string;
  patientId: string;
  updatedAt: Date;
}): QuestionnaireEntity => {
  const template = buildSectionTemplate();
  return QuestionnaireEntity.fromJSON({
    id: params.id,
    patientId: params.patientId,
    version: '1.0.0',
    sections: template,
    createdAt: new Date('2024-01-01'),
    updatedAt: params.updatedAt,
    completedAt: null,
    status: 'draft',
  });
};

describe('LoadQuestionnaireUseCase', () => {
  let questionnaireRepo: jest.Mocked<IQuestionnaireRepository>;
  let answerRepo: jest.Mocked<IAnswerRepository>;
  let patientRepo: jest.Mocked<IPatientRepository>;

  beforeEach(() => {
    questionnaireRepo = {
      save: jest.fn(),
      findById: jest.fn(),
      findByPatientId: jest.fn(),
      delete: jest.fn(),
      loadTemplate: jest.fn(),
      getLatestTemplateVersion: jest.fn(),
    };

    answerRepo = {
      save: jest.fn(),
      saveMany: jest.fn(),
      findById: jest.fn(),
      findByQuestionnaireId: jest.fn(),
      findByQuestionId: jest.fn(),
      delete: jest.fn(),
      deleteByQuestionnaireId: jest.fn(),
      getAnswersMap: jest.fn(),
    };

    patientRepo = {
      save: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
      delete: jest.fn(),
      exists: jest.fn(),
      search: jest.fn(),
    };
  });

  it('resumes latest questionnaire when no questionnaireId is provided', async () => {
    const patientId = '11111111-1111-1111-1111-111111111111';
    const older = buildQuestionnaire({
      id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      patientId,
      updatedAt: new Date('2024-01-01'),
    });
    const newer = buildQuestionnaire({
      id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
      patientId,
      updatedAt: new Date('2024-02-01'),
    });

    patientRepo.exists.mockResolvedValue(true);
    questionnaireRepo.findByPatientId.mockResolvedValue([older, newer]);

    const useCase = new LoadQuestionnaireUseCase(questionnaireRepo, answerRepo, patientRepo);
    const result = await useCase.execute({ patientId, encryptionKey: 'key' });

    expect(result.success).toBe(true);
    expect(result.questionnaire?.id).toBe(newer.id);
    expect(questionnaireRepo.loadTemplate).not.toHaveBeenCalled();
    expect(questionnaireRepo.save).not.toHaveBeenCalled();
  });

  it('creates a new questionnaire when none exist for the patient', async () => {
    const patientId = '22222222-2222-2222-2222-222222222222';

    patientRepo.exists.mockResolvedValue(true);
    questionnaireRepo.findByPatientId.mockResolvedValue([]);
    questionnaireRepo.loadTemplate.mockResolvedValue(buildSectionTemplate());
    questionnaireRepo.getLatestTemplateVersion.mockResolvedValue('2.0.0');

    const useCase = new LoadQuestionnaireUseCase(questionnaireRepo, answerRepo, patientRepo);
    const result = await useCase.execute({ patientId, encryptionKey: 'key' });

    expect(result.success).toBe(true);
    expect(result.questionnaire).toBeDefined();
    expect(questionnaireRepo.save).toHaveBeenCalledTimes(1);
  });
});
