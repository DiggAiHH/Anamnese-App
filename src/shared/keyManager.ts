import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Keychain from 'react-native-keychain';
import { logDebug, logError, logWarn } from './logger';
import { supportsSecureKeychain } from './platformCapabilities';

const KEYCHAIN_SERVICE = 'anamnese-app-key';
const OPT_IN_KEY = 'secure_key_opt_in_v1';

let activeKey: string | null = null;

export const getActiveEncryptionKey = (): string | null => activeKey;

export const isSecureKeyStorageAvailable = async (): Promise<boolean> => {
  if (!supportsSecureKeychain) return false;
  try {
    return typeof Keychain?.setGenericPassword === 'function';
  } catch {
    return false;
  }
};

export const getKeyOptIn = async (): Promise<boolean> => {
  try {
    const stored = await AsyncStorage.getItem(OPT_IN_KEY);
    return stored === 'true';
  } catch {
    return false;
  }
};

export const setKeyOptIn = async (value: boolean): Promise<void> => {
  try {
    await AsyncStorage.setItem(OPT_IN_KEY, value ? 'true' : 'false');
  } catch {
    // ignore
  }
};

export const setActiveEncryptionKey = async (
  key: string,
  options?: { persist?: boolean },
): Promise<void> => {
  activeKey = key;

  const shouldPersist = options?.persist === true;
  await setKeyOptIn(shouldPersist);

  if (!shouldPersist) {
    await clearPersistedEncryptionKey();
    return;
  }

  if (!(await isSecureKeyStorageAvailable())) {
    logWarn('Secure key storage not available; using RAM-only session key.');
    return;
  }

  try {
    await Keychain.setGenericPassword('anamnese', key, {
      service: KEYCHAIN_SERVICE,
      accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    });
    logDebug('Encryption key stored in secure storage.');
  } catch (error) {
    logError('Failed to persist encryption key securely', error);
  }
};

export const loadPersistedEncryptionKeyIfOptedIn = async (): Promise<string | null> => {
  const optedIn = await getKeyOptIn();
  if (!optedIn) return null;

  if (!(await isSecureKeyStorageAvailable())) {
    return null;
  }

  try {
    const creds = await Keychain.getGenericPassword({ service: KEYCHAIN_SERVICE });
    if (!creds || typeof creds.password !== 'string') return null;
    activeKey = creds.password;
    return creds.password;
  } catch (error) {
    logError('Failed to load encryption key from secure storage', error);
    return null;
  }
};

export const clearPersistedEncryptionKey = async (): Promise<void> => {
  try {
    if (!(await isSecureKeyStorageAvailable())) return;
    await Keychain.resetGenericPassword({ service: KEYCHAIN_SERVICE });
  } catch (error) {
    logError('Failed to clear persisted encryption key', error);
  }
};

export const clearActiveEncryptionKey = async (options?: {
  removePersisted?: boolean;
}): Promise<void> => {
  activeKey = null;
  if (options?.removePersisted) {
    await setKeyOptIn(false);
    await clearPersistedEncryptionKey();
  }
};
