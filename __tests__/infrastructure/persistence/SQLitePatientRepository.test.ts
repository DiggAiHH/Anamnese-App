import { SQLitePatientRepository } from '../../../src/infrastructure/persistence/SQLitePatientRepository';
import { PatientEntity } from '../../../src/domain/entities/Patient';
import { database } from '../../../src/infrastructure/persistence/DatabaseConnection';
import { encryptionService } from '../../../src/infrastructure/encryption/encryptionService';
import { getActiveEncryptionKey } from '../../../src/shared/keyManager';
import { EncryptedDataVO } from '../../../src/domain/value-objects/EncryptedData';

// Mock database connection
jest.mock('../../../src/infrastructure/persistence/DatabaseConnection', () => ({
  database: {
    connect: jest.fn(),
  },
}));

jest.mock('../../../src/infrastructure/encryption/encryptionService', () => ({
  encryptionService: {
    encrypt: jest.fn(),
    decrypt: jest.fn(),
  },
}));

jest.mock('../../../src/shared/keyManager', () => ({
  getActiveEncryptionKey: jest.fn(),
}));

jest.mock('../../../src/domain/value-objects/EncryptedData', () => ({
  EncryptedDataVO: {
    fromString: jest.fn(),
  },
}));

// Mock EncryptedDataVO methods to control output if needed,
// though we usually mocking the Entity instance itself in these tests.

describe('SQLitePatientRepository', () => {
  let repository: SQLitePatientRepository;
  let mockExecuteSql: jest.Mock;
  let mockDb: { executeSql: jest.Mock };

  beforeEach(() => {
    mockExecuteSql = jest.fn();
    mockDb = {
      executeSql: mockExecuteSql,
    };
    (database.connect as jest.Mock).mockResolvedValue(mockDb);
    repository = new SQLitePatientRepository();
    (encryptionService.encrypt as jest.Mock).mockResolvedValue({
      toString: () => 'encrypted-value',
    });
    (encryptionService.decrypt as jest.Mock).mockResolvedValue(
      JSON.stringify({
        firstName: 'Anna',
        lastName: 'Test',
        birthDate: '2000-01-01',
        gender: 'other',
      }),
    );
    (EncryptedDataVO.fromString as jest.Mock).mockReturnValue({});
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // Helper to create a dummy patient purely for data checking
  // We manually construct the JSON structure the repository expects from patient.toJSON()
  const createMockPatient = (id = '123'): PatientEntity => {
    return {
      id,
      language: 'de',
      toJSON: () => ({
        id,
        encryptedData: {
          firstName: 'Max',
          lastName: 'Mustermann',
          birthDate: '1990-05-15',
          gender: 'male',
        },
        language: 'de',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
        gdprConsents: [],
        auditLog: [],
      }),
    } as unknown as PatientEntity;
  };

  it('should save a patient successfully', async () => {
    const patient = createMockPatient();
    mockExecuteSql.mockResolvedValueOnce([]); // Mock success result
    (getActiveEncryptionKey as jest.Mock).mockReturnValue('session-key');

    await repository.save(patient);

    expect(database.connect).toHaveBeenCalled();
    expect(mockExecuteSql).toHaveBeenCalledTimes(1);

    // Check SQL structure
    const lastCall = mockExecuteSql.mock.calls[0];
    expect(lastCall[0]).toContain('INSERT OR REPLACE INTO patients');

    // Check params
    const params = lastCall[1];
    expect(params[0]).toBe(patient.id);
    expect(params[2]).toBe('de');
    expect(typeof params[1]).toBe('string');
    expect(encryptionService.encrypt).toHaveBeenCalledTimes(1);
  });

  it('should throw when encryption key is missing on save', async () => {
    const patient = createMockPatient();
    (getActiveEncryptionKey as jest.Mock).mockReturnValue(null);

    await expect(repository.save(patient)).rejects.toThrow('Encryption key missing');
  });

  it('should return null if patient not found', async () => {
    const dbResult = {
      rows: {
        length: 0,
        item: () => null,
      },
    };

    mockExecuteSql.mockResolvedValueOnce([dbResult]);

    const result = await repository.findById('non-existent-id');
    expect(result).toBeNull();
  });

  it('should re-encrypt legacy plaintext data on read when key is available', async () => {
    const patientId = '11111111-1111-1111-1111-111111111111';
    const plaintext = {
      firstName: 'Anna',
      lastName: 'Muster',
      birthDate: '1985-02-02',
      gender: 'female',
    };

    const row = {
      id: patientId,
      encrypted_data: JSON.stringify(plaintext),
      language: 'de',
      created_at: new Date('2024-01-01').getTime(),
      updated_at: new Date('2024-01-02').getTime(),
      gdpr_consents: '[]',
      audit_log: '[]',
    };

    mockExecuteSql.mockResolvedValueOnce([
      {
        rows: {
          length: 1,
          item: () => row,
        },
      },
    ]);

    (getActiveEncryptionKey as jest.Mock).mockReturnValue('session-key');

    const result = await repository.findById(patientId);
    expect(result?.encryptedData.firstName).toBe('Anna');
    expect(encryptionService.encrypt).toHaveBeenCalledTimes(1);
    expect(mockExecuteSql).toHaveBeenCalledTimes(2);
    expect(mockExecuteSql.mock.calls[1][0]).toContain('UPDATE patients SET encrypted_data');
  });

  it('should mask encrypted data when no key is available', async () => {
    const patientId = '22222222-2222-2222-2222-222222222222';
    const row = {
      id: patientId,
      encrypted_data: 'ciphertext',
      language: 'de',
      created_at: new Date('2024-01-01').getTime(),
      updated_at: new Date('2024-01-02').getTime(),
      gdpr_consents: '[]',
      audit_log: '[]',
    };

    mockExecuteSql.mockResolvedValueOnce([
      {
        rows: {
          length: 1,
          item: () => row,
        },
      },
    ]);

    (getActiveEncryptionKey as jest.Mock).mockReturnValue(null);

    const result = await repository.findById(patientId);
    expect(result?.encryptedData.firstName).toBe('***');
    expect(result?.encryptedData.birthDate).toBe('****-**-**');
  });
});
