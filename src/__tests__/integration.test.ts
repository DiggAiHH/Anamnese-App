import { Buffer } from 'buffer';
import { SaveAnswerUseCase } from '../application/use-cases/SaveAnswerUseCase';
import { LoadQuestionnaireUseCase } from '../application/use-cases/LoadQuestionnaireUseCase';
import { CreatePatientUseCase } from '../application/use-cases/CreatePatientUseCase';
import { PatientEntity } from '../domain/entities/Patient';
import { QuestionnaireEntity, Section } from '../domain/entities/Questionnaire';
import { AnswerEntity, AnswerValue } from '../domain/entities/Answer';
import { EncryptedDataVO } from '../domain/value-objects/EncryptedData';
import { IAnswerRepository } from '../domain/repositories/IAnswerRepository';
import { IQuestionnaireRepository } from '../domain/repositories/IQuestionnaireRepository';
import { IPatientRepository } from '../domain/repositories/IPatientRepository';
import { IGDPRConsentRepository } from '../domain/repositories/IGDPRConsentRepository';
import { IEncryptionService } from '../domain/repositories/IEncryptionService';

class MockEncryptionService implements IEncryptionService {
  async deriveKey(password: string): Promise<{ key: string; salt: string }> {
    return { key: Buffer.from(password).toString('base64'), salt: 'c2FsdA==' };
  }

  async encrypt(data: string, _key: string): Promise<EncryptedDataVO> {
    return EncryptedDataVO.create({
      ciphertext: Buffer.from(data).toString('base64'),
      iv: 'aW52',
      authTag: 'YXV0aC10YWc=',
      salt: 'c2FsdA==',
    });
  }

  async decrypt(encryptedData: EncryptedDataVO, _key: string): Promise<string> {
    return Buffer.from(encryptedData.ciphertext, 'base64').toString('utf-8');
  }

  async hashPassword(password: string): Promise<string> {
    return password;
  }

  async verifyPassword(): Promise<boolean> {
    return true;
  }

  async generateRandomString(): Promise<string> {
    return 'random';
  }
}

class MockPatientRepository implements IPatientRepository {
  private patients: PatientEntity[] = [];

  async save(patient: PatientEntity): Promise<void> {
    const idx = this.patients.findIndex(p => p.id === patient.id);
    if (idx >= 0) {
      this.patients[idx] = patient;
    } else {
      this.patients.push(patient);
    }
  }

  async findById(id: string): Promise<PatientEntity | null> {
    return this.patients.find(p => p.id === id) ?? null;
  }

  async findAll(): Promise<PatientEntity[]> {
    return [...this.patients];
  }

  async delete(id: string): Promise<void> {
    this.patients = this.patients.filter(p => p.id !== id);
  }

  async exists(id: string): Promise<boolean> {
    return this.patients.some(p => p.id === id);
  }

  async search(): Promise<PatientEntity[]> {
    return [];
  }
}

class MockGDPRConsentRepository implements IGDPRConsentRepository {
  async save(): Promise<void> {}
  async findById(): Promise<any> { return null; }
  async findByPatientId(): Promise<any[]> { return []; }
  async findByPatientIdAndType(): Promise<any> { return null; }
  async hasActiveConsent(): Promise<boolean> { return true; }
  async deleteByPatientId(): Promise<void> {}
  async getAllActiveConsents(): Promise<any[]> { return []; }
  async getConsentHistory(): Promise<any[]> { return []; }
}

class MockQuestionnaireRepository implements IQuestionnaireRepository {
  private questionnaires: QuestionnaireEntity[] = [];
  private template: Section[] = [
    {
      id: 'personal',
      titleKey: 'sections.personal.title',
      order: 1,
      questions: [
        {
          id: 'first_name',
          type: 'text',
          labelKey: 'questions.first_name',
          required: true,
          validation: { min: 2, max: 50 },
        },
        {
          id: 'gender',
          type: 'radio',
          labelKey: 'questions.gender',
          required: true,
          options: [
            { value: 'male', labelKey: 'male' },
            { value: 'female', labelKey: 'female' },
          ],
        },
      ],
    },
    {
      id: 'womens_health',
      titleKey: 'sections.womens_health.title',
      order: 2,
      questions: [
        {
          id: 'pregnancy',
          type: 'radio',
          labelKey: 'questions.pregnancy',
          required: false,
          options: [
            { value: 'yes', labelKey: 'yes' },
            { value: 'no', labelKey: 'no' },
          ],
          conditions: [{ questionId: 'gender', operator: 'equals', value: 'female' }],
        },
      ],
    },
  ];

  async save(questionnaire: QuestionnaireEntity): Promise<void> {
    const idx = this.questionnaires.findIndex(q => q.id === questionnaire.id);
    if (idx >= 0) {
      this.questionnaires[idx] = questionnaire;
    } else {
      this.questionnaires.push(questionnaire);
    }
  }

  async findById(id: string): Promise<QuestionnaireEntity | null> {
    return this.questionnaires.find(q => q.id === id) ?? null;
  }

  async findByPatientId(patientId: string): Promise<QuestionnaireEntity[]> {
    return this.questionnaires.filter(q => q.patientId === patientId);
  }

  async delete(id: string): Promise<void> {
    this.questionnaires = this.questionnaires.filter(q => q.id !== id);
  }

  async loadTemplate(): Promise<Section[]> {
    return this.template;
  }

  async getLatestTemplateVersion(): Promise<string> {
    return '1.0.0';
  }
}

class MockAnswerRepository implements IAnswerRepository {
  private answers: AnswerEntity[] = [];

  async save(answer: AnswerEntity): Promise<void> {
    const idx = this.answers.findIndex(a => a.id === answer.id);
    if (idx >= 0) {
      this.answers[idx] = answer;
    } else {
      this.answers.push(answer);
    }
  }

  async saveMany(answers: AnswerEntity[]): Promise<void> {
    answers.forEach(a => this.save(a));
  }

  async findById(id: string): Promise<AnswerEntity | null> {
    return this.answers.find(a => a.id === id) ?? null;
  }

  async findByQuestionnaireId(questionnaireId: string): Promise<AnswerEntity[]> {
    return this.answers.filter(a => a.questionnaireId === questionnaireId);
  }

  async findByQuestionId(questionnaireId: string, questionId: string): Promise<AnswerEntity | null> {
    return this.answers.find(a => a.questionnaireId === questionnaireId && a.questionId === questionId) ?? null;
  }

  async delete(): Promise<void> {}
  async deleteByQuestionnaireId(): Promise<void> {}
  async getDecryptedAnswersMap(questionnaireId: string, _encryptionKey: string): Promise<Map<string, AnswerValue>> {
    const map = new Map<string, AnswerValue>();
    const encryption = new MockEncryptionService();

    const relevant = this.answers.filter(a => a.questionnaireId === questionnaireId);
    for (const ans of relevant) {
      const decrypted = await encryption.decrypt(EncryptedDataVO.fromString(ans.encryptedValue), _encryptionKey);
      map.set(ans.questionId, JSON.parse(decrypted));
    }
    return map;
  }

  async getAnswersMap(questionnaireId: string, encryptionKey: string): Promise<Map<string, AnswerValue>> {
    return this.getDecryptedAnswersMap(questionnaireId, encryptionKey);
  }
}

describe('Integration - Questionnaire flow', () => {
  const encryption = new MockEncryptionService();
  let patientRepo: MockPatientRepository;
  let gdprRepo: MockGDPRConsentRepository;
  let questionnaireRepo: MockQuestionnaireRepository;
  let answerRepo: MockAnswerRepository;

  let createPatient: CreatePatientUseCase;
  let loadQuestionnaire: LoadQuestionnaireUseCase;
  let saveAnswer: SaveAnswerUseCase;
  let encryptionKey: string;

  beforeEach(async () => {
    patientRepo = new MockPatientRepository();
    gdprRepo = new MockGDPRConsentRepository();
    questionnaireRepo = new MockQuestionnaireRepository();
    answerRepo = new MockAnswerRepository();

    createPatient = new CreatePatientUseCase(patientRepo, gdprRepo);
    loadQuestionnaire = new LoadQuestionnaireUseCase(questionnaireRepo, answerRepo, patientRepo);
    saveAnswer = new SaveAnswerUseCase(answerRepo, encryption);

    const derived = await encryption.deriveKey('StrongMasterPassword123!');
    encryptionKey = derived.key;
  });

  it('creates patient, loads questionnaire, saves answer, and reloads with decrypted answers', async () => {
    const createResult = await createPatient.execute({
      firstName: 'Max',
      lastName: 'Mustermann',
      birthDate: '1990-05-15',
      language: 'de',
      encryptionKey,
      consents: {
        dataProcessing: true,
        dataStorage: true,
      },
    });

    expect(createResult.success).toBe(true);
    const patientId = createResult.patientId!;

    const loadResult = await loadQuestionnaire.execute({ patientId, encryptionKey });
    expect(loadResult.success).toBe(true);
    const questionnaire = loadResult.questionnaire!;
    const firstQuestion = questionnaire.sections[0].questions[0];

    const saveResult = await saveAnswer.execute({
      questionnaireId: questionnaire.id,
      question: firstQuestion,
      value: 'Max',
      encryptionKey,
    });

    expect(saveResult.success).toBe(true);

    const reload = await loadQuestionnaire.execute({
      patientId,
      questionnaireId: questionnaire.id,
      encryptionKey,
    });

    expect(reload.success).toBe(true);
    expect(reload.answers?.get(firstQuestion.id)).toBe('Max');
  });
});
