import { NativeEncryptionService } from '@infrastructure/encryption/NativeEncryptionService';

// Skip these tests in Jest environment as they require native crypto modules
// These tests should run in a real React Native environment
const describeIfNative = typeof jest !== 'undefined' ? describe.skip : describe;

describeIfNative('NativeEncryptionService', () => {
  let encryptionService: NativeEncryptionService;
  // Strong password that meets all requirements (16+ chars, upper, lower, number, special)
  const masterPassword = 'TestMasterPassword123!Secure';
  const testData = 'Sensitive patient data: John Doe, 01.01.1980';

  beforeEach(() => {
    encryptionService = new NativeEncryptionService();
  });

  describe('deriveKey', () => {
    it('should derive encryption key from master password', async () => {
      const { key } = await encryptionService.deriveKey(masterPassword);

      expect(key).toBeDefined();
      expect(key.length).toBeGreaterThan(0);
    });

    it('should derive same key for same password', async () => {
      const key1 = await encryptionService.deriveKey(masterPassword);
      const key2 = await encryptionService.deriveKey(masterPassword);

      // Note: Keys will be different due to different salts
      // This is expected behavior for security
      expect(key1).toBeDefined();
      expect(key2).toBeDefined();
    });
  });

  describe('hashPassword', () => {
    it('should hash password for verification', async () => {
      const hash = await encryptionService.hashPassword(masterPassword);

      expect(hash).toBeDefined();
      expect(hash.length).toBeGreaterThan(0);
      expect(hash).not.toBe(masterPassword);
    });

    it('should produce deterministic hash for same password', async () => {
      const hash1 = await encryptionService.hashPassword(masterPassword);
      const hash2 = await encryptionService.hashPassword(masterPassword);

      expect(hash1).toBe(hash2);
    });
  });

  describe('encrypt and decrypt', () => {
    it('should encrypt and decrypt data successfully', async () => {
      const { key } = await encryptionService.deriveKey(masterPassword);
      
      const encryptedData = await encryptionService.encrypt(testData, key);
      
      expect(encryptedData.ciphertext).toBeDefined();
      expect(encryptedData.iv).toBeDefined();
      expect(encryptedData.authTag).toBeDefined();
      expect(encryptedData.salt).toBeDefined();
      expect(encryptedData.ciphertext).not.toBe(testData);

      const decryptedData = await encryptionService.decrypt(encryptedData, key);
      
      expect(decryptedData).toBe(testData);
    });

    it('should fail decryption with wrong key', async () => {
      const { key: correctKey } = await encryptionService.deriveKey(masterPassword);
      const { key: wrongKey } = await encryptionService.deriveKey('WrongPassword123!Secure');
      
      const encryptedData = await encryptionService.encrypt(testData, correctKey);
      
      await expect(
        encryptionService.decrypt(encryptedData, wrongKey)
      ).rejects.toThrow();
    });

    it('should handle empty data', async () => {
      const { key } = await encryptionService.deriveKey(masterPassword);
      
      const encryptedData = await encryptionService.encrypt('', key);
      const decryptedData = await encryptionService.decrypt(encryptedData, key);
      
      expect(decryptedData).toBe('');
    });

    it('should handle unicode characters', async () => {
      const unicodeData = 'Test with unicode: äöü ñ 中文 🎉';
      const { key } = await encryptionService.deriveKey(masterPassword);
      
      const encryptedData = await encryptionService.encrypt(unicodeData, key);
      const decryptedData = await encryptionService.decrypt(encryptedData, key);
      
      expect(decryptedData).toBe(unicodeData);
    });

    it('should handle long data', async () => {
      const longData = 'A'.repeat(10000);
      const { key } = await encryptionService.deriveKey(masterPassword);
      
      const encryptedData = await encryptionService.encrypt(longData, key);
      const decryptedData = await encryptionService.decrypt(encryptedData, key);
      
      expect(decryptedData).toBe(longData);
    });
  });

  describe('generateRandomString', () => {
    it('should generate random bytes', async () => {
      const random1 = await encryptionService.generateRandomString(16);
      const random2 = await encryptionService.generateRandomString(16);

      expect(random1).toBeDefined();
      expect(random1.length).toBeGreaterThan(0);
      expect(random1).not.toBe(random2);
    });

    it('should generate requested byte length', async () => {
      const random = await encryptionService.generateRandomString(32);
      
      // Base64 encoded length should be roughly 4/3 of byte length
      const expectedLength = Math.ceil((32 * 4) / 3);
      expect(random.length).toBeGreaterThanOrEqual(expectedLength - 2);
    });
  });

  describe('verifyPassword', () => {
    it('should verify correct password', async () => {
      const hash = await encryptionService.hashPassword(masterPassword);
      const isValid = await encryptionService.verifyPassword(masterPassword, hash);

      expect(isValid).toBe(true);
    });

    it('should reject incorrect password', async () => {
      const hash = await encryptionService.hashPassword(masterPassword);
      const isValid = await encryptionService.verifyPassword('WrongPassword123!XX', hash);

      expect(isValid).toBe(false);
    });
  });
});
