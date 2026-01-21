/**
 * @fileoverview Unit tests for sessionPersistence
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  clearActiveSession,
  loadActiveSession,
  saveActiveSession,
} from '../../src/shared/sessionPersistence';

describe('sessionPersistence', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('saves and normalizes active session snapshot', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);

    const snapshot = await saveActiveSession({
      patientId: 'patient-1',
      currentSectionIndex: 2,
    });

    expect(snapshot?.patientId).toBe('patient-1');
    expect(snapshot?.questionnaireId).toBeNull();
    expect(snapshot?.currentSectionIndex).toBe(2);
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      'active_session_v1',
      expect.any(String),
    );
  });

  it('returns null when stored snapshot is invalid', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue('not-json');

    const result = await loadActiveSession();

    expect(result).toBeNull();
  });

  it('clears session snapshot', async () => {
    (AsyncStorage.removeItem as jest.Mock).mockResolvedValue(undefined);

    await clearActiveSession();

    expect(AsyncStorage.removeItem).toHaveBeenCalledWith('active_session_v1');
  });
});
