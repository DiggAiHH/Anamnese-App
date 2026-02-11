/**
 * DeleteAllDataUseCase Unit Tests
 *
 * DSGVO Art. 17: Right to Erasure ("Right to be Forgotten")
 * Verifies that execute() wipes both SQLite and AsyncStorage.
 *
 * @security Critical: Must prove all data stores are cleared.
 */

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: { clear: jest.fn(() => Promise.resolve()) },
}));

jest.mock('@infrastructure/persistence/DatabaseConnection', () => ({
  database: { deleteAllData: jest.fn(() => Promise.resolve()) },
}));

import { DeleteAllDataUseCase } from '@application/use-cases/DeleteAllDataUseCase';

// Obtain mock references via requireMock (immune to hoisting issues)
const getMocks = () => {
  const { database } = jest.requireMock('@infrastructure/persistence/DatabaseConnection') as {
    database: { deleteAllData: jest.Mock };
  };
  const asyncStorage = jest.requireMock('@react-native-async-storage/async-storage') as {
    default: { clear: jest.Mock };
  };
  return { mockDeleteAllData: database.deleteAllData, mockClear: asyncStorage.default.clear };
};

describe('DeleteAllDataUseCase', () => {
  let useCase: DeleteAllDataUseCase;

  beforeEach(() => {
    const { mockDeleteAllData, mockClear } = getMocks();
    mockDeleteAllData.mockReset().mockResolvedValue(undefined);
    mockClear.mockReset().mockResolvedValue(undefined);
    useCase = new DeleteAllDataUseCase();
  });

  describe('execute() — DSGVO Art. 17', () => {
    it('calls database.deleteAllData() to wipe SQLite', async () => {
      await useCase.execute();
      expect(getMocks().mockDeleteAllData).toHaveBeenCalledTimes(1);
    });

    it('calls AsyncStorage.clear() to wipe key-value storage', async () => {
      await useCase.execute();
      expect(getMocks().mockClear).toHaveBeenCalledTimes(1);
    });

    it('wipes SQLite before AsyncStorage (order matters)', async () => {
      const { mockDeleteAllData, mockClear } = getMocks();
      const callOrder: string[] = [];
      mockDeleteAllData.mockImplementation(() => {
        callOrder.push('sqlite');
        return Promise.resolve();
      });
      mockClear.mockImplementation(() => {
        callOrder.push('asyncstorage');
        return Promise.resolve();
      });

      await useCase.execute();
      expect(callOrder).toEqual(['sqlite', 'asyncstorage']);
    });

    it('throws descriptive error when SQLite deletion fails', async () => {
      getMocks().mockDeleteAllData.mockRejectedValueOnce(new Error('disk full'));
      await expect(useCase.execute()).rejects.toThrow(
        'Failed to delete all data. Device storage might be compromised or busy.',
      );
    });

    it('throws descriptive error when AsyncStorage fails', async () => {
      getMocks().mockClear.mockRejectedValueOnce(new Error('permission denied'));
      await expect(useCase.execute()).rejects.toThrow(
        'Failed to delete all data. Device storage might be compromised or busy.',
      );
    });

    it('succeeds when both stores clear without error', async () => {
      await expect(useCase.execute()).resolves.toBeUndefined();
    });
  });
});
