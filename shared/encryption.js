/*
 * Shared WebCrypto-based encryption module.
 *
 * This module is required at runtime by src/shared/SharedEncryptionBridge.ts via:
 *   require('shared/encryption.js')
 *
 * It is intentionally dependency-light and performs all crypto locally.
 */

const { Buffer } = require('buffer');

const PBKDF2_ITERATIONS = 600000;
const SALT_LENGTH = 16; // 128-bit
const IV_LENGTH = 12; // 96-bit (WebCrypto AES-GCM recommended)

/** @type {any} */
let cryptoProvider = null;

function getCrypto() {
  const candidate = cryptoProvider || (globalThis && globalThis.crypto);
  if (!candidate || !candidate.subtle) {
    throw new Error('WebCrypto provider is not available. Call setCryptoProvider() first.');
  }
  return candidate;
}

function toBase64(bytes) {
  return Buffer.from(bytes).toString('base64');
}

function fromBase64(base64) {
  return new Uint8Array(Buffer.from(base64, 'base64'));
}

function utf8ToBytes(str) {
  if (typeof TextEncoder !== 'undefined') {
    return new TextEncoder().encode(str);
  }
  // React Native should provide TextEncoder; if not, fail explicitly.
  throw new Error('TextEncoder is not available in this runtime.');
}

function validatePasswordStrength(password) {
  if (!password || typeof password !== 'string') {
    return { valid: false, errors: ['Password is required'] };
  }

  const errors = [];
  if (password.length < 16) errors.push('Password must be at least 16 characters');
  if (!/[A-Z]/.test(password)) errors.push('Password must contain uppercase letter');
  if (!/[a-z]/.test(password)) errors.push('Password must contain lowercase letter');
  if (!/[0-9]/.test(password)) errors.push('Password must contain number');
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain special character');
  }

  return { valid: errors.length === 0, errors };
}

function setCryptoProvider(provider) {
  cryptoProvider = provider;
}

async function deriveKey(password, salt /* Uint8Array */, options) {
  const cryptoImpl = (options && options.cryptoImpl) || null;
  if (cryptoImpl) setCryptoProvider(cryptoImpl);

  const crypto = getCrypto();
  const passwordBytes = utf8ToBytes(password);

  const baseKey = await crypto.subtle.importKey('raw', passwordBytes, { name: 'PBKDF2' }, false, [
    'deriveBits',
  ]);

  const bits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      hash: 'SHA-256',
      salt,
      iterations: PBKDF2_ITERATIONS,
    },
    baseKey,
    256,
  );

  return new Uint8Array(bits);
}

async function encryptData(plaintext, password, options) {
  const cryptoImpl = (options && options.cryptoImpl) || null;
  if (cryptoImpl) setCryptoProvider(cryptoImpl);

  if (!(options && options.skipValidation)) {
    const result = validatePasswordStrength(password);
    if (!result.valid) {
      throw new Error(`Password policy violation: ${result.errors.join('; ')}`);
    }
  }

  const crypto = getCrypto();
  const salt = new Uint8Array(SALT_LENGTH);
  crypto.getRandomValues(salt);

  const iv = new Uint8Array(IV_LENGTH);
  crypto.getRandomValues(iv);

  const keyBytes = await deriveKey(password, salt);
  const key = await crypto.subtle.importKey(
    'raw',
    keyBytes,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt'],
  );

  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    utf8ToBytes(plaintext),
  );

  const payload = {
    v: 1,
    alg: 'AES-256-GCM',
    salt: toBase64(salt),
    iv: toBase64(iv),
    data: toBase64(new Uint8Array(ciphertext)),
  };

  return toBase64(Buffer.from(JSON.stringify(payload), 'utf8'));
}

async function decryptData(encryptedBase64, password, options) {
  const cryptoImpl = (options && options.cryptoImpl) || null;
  if (cryptoImpl) setCryptoProvider(cryptoImpl);

  const crypto = getCrypto();
  const payloadJson = Buffer.from(encryptedBase64, 'base64').toString('utf8');
  const payload = JSON.parse(payloadJson);

  if (!payload || payload.v !== 1) {
    throw new Error('Unsupported encrypted payload format');
  }

  const salt = fromBase64(payload.salt);
  const iv = fromBase64(payload.iv);
  const data = fromBase64(payload.data);

  const keyBytes = await deriveKey(password, salt);
  const key = await crypto.subtle.importKey(
    'raw',
    keyBytes,
    { name: 'AES-GCM', length: 256 },
    false,
    ['decrypt'],
  );

  const plaintextBytes = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, data);

  return Buffer.from(new Uint8Array(plaintextBytes)).toString('utf8');
}

module.exports = {
  PBKDF2_ITERATIONS,
  setCryptoProvider,
  validatePasswordStrength,
  deriveKey,
  encryptData,
  decryptData,
};
