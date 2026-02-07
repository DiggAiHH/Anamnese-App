import { Platform } from 'react-native';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const SharedEncryption: SharedEncryptionModule = require('shared/encryption.js');

type RuntimeWebCrypto = { subtle?: unknown; getRandomValues?: unknown };

function tryGetQuickCryptoWebcrypto(): RuntimeWebCrypto | null {
  // react-native-quick-crypto does not support Windows in many setups.
  if (Platform.OS === 'windows') return null;

  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const qc = require('react-native-quick-crypto') as { webcrypto?: RuntimeWebCrypto };
    return qc?.webcrypto ?? null;
  } catch {
    return null;
  }
}

const runtimeCrypto =
  tryGetQuickCryptoWebcrypto() ?? (globalThis as { crypto?: RuntimeWebCrypto } | undefined)?.crypto;

if (runtimeCrypto && typeof SharedEncryption.setCryptoProvider === 'function') {
  SharedEncryption.setCryptoProvider(runtimeCrypto);
}

export const PBKDF2_ITERATIONS = SharedEncryption.PBKDF2_ITERATIONS;

export const validatePasswordStrength = SharedEncryption.validatePasswordStrength;

export default SharedEncryption;
