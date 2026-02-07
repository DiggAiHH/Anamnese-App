/**
 * @fileoverview Unit tests for sessionPersistence
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { EncryptedDataVO } from '../../src/domain/value-objects/EncryptedData';
import { encryptionService } from '../../src/infrastructure/encryption/encryptionService';
import { getActiveEncryptionKey } from '../../src/shared/keyManager';
import {
  clearActiveSession,
  loadActiveSession,
  saveActiveSession,
} from '../../src/shared/sessionPersistence';

jest.mock('../../src/shared/keyManager', () => ({
  getActiveEncryptionKey: jest.fn(),
}));

jest.mock('../../src/infrastructure/encryption/encryptionService', () => ({
  encryptionService: {
    encrypt: jest.fn(),
    decrypt: jest.fn(),
  },
}));

describe('sessionPersistence', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('saves and normalizes active session snapshot (encrypted)', async () => {
    (getActiveEncryptionKey as jest.Mock).mockReturnValue('key');
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);

    const encrypted = EncryptedDataVO.create({
      ciphertext: 'ciphertext',
      iv: 'iv',
      authTag: 'authTag',
      salt: 'salt',
    });
    (encryptionService.encrypt as jest.Mock).mockResolvedValue(encrypted);

    const snapshot = await saveActiveSession({
      patientId: 'patient-1',
      currentSectionIndex: 2,
    });

    expect(snapshot?.patientId).toBe('patient-1');
    expect(snapshot?.questionnaireId).toBeNull();
    expect(snapshot?.currentSectionIndex).toBe(2);
    expect(AsyncStorage.setItem).toHaveBeenCalledWith('active_session_v1', encrypted.toString());
  });

  it('returns null when no active key is available for save', async () => {
    (getActiveEncryptionKey as jest.Mock).mockReturnValue(null);

    const snapshot = await saveActiveSession({
      patientId: 'patient-1',
    });

    expect(snapshot).toBeNull();
    expect(AsyncStorage.setItem).not.toHaveBeenCalled();
  });

  it('loads encrypted snapshot when key is available', async () => {
    (getActiveEncryptionKey as jest.Mock).mockReturnValue('key');

    const encrypted = EncryptedDataVO.create({
      ciphertext: 'ciphertext',
      iv: 'iv',
      authTag: 'authTag',
      salt: 'salt',
    });

    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(encrypted.toString());
    (encryptionService.decrypt as jest.Mock).mockResolvedValue(
      JSON.stringify({ patientId: 'patient-2', currentSectionIndex: 1 }),
    );

    const result = await loadActiveSession();

    expect(result?.patientId).toBe('patient-2');
    expect(result?.questionnaireId).toBeNull();
    expect(result?.currentSectionIndex).toBe(1);
  });

  it('loads legacy plaintext snapshot without encryption key', async () => {
    (getActiveEncryptionKey as jest.Mock).mockReturnValue(null);
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
      JSON.stringify({ patientId: 'patient-legacy', currentSectionIndex: 0 }),
    );

    const result = await loadActiveSession();

    expect(result?.patientId).toBe('patient-legacy');
    expect(result?.currentSectionIndex).toBe(0);
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
