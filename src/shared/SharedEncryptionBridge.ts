import { webcrypto } from 'react-native-quick-crypto';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const SharedEncryption: SharedEncryptionModule = require('shared/encryption.js');

const runtimeCrypto = webcrypto ?? (globalThis as { crypto?: unknown } | undefined)?.crypto;

if (runtimeCrypto && typeof SharedEncryption.setCryptoProvider === 'function') {
  SharedEncryption.setCryptoProvider(runtimeCrypto);
}

export const PBKDF2_ITERATIONS = SharedEncryption.PBKDF2_ITERATIONS;

export const validatePasswordStrength = SharedEncryption.validatePasswordStrength;

export default SharedEncryption;
