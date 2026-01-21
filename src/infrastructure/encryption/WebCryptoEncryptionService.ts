/**
 * WebCrypto-based AES-256-GCM Encryption Service
 *
 * Uses a standards-based WebCrypto provider (globalThis.crypto) when available.
 * This is the preferred fallback for platforms where react-native-quick-crypto
 * is not available (e.g., React Native Windows).
 *
 * @security Uses PBKDF2 (SHA-256) for key derivation and AES-256-GCM for AEAD.
 */

import { EncryptedDataVO } from '@domain/value-objects/EncryptedData';
import { IEncryptionService } from '@domain/repositories/IEncryptionService';
import {
  PBKDF2_ITERATIONS as SHARED_PBKDF2_ITERATIONS,
  validatePasswordStrength,
} from '@shared/SharedEncryptionBridge';
import { Buffer } from 'buffer';
import { gcm } from '@noble/ciphers/aes';
import { pbkdf2 } from '@noble/hashes/pbkdf2';
import { sha256 } from '@noble/hashes/sha256';

type RuntimeCrypto = {
  subtle: SubtleCrypto;
  getRandomValues: (array: Uint8Array) => Uint8Array;
};

function getRuntimeCrypto(): RuntimeCrypto | null {
  const cryptoCandidate = (globalThis as { crypto?: unknown } | undefined)?.crypto as
    | Partial<RuntimeCrypto>
    | undefined;

  if (!cryptoCandidate?.subtle || !cryptoCandidate?.getRandomValues) {
    return null;
  }

  return cryptoCandidate as RuntimeCrypto;
}

function utf8ToBytes(str: string): Uint8Array {
  if (typeof TextEncoder !== 'undefined') {
    return new TextEncoder().encode(str);
  }
  return new Uint8Array(Buffer.from(str, 'utf8'));
}

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  const buffer = new ArrayBuffer(bytes.length);
  new Uint8Array(buffer).set(bytes);
  return buffer;
}

function getRandomBytes(length: number): Uint8Array {
  const cryptoCandidate = (globalThis as { crypto?: unknown } | undefined)?.crypto as
    | { getRandomValues?: (array: Uint8Array) => Uint8Array }
    | undefined;

  if (!cryptoCandidate?.getRandomValues) {
    throw new Error('Secure random generator is not available (crypto.getRandomValues missing).');
  }

  const out = new Uint8Array(length);
  cryptoCandidate.getRandomValues(out);
  return out;
}

function toBase64(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString('base64');
}

function fromBase64(base64: string): Uint8Array {
  return new Uint8Array(Buffer.from(base64, 'base64'));
}

function toHex(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString('hex');
}

export class WebCryptoEncryptionService implements IEncryptionService {
  private readonly KEY_LENGTH = 32; // 256-bit
  private readonly IV_LENGTH = 12; // 96-bit
  private readonly SALT_LENGTH = 16; // 128-bit
  private readonly PBKDF2_ITERATIONS: number;

  constructor(options?: { pbkdf2Iterations?: number }) {
    const candidate = options?.pbkdf2Iterations;
    this.PBKDF2_ITERATIONS =
      typeof candidate === 'number' && Number.isFinite(candidate) && candidate > 0
        ? Math.floor(candidate)
        : SHARED_PBKDF2_ITERATIONS;
  }

  async deriveKey(password: string, salt?: string): Promise<{ key: string; salt: string }> {
    this.ensurePasswordStrength(password);

    const webCrypto = getRuntimeCrypto();

    const saltBytes = salt ? fromBase64(salt) : getRandomBytes(this.SALT_LENGTH);

    const passwordBytes = utf8ToBytes(password);

    if (!webCrypto) {
      const derivedKey = pbkdf2(sha256, passwordBytes, saltBytes, {
        c: this.PBKDF2_ITERATIONS,
        dkLen: this.KEY_LENGTH,
      });

      return {
        key: toBase64(derivedKey),
        salt: toBase64(saltBytes),
      };
    }

    const baseKey = await webCrypto.subtle.importKey(
      'raw',
      toArrayBuffer(passwordBytes),
      { name: 'PBKDF2' },
      false,
      ['deriveBits'],
    );

    const bits = await webCrypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        hash: 'SHA-256',
        salt: toArrayBuffer(saltBytes),
        iterations: this.PBKDF2_ITERATIONS,
      },
      baseKey,
      this.KEY_LENGTH * 8,
    );

    return {
      key: toBase64(new Uint8Array(bits)),
      salt: toBase64(saltBytes),
    };
  }

  async encrypt(data: string, key: string): Promise<EncryptedDataVO> {
    try {
      const webCrypto = getRuntimeCrypto();

      const keyBytes = fromBase64(key);
      if (keyBytes.length !== this.KEY_LENGTH) {
        throw new Error(`Invalid key length: expected ${this.KEY_LENGTH}, got ${keyBytes.length}`);
      }

      const iv = getRandomBytes(this.IV_LENGTH);

      // NOTE: this salt is currently stored in EncryptedDataVO for compatibility.
      // It is not used for record-level key derivation in this implementation.
      const salt = getRandomBytes(this.SALT_LENGTH);

      const plaintextBytes = utf8ToBytes(data);

      if (!webCrypto) {
        const aes = gcm(keyBytes, iv);
        const full = aes.encrypt(plaintextBytes);

        if (full.length < 16) {
          throw new Error('Encryption failed: ciphertext too short');
        }

        const authTag = full.slice(full.length - 16);
        const ciphertext = full.slice(0, full.length - 16);

        return EncryptedDataVO.create({
          ciphertext: toBase64(ciphertext),
          iv: toBase64(iv),
          authTag: toBase64(authTag),
          salt: toBase64(salt),
        });
      }

      const cryptoKey = await webCrypto.subtle.importKey(
        'raw',
        toArrayBuffer(keyBytes),
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt'],
      );

      const encrypted = await webCrypto.subtle.encrypt(
        { name: 'AES-GCM', iv: toArrayBuffer(iv), tagLength: 128 },
        cryptoKey,
        toArrayBuffer(plaintextBytes),
      );

      const full = new Uint8Array(encrypted);
      if (full.length < 16) {
        throw new Error('Encryption failed: ciphertext too short');
      }

      const authTag = full.slice(full.length - 16);
      const ciphertext = full.slice(0, full.length - 16);

      return EncryptedDataVO.create({
        ciphertext: toBase64(ciphertext),
        iv: toBase64(iv),
        authTag: toBase64(authTag),
        salt: toBase64(salt),
      });
    } catch (error) {
      throw new Error(
        `Encryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  async decrypt(encryptedData: EncryptedDataVO, key: string): Promise<string> {
    try {
      const webCrypto = getRuntimeCrypto();

      const keyBytes = fromBase64(key);
      if (keyBytes.length !== this.KEY_LENGTH) {
        throw new Error(`Invalid key length: expected ${this.KEY_LENGTH}, got ${keyBytes.length}`);
      }

      const iv = fromBase64(encryptedData.iv);
      const ciphertext = fromBase64(encryptedData.ciphertext);
      const authTag = fromBase64(encryptedData.authTag);

      const combined = new Uint8Array(ciphertext.length + authTag.length);
      combined.set(ciphertext, 0);
      combined.set(authTag, ciphertext.length);

      if (!webCrypto) {
        const aes = gcm(keyBytes, iv);
        const plaintext = aes.decrypt(combined);
        return Buffer.from(plaintext).toString('utf8');
      }

      const cryptoKey = await webCrypto.subtle.importKey(
        'raw',
        toArrayBuffer(keyBytes),
        { name: 'AES-GCM', length: 256 },
        false,
        ['decrypt'],
      );

      const plaintext = await webCrypto.subtle.decrypt(
        { name: 'AES-GCM', iv: toArrayBuffer(iv), tagLength: 128 },
        cryptoKey,
        toArrayBuffer(combined),
      );

      return Buffer.from(new Uint8Array(plaintext)).toString('utf8');
    } catch (error) {
      throw new Error(
        `Decryption failed: ${error instanceof Error ? error.message : 'Wrong key or corrupted data'}`,
      );
    }
  }

  async hashPassword(password: string): Promise<string> {
    const webCrypto = getRuntimeCrypto();
    const input = utf8ToBytes(password);

    if (!webCrypto) {
      return toHex(sha256(input));
    }

    const digest = await webCrypto.subtle.digest('SHA-256', toArrayBuffer(input));
    return toHex(new Uint8Array(digest));
  }

  async verifyPassword(password: string, hash: string): Promise<boolean> {
    const computedHash = await this.hashPassword(password);
    return computedHash === hash;
  }

  async generateRandomString(length: number): Promise<string> {
    return toBase64(getRandomBytes(length));
  }

  private ensurePasswordStrength(password: string): void {
    const result = validatePasswordStrength(password);
    if (!result.valid) {
      throw new Error(`Password policy violation: ${result.errors.join('; ')}`);
    }
  }
}
