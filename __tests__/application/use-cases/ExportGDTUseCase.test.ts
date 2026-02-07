import { ExportGDTUseCase } from '../../../src/application/use-cases/ExportGDTUseCase';
import { PatientEntity } from '../../../src/domain/entities/Patient';
import { QuestionnaireEntity, type Section } from '../../../src/domain/entities/Questionnaire';
import { encryptionService } from '../../../src/infrastructure/encryption/encryptionService';
import { EncryptedDataVO } from '../../../src/domain/value-objects/EncryptedData';

jest.mock('../../../src/shared/rnfsSafe', () => ({
  requireRNFS: () => ({
    TemporaryDirectoryPath: '/tmp',
    DocumentDirectoryPath: '/docs',
    mkdir: jest.fn(),
    writeFile: jest.fn(),
  }),
}));

jest.mock('../../../src/shared/platformCapabilities', () => ({
  supportsRNFS: true,
}));

jest.mock('../../../src/infrastructure/encryption/encryptionService', () => ({
  encryptionService: {
    encrypt: jest.fn(),
  },
}));

describe('ExportGDTUseCase', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers().setSystemTime(new Date('2026-02-06T00:00:00.000Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('writes encrypted GDT export without patient identifiers in filename', async () => {
    const patient = PatientEntity.create({
      firstName: 'Max',
      lastName: 'Mustermann',
      birthDate: '1990-01-01',
      language: 'de',
      gender: 'male',
    });

    const section: Section = {
      id: 's1',
      title: 'Section',
      questions: [
        {
          id: 'q1',
          type: 'text',
          labelKey: 'question.label',
          required: false,
        },
      ],
      order: 1,
    };

    const questionnaire = QuestionnaireEntity.create(patient.id, [section], '1.0.0');

    const encrypted = EncryptedDataVO.create({
      ciphertext: 'ciphertext',
      iv: 'iv',
      authTag: 'authTag',
      salt: 'salt',
    });
    (encryptionService.encrypt as jest.Mock).mockResolvedValue(encrypted);

    const useCase = new ExportGDTUseCase(
      {
        findById: jest.fn().mockResolvedValue(patient),
        save: jest.fn(),
      } as never,
      {
        findById: jest.fn().mockResolvedValue(questionnaire),
      } as never,
      {
        getAnswersMap: jest.fn().mockResolvedValue(new Map()),
      } as never,
      {
        hasActiveConsent: jest.fn().mockResolvedValue(true),
      } as never,
    );

    const result = await useCase.execute({
      patientId: patient.id,
      questionnaireId: questionnaire.id,
      encryptionKey: 'key',
      senderId: 'SENDER',
      gdtVersion: '2.1',
    });

    expect(result.success).toBe(true);
    expect(result.filePath).toContain('.gdt.enc');
    expect(result.filePath).not.toContain(patient.id.substring(0, 8));
  });
});
