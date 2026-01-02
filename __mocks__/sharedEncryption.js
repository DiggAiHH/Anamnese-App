/**
 * Mock for shared/encryption.js module
 * Used in tests to avoid loading the actual shared encryption module
 */

const PBKDF2_ITERATIONS = 600000;

const validatePasswordStrength = (password) => {
  if (!password || typeof password !== 'string') {
    return { valid: false, errors: ['Password is required'] };
  }
  
  const errors = [];
  if (password.length < 16) {
    errors.push('Password must be at least 16 characters');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain uppercase letter');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain lowercase letter');
  }
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain number');
  }
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain special character');
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
};

const encrypt = async (plaintext, key) => {
  // Simple mock encryption - just base64 encode for testing
  const iv = Buffer.from('0123456789abcdef').toString('base64');
  const salt = Buffer.from('saltvalue1234567').toString('base64');
  const ciphertext = Buffer.from(plaintext).toString('base64');
  const authTag = Buffer.from('authtag123456789').toString('base64');
  
  return {
    ciphertext,
    iv,
    salt,
    authTag,
    algorithm: 'AES-256-GCM',
    version: '1.0',
  };
};

const decrypt = async (encryptedData, key) => {
  // Simple mock decryption - just base64 decode for testing
  return Buffer.from(encryptedData.ciphertext, 'base64').toString('utf-8');
};

const deriveKey = async (password, salt) => {
  // Return mock key
  return Buffer.from('mockderivedkey01234567890123456').toString('base64');
};

const generateRandomBytes = (length) => {
  const bytes = new Uint8Array(length);
  for (let i = 0; i < length; i++) {
    bytes[i] = Math.floor(Math.random() * 256);
  }
  return bytes;
};

let cryptoProvider = null;

const setCryptoProvider = (provider) => {
  cryptoProvider = provider;
};

const getCryptoProvider = () => {
  return cryptoProvider;
};

module.exports = {
  PBKDF2_ITERATIONS,
  validatePasswordStrength,
  encrypt,
  decrypt,
  deriveKey,
  generateRandomBytes,
  setCryptoProvider,
  getCryptoProvider,
};
