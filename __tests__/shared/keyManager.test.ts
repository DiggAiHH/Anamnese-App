/**
 * @fileoverview Unit tests for keyManager
 * @security Ensures secure storage opt-in behavior without leaking keys
 */

type KeychainMock = {
  setGenericPassword: jest.Mock;
  getGenericPassword: jest.Mock;
  resetGenericPassword: jest.Mock;
  ACCESSIBLE: { WHEN_UNLOCKED_THIS_DEVICE_ONLY: string };
};

const buildKeyManager = (os: 'ios' | 'android' | 'windows' | 'macos') => {
  const keychain: KeychainMock = {
    setGenericPassword: jest.fn(),
    getGenericPassword: jest.fn(),
    resetGenericPassword: jest.fn(),
    ACCESSIBLE: { WHEN_UNLOCKED_THIS_DEVICE_ONLY: 'DEVICE_ONLY' },
  };

  jest.resetModules();
  jest.doMock('react-native', () => {
    return {
      Platform: { OS: os },
    };
  });
  jest.doMock('react-native-keychain', () => keychain);

  let module!: typeof import('../../src/shared/keyManager');
  let storage!: typeof import('@react-native-async-storage/async-storage').default;
  jest.isolateModules(() => {
    const storageModule = require('@react-native-async-storage/async-storage');
    storage = (storageModule.default ??
      storageModule) as typeof import('@react-native-async-storage/async-storage').default;

    module = require('../../src/shared/keyManager');
  });

  return {
    keychain,
    storage,
    ...(module as typeof import('../../src/shared/keyManager')),
  };
};

describe('keyManager', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns false for secure storage on windows', async () => {
    const { isSecureKeyStorageAvailable } = buildKeyManager('windows');
    await expect(isSecureKeyStorageAvailable()).resolves.toBe(false);
  });

  it('returns true for secure storage on macOS', async () => {
    const { isSecureKeyStorageAvailable } = buildKeyManager('macos');
    await expect(isSecureKeyStorageAvailable()).resolves.toBe(true);
  });

  it('persists key when user opts in and secure storage is available', async () => {
    const { keychain, setActiveEncryptionKey, storage } = buildKeyManager('ios');

    (storage.setItem as jest.Mock).mockResolvedValue(undefined);

    await setActiveEncryptionKey('session-key', { persist: true });

    expect(storage.setItem).toHaveBeenCalledWith('secure_key_opt_in_v1', 'true');
    expect(keychain.setGenericPassword).toHaveBeenCalledWith(
      'anamnese',
      'session-key',
      expect.objectContaining({ service: 'anamnese-app-key' }),
    );
  });

  it('loads persisted key only when opted in', async () => {
    const { keychain, loadPersistedEncryptionKeyIfOptedIn, getActiveEncryptionKey, storage } =
      buildKeyManager('ios');

    (storage.getItem as jest.Mock).mockResolvedValue('true');
    keychain.getGenericPassword.mockResolvedValue({ password: 'stored-key' });

    const key = await loadPersistedEncryptionKeyIfOptedIn();

    expect(key).toBe('stored-key');
    expect(getActiveEncryptionKey()).toBe('stored-key');
  });

  it('clears persisted key when opt-in is disabled', async () => {
    const { keychain, setActiveEncryptionKey, storage } = buildKeyManager('ios');

    (storage.setItem as jest.Mock).mockResolvedValue(undefined);

    await setActiveEncryptionKey('session-key', { persist: false });

    expect(storage.setItem).toHaveBeenCalledWith('secure_key_opt_in_v1', 'false');
    expect(keychain.resetGenericPassword).toHaveBeenCalledWith({ service: 'anamnese-app-key' });
  });
});
