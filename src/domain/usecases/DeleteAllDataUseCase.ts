/**
 * DeleteAllDataUseCase
 * GDPR Article 17: Right to Erasure ("Right to be Forgotten")
 *
 * Use Case for securely removing all patient data and app state from the device.
 * 
 * Strategy:
 * 1. Wipe Local Database (SQLite) containing all clinical data.
 * 2. Wipe AsyncStorage containing preferences and cache.
 * 3. The caller is responsible for resetting any in-memory state (Zustand/Context).
 *
 * @security Critical functionality. Ensures data is irretrievable.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { database } from '@infrastructure/persistence/DatabaseConnection';

export class DeleteAllDataUseCase {
  /**
   * Executes the deletion of all persistent data.
   * 
   * @throws Error if deletion fails (caller should handle and retry/alert).
   */
  async execute(): Promise<void> {
    try {
      // 1. Wipe SQLite Database Tables
      // This removes Patients, Questionnaires, Answers, Documents, Consents
      await database.deleteAllData();

      // 2. Wipe Key-Value Storage (AsyncStorage)
      // This removes preferences, potential cached keys, or other flags
      await AsyncStorage.clear();
    } catch (error) {
      throw new Error('Failed to delete all data. Device storage might be compromised or busy.');
    }
  }
}
