import { SaveAnswerUseCase } from '@application/use-cases/SaveAnswerUseCase';
import { IAnswerRepository } from '@domain/repositories/IAnswerRepository';
import { IEncryptionService } from '@domain/repositories/IEncryptionService';
import { AnswerEntity, AnswerValue } from '@domain/entities/Answer';
import { EncryptedDataVO } from '@domain/value-objects/EncryptedData';

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

  async findById(id: string): Promise<AnswerEntity | null> {
    return this.answers.find(a => a.id === id) ?? null;
  }

  async findByQuestionnaireId(questionnaireId: string): Promise<AnswerEntity[]> {
    return this.answers.filter(a => a.questionnaireId === questionnaireId);
  }

  async findByQuestionId(questionnaireId: string, questionId: string): Promise<AnswerEntity | null> {
    return this.answers.find(a => a.questionnaireId === questionnaireId && a.questionId === questionId) ?? null;
  }

  async saveMany(answers: AnswerEntity[]): Promise<void> {
    answers.forEach(answer => this.save(answer));
  }

  async delete(): Promise<void> {}
  async deleteByQuestionnaireId(): Promise<void> {}
  async saveBatch(): Promise<void> {}
  async getDecryptedAnswersMap(): Promise<Map<string, any>> {
    return new Map();
  }
  async getAnswersMap(): Promise<Map<string, AnswerValue>> {
    return new Map();
  }
}

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

describe('SaveAnswerUseCase', () => {
  let repository: MockAnswerRepository;
  let encryption: MockEncryptionService;
  let useCase: SaveAnswerUseCase;

  const question = {
    id: 'first_name',
    labelKey: 'q.first_name',
    type: 'text' as const,
    required: true,
    validation: { min: 2, max: 50 },
  };

  beforeEach(() => {
    repository = new MockAnswerRepository();
    encryption = new MockEncryptionService();
    useCase = new SaveAnswerUseCase(repository, encryption);
  });

  it('saves a valid answer and returns id', async () => {
    const result = await useCase.execute({
      questionnaireId: '11111111-1111-1111-1111-111111111111',
      question,
      value: 'John Doe',
      encryptionKey: 'base64key',
      sourceType: 'manual',
    });

    expect(result.success).toBe(true);
    expect(result.answerId).toBeDefined();
    const stored = await repository.findByQuestionId('11111111-1111-1111-1111-111111111111', 'first_name');
    expect(stored?.encryptedValue.length).toBeGreaterThan(0);
  });

  it('returns validation errors for missing required value', async () => {
    const result = await useCase.execute({
      questionnaireId: '11111111-1111-1111-1111-111111111111',
      question,
      value: null,
      encryptionKey: 'base64key',
    });

    expect(result.success).toBe(false);
    expect(result.validationErrors?.length).toBeGreaterThan(0);
  });

  it('updates existing answer instead of creating duplicate', async () => {
    await useCase.execute({
      questionnaireId: '11111111-1111-1111-1111-111111111111',
      question,
      value: 'John',
      encryptionKey: 'base64key',
    });

    const second = await useCase.execute({
      questionnaireId: '11111111-1111-1111-1111-111111111111',
      question,
      value: 'Johnny',
      encryptionKey: 'base64key',
      sourceType: 'voice',
      confidence: 0.8,
    });

    expect(second.success).toBe(true);
    const answers = await repository.findByQuestionnaireId('11111111-1111-1111-1111-111111111111');
    expect(answers).toHaveLength(1);
    expect(answers[0].sourceType).toBe('voice');
  });
});
