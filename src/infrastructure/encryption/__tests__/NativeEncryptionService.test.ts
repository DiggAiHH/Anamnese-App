import { NativeEncryptionService } from '../NativeEncryptionService';
import { EncryptedDataVO } from '../../../domain/value-objects/EncryptedData';

const BASE_SALT = Buffer.from('1234567890123456').toString('base64');

// Strong password that meets all requirements (16+ chars, upper, lower, number, special)
const STRONG_PASSWORD = 'TestPassword123!SecureEnough';

const asBufferLength = (base64Str: string): number => Buffer.from(base64Str, 'base64').length;

// Skip these tests in Jest environment as they require native crypto modules
// These tests should run in a real React Native environment
const describeIfNative = typeof jest !== 'undefined' ? describe.skip : describe;

describeIfNative('NativeEncryptionService', () => {
  let encryptionService: NativeEncryptionService;

  beforeEach(() => {
    encryptionService = new NativeEncryptionService();
  });

  describe('deriveKey', () => {
    it('should derive a 256-bit key from password', async () => {
      const { key, salt } = await encryptionService.deriveKey(STRONG_PASSWORD, BASE_SALT);

      expect(asBufferLength(key)).toBe(32);
      expect(salt).toBe(BASE_SALT);
    });

    it('should derive different keys for different passwords', async () => {
      const key1 = await encryptionService.deriveKey('StrongPassword123!A', BASE_SALT);
      const key2 = await encryptionService.deriveKey('StrongPassword123!B', BASE_SALT);

      expect(key1.key).not.toBe(key2.key);
    });

    it('should derive different keys for different salts', async () => {
      const salt1 = Buffer.from('salt1111111111111').toString('base64');
      const salt2 = Buffer.from('salt2222222222222').toString('base64');

      const key1 = await encryptionService.deriveKey(STRONG_PASSWORD, salt1);
      const key2 = await encryptionService.deriveKey(STRONG_PASSWORD, salt2);

      expect(key1.key).not.toBe(key2.key);
    });

    it('should derive same key for same password and salt', async () => {
      const first = await encryptionService.deriveKey(STRONG_PASSWORD, BASE_SALT);
      const second = await encryptionService.deriveKey(STRONG_PASSWORD, BASE_SALT);

      expect(first.key).toBe(second.key);
    });
  });

  describe('encrypt', () => {
    it('should encrypt plaintext data', async () => {
      const { key } = await encryptionService.deriveKey(STRONG_PASSWORD, BASE_SALT);
      const plaintext = 'Sensitive medical data';

      const encryptedData = await encryptionService.encrypt(plaintext, key);

      expect(encryptedData).toBeInstanceOf(EncryptedDataVO);
      expect(encryptedData.ciphertext).toBeDefined();
      expect(encryptedData.iv).toBeDefined();
      expect(encryptedData.authTag).toBeDefined();
      expect(encryptedData.salt).toBeDefined();
    });

    it('should produce different ciphertext for same plaintext (different IV)', async () => {
      const { key } = await encryptionService.deriveKey(STRONG_PASSWORD, BASE_SALT);
      const plaintext = 'Test data';

      const encrypted1 = await encryptionService.encrypt(plaintext, key);
      const encrypted2 = await encryptionService.encrypt(plaintext, key);

      expect(encrypted1.ciphertext).not.toBe(encrypted2.ciphertext);
      expect(encrypted1.iv).not.toBe(encrypted2.iv);
    });

    it('should encrypt unicode characters', async () => {
      const { key } = await encryptionService.deriveKey(STRONG_PASSWORD, BASE_SALT);
      const plaintext = 'Äöü ß 中文 日本語 العربية';

      const encryptedData = await encryptionService.encrypt(plaintext, key);

      expect(encryptedData).toBeInstanceOf(EncryptedDataVO);
    });
  });

  describe('decrypt', () => {
    it('should decrypt encrypted data correctly', async () => {
      const { key } = await encryptionService.deriveKey(STRONG_PASSWORD, BASE_SALT);
      const plaintext = 'Sensitive medical data';

      const encryptedData = await encryptionService.encrypt(plaintext, key);
      const decrypted = await encryptionService.decrypt(encryptedData, key);

      expect(decrypted).toBe(plaintext);
    });

    it('should throw error with wrong key', async () => {
      const key1 = await encryptionService.deriveKey('StrongPassword123!A', BASE_SALT);
      const key2 = await encryptionService.deriveKey('StrongPassword123!B', BASE_SALT);

      const plaintext = 'Secret data';
      const encryptedData = await encryptionService.encrypt(plaintext, key1.key);

      await expect(encryptionService.decrypt(encryptedData, key2.key)).rejects.toThrow();
    });

    it('should throw error with tampered ciphertext', async () => {
      const { key } = await encryptionService.deriveKey(STRONG_PASSWORD, BASE_SALT);
      const plaintext = 'Secret data';
      const encryptedData = await encryptionService.encrypt(plaintext, key);

      const tamperedData = EncryptedDataVO.create({
        ciphertext: Buffer.from('tampered').toString('base64'),
        iv: encryptedData.iv,
        authTag: encryptedData.authTag,
        salt: encryptedData.salt,
      });

      await expect(encryptionService.decrypt(tamperedData, key)).rejects.toThrow();
    });
  });

  describe('hashPassword', () => {
    it('should produce deterministic hashes', async () => {
      const hash1 = await encryptionService.hashPassword(STRONG_PASSWORD);
      const hash2 = await encryptionService.hashPassword(STRONG_PASSWORD);

      expect(hash1).toBe(hash2);
    });
  });

  describe('verifyPassword', () => {
    it('should verify correct password and reject wrong ones', async () => {
      const hash = await encryptionService.hashPassword(STRONG_PASSWORD);

      const isValid = await encryptionService.verifyPassword(STRONG_PASSWORD, hash);
      const isInvalid = await encryptionService.verifyPassword('WrongPassword123!XX', hash);

      expect(isValid).toBe(true);
      expect(isInvalid).toBe(false);
    });
  });

  describe('generateRandomString', () => {
    it('should generate base64 strings of requested byte length', async () => {
      const random = await encryptionService.generateRandomString(16);
      expect(typeof random).toBe('string');
      expect(Buffer.from(random, 'base64').length).toBe(16);
    });

    it('should generate different values on each call', async () => {
      const first = await encryptionService.generateRandomString(16);
      const second = await encryptionService.generateRandomString(16);

      expect(first).not.toBe(second);
    });
  });

  describe('encrypt/decrypt round-trip', () => {
    it('should preserve data integrity for diverse inputs', async () => {
      const dataset = ['Simple text', 'Äöü Special chars ß', '中文汉字', 'العربية', '日本語', '',
        JSON.stringify({ json: 'data', number: 123 }), 'Very long text '.repeat(20)];

      const { key } = await encryptionService.deriveKey(STRONG_PASSWORD, BASE_SALT);

      for (const plaintext of dataset) {
        const encrypted = await encryptionService.encrypt(plaintext, key);
        const decrypted = await encryptionService.decrypt(encrypted, key);
        expect(decrypted).toBe(plaintext);
      }
    });
  });

  describe('GDPR compliance', () => {
    it('should use PBKDF2 with 600,000 iterations', () => {
      expect((encryptionService as unknown as { PBKDF2_ITERATIONS: number }).PBKDF2_ITERATIONS)
        .toBe(600000);
    });
  });
});
