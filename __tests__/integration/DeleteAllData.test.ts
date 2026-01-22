import { DeleteAllDataUseCase } from '../../src/domain/usecases/DeleteAllDataUseCase';
import { database } from '../../src/infrastructure/persistence/DatabaseConnection';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock dependencies
jest.mock('../../src/infrastructure/persistence/DatabaseConnection', () => ({
  database: {
    deleteAllData: jest.fn(),
  },
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  clear: jest.fn(),
}));

describe('DeleteAllDataUseCase Integration', () => {
  let useCase: DeleteAllDataUseCase;

  beforeEach(() => {
    useCase = new DeleteAllDataUseCase();
    jest.clearAllMocks();
  });

  it('should successfully invoke all deletion methods', async () => {
    await useCase.execute();

    // Verify SQLite deletion was called
    expect(database.deleteAllData).toHaveBeenCalledTimes(1);

    // Verify AsyncStorage clearing was called
    expect(AsyncStorage.clear).toHaveBeenCalledTimes(1);
  });

  it('should propagate errors if deletion fails', async () => {
    (database.deleteAllData as jest.Mock).mockRejectedValue(new Error('DB Locked'));

    await expect(useCase.execute()).rejects.toThrow('Failed to delete all data');
  });
});
