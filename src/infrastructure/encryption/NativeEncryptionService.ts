/**
 * Native AES-256-GCM Encryption Service
 *
 * Verwendet react-native-quick-crypto für hardware-beschleunigte Verschlüsselung
 * DSGVO-konform: Alle Operationen lokal, keine externen APIs
 */

import { EncryptedDataVO } from '@domain/value-objects/EncryptedData';
import { IEncryptionService } from '@domain/repositories/IEncryptionService';
import {
  PBKDF2_ITERATIONS as SHARED_PBKDF2_ITERATIONS,
  validatePasswordStrength,
} from '@shared/SharedEncryptionBridge';

type QuickCryptoModule = {
  randomBytes: (size: number, cb: (err: unknown, buf: Buffer) => void) => void;
  pbkdf2: (
    password: string,
    salt: Buffer,
    iterations: number,
    keylen: number,
    digest: string,
    cb: (err: unknown, derivedKey: Buffer) => void,
  ) => void;
  createCipheriv: (
    algorithm: string,
    key: Buffer,
    iv: Buffer,
  ) => {
    update: (data: string, inputEncoding: BufferEncoding) => Buffer;
    final: () => Buffer;
    getAuthTag: () => Buffer;
  };
  createDecipheriv: (
    algorithm: string,
    key: Buffer,
    iv: Buffer,
  ) => {
    setAuthTag: (tag: Buffer) => void;
    update: (data: Buffer) => Buffer;
    final: () => Buffer;
  };
  createHash: (algorithm: string) => {
    update: (s: string) => void;
    digest: (enc: string) => string;
  };
};

function getQuickCryptoOrThrow(): QuickCryptoModule {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    return require('react-native-quick-crypto') as QuickCryptoModule;
  } catch {
    throw new Error(
      'Crypto provider is not available. react-native-quick-crypto native module was not found. ' +
        'On Windows, use the WebCrypto-based encryption provider instead.',
    );
  }
}

/**
 * Encryption Service Implementation
 */
export class NativeEncryptionService implements IEncryptionService {
  // Constants
  private readonly ALGORITHM = 'aes-256-gcm';
  private readonly KEY_LENGTH = 32; // 256 bit
  private readonly IV_LENGTH = 12; // Align with Web Crypto (96 bit)
  private readonly SALT_LENGTH = 16; // Align with shared web module (128 bit)
  private readonly PBKDF2_ITERATIONS = SHARED_PBKDF2_ITERATIONS;
  private readonly PBKDF2_HASH = 'sha256';

  /**
   * Master Key aus Passwort ableiten (PBKDF2)
   */
  async deriveKey(password: string, salt?: string): Promise<{ key: string; salt: string }> {
    this.ensurePasswordStrength(password);

    const qc = getQuickCryptoOrThrow();

    // Generate salt if not provided
    const saltBuffer = salt
      ? Buffer.from(salt, 'base64')
      : await this.generateRandomBytes(this.SALT_LENGTH);

    // Derive key using PBKDF2
    const keyBuffer = await new Promise<Buffer>((resolve, reject) => {
      qc.pbkdf2(
        password,
        saltBuffer,
        this.PBKDF2_ITERATIONS,
        this.KEY_LENGTH,
        this.PBKDF2_HASH,
        (err, derivedKey) => {
          if (err) reject(err);
          else resolve(derivedKey);
        },
      );
    });

    return {
      key: keyBuffer.toString('base64'),
      salt: saltBuffer.toString('base64'),
    };
  }

  /**
   * Daten verschlüsseln (AES-256-GCM)
   */
  async encrypt(data: string, key: string): Promise<EncryptedDataVO> {
    try {
      const qc = getQuickCryptoOrThrow();

      // Convert key from base64
      const keyBuffer = Buffer.from(key, 'base64');

      if (keyBuffer.length !== this.KEY_LENGTH) {
        throw new Error(`Invalid key length: expected ${this.KEY_LENGTH}, got ${keyBuffer.length}`);
      }

      // Generate random IV
      const iv = await this.generateRandomBytes(this.IV_LENGTH);

      // Create cipher
      const cipher = qc.createCipheriv(this.ALGORITHM, keyBuffer, iv);

      // Encrypt data
      const encryptedChunks: Buffer[] = [];
      encryptedChunks.push(cipher.update(data, 'utf8'));
      encryptedChunks.push(cipher.final());

      const ciphertext = Buffer.concat(encryptedChunks);

      // Get auth tag (GCM mode)
      const authTag = cipher.getAuthTag();

      // Generate salt (für EncryptedDataVO - wird später für Key Derivation verwendet)
      const salt = await this.generateRandomBytes(this.SALT_LENGTH);

      // Create EncryptedDataVO
      return EncryptedDataVO.create({
        ciphertext: ciphertext.toString('base64'),
        iv: iv.toString('base64'),
        authTag: authTag.toString('base64'),
        salt: salt.toString('base64'),
      });
    } catch (error) {
      throw new Error(
        `Encryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Daten entschlüsseln (AES-256-GCM)
   */
  async decrypt(encryptedData: EncryptedDataVO, key: string): Promise<string> {
    try {
      const qc = getQuickCryptoOrThrow();

      // Convert from base64
      const keyBuffer = Buffer.from(key, 'base64');
      const ciphertext = Buffer.from(encryptedData.ciphertext, 'base64');
      const iv = Buffer.from(encryptedData.iv, 'base64');
      const authTag = Buffer.from(encryptedData.authTag, 'base64');

      if (keyBuffer.length !== this.KEY_LENGTH) {
        throw new Error(`Invalid key length: expected ${this.KEY_LENGTH}, got ${keyBuffer.length}`);
      }

      // Create decipher
      const decipher = qc.createDecipheriv(this.ALGORITHM, keyBuffer, iv);

      // Set auth tag
      decipher.setAuthTag(authTag);

      // Decrypt data
      const decryptedChunks: Buffer[] = [];
      decryptedChunks.push(decipher.update(ciphertext));
      decryptedChunks.push(decipher.final());

      const plaintext = Buffer.concat(decryptedChunks);

      return plaintext.toString('utf8');
    } catch (error) {
      throw new Error(
        `Decryption failed: ${error instanceof Error ? error.message : 'Wrong key or corrupted data'}`,
      );
    }
  }

  /**
   * Passwort hashen (SHA-256)
   */
  async hashPassword(password: string): Promise<string> {
    const qc = getQuickCryptoOrThrow();
    const hash = qc.createHash('sha256');
    hash.update(password);
    return hash.digest('hex');
  }

  /**
   * Passwort verifizieren
   */
  async verifyPassword(password: string, hash: string): Promise<boolean> {
    const computedHash = await this.hashPassword(password);
    return computedHash === hash;
  }

  /**
   * Sicheren Random String generieren
   */
  async generateRandomString(length: number): Promise<string> {
    const buffer = await this.generateRandomBytes(length);
    return buffer.toString('base64');
  }

  /**
   * Random Bytes generieren (helper)
   */
  private async generateRandomBytes(length: number): Promise<Buffer> {
    const qc = getQuickCryptoOrThrow();
    return new Promise((resolve, reject) => {
      qc.randomBytes(length, (err, buffer) => {
        if (err) reject(err);
        else resolve(buffer);
      });
    });
  }

  private ensurePasswordStrength(password: string): void {
    const result = validatePasswordStrength(password);
    if (!result.valid) {
      throw new Error(`Password policy violation: ${result.errors.join('; ')}`);
    }
  }
}

/**
 * Singleton Instance
 */
