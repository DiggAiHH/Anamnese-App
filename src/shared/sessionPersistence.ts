import AsyncStorage from '@react-native-async-storage/async-storage';
import { EncryptedDataVO } from '@domain/value-objects/EncryptedData';
import { encryptionService } from '@infrastructure/encryption/encryptionService';
import { getActiveEncryptionKey } from './keyManager';

const SESSION_KEY = 'active_session_v1';

export type ActiveSessionSnapshot = {
  patientId: string | null;
  questionnaireId: string | null;
  currentSectionIndex: number | null;
  updatedAt: number;
};

const normalizeSnapshot = (value: Partial<ActiveSessionSnapshot>): ActiveSessionSnapshot => {
  return {
    patientId: value.patientId ?? null,
    questionnaireId: value.questionnaireId ?? null,
    currentSectionIndex:
      typeof value.currentSectionIndex === 'number' ? value.currentSectionIndex : null,
    updatedAt: typeof value.updatedAt === 'number' ? value.updatedAt : Date.now(),
  };
};

export const loadActiveSession = async (): Promise<ActiveSessionSnapshot | null> => {
  try {
    const raw = await AsyncStorage.getItem(SESSION_KEY);
    if (!raw) return null;

    // Backward-compatible: allow legacy plaintext snapshot (no key required)
    if (raw.trim().startsWith('{')) {
      const parsed = JSON.parse(raw) as Partial<ActiveSessionSnapshot>;
      return normalizeSnapshot(parsed);
    }

    const key = getActiveEncryptionKey();
    if (!key) return null;

    const encrypted = EncryptedDataVO.fromString(raw);
    const json = await encryptionService.decrypt(encrypted, key);
    const parsed = JSON.parse(json) as Partial<ActiveSessionSnapshot>;
    return normalizeSnapshot(parsed);
  } catch {
    return null;
  }
};

export const saveActiveSession = async (
  partial: Partial<ActiveSessionSnapshot>,
): Promise<ActiveSessionSnapshot | null> => {
  try {
    const key = getActiveEncryptionKey();
    if (!key) return null;

    const existing = await loadActiveSession();
    const next = normalizeSnapshot({
      ...existing,
      ...partial,
      updatedAt: Date.now(),
    });
    const encrypted = await encryptionService.encrypt(JSON.stringify(next), key);
    await AsyncStorage.setItem(SESSION_KEY, encrypted.toString());
    return next;
  } catch {
    return null;
  }
};

export const clearActiveSession = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(SESSION_KEY);
  } catch {
    // ignore
  }
};
