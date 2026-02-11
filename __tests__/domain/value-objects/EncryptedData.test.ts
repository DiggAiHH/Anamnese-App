/**
 * EncryptedData Value Object Tests
 *
 * @security Validates immutability, Zod schema enforcement, serialization round-trip.
 * DSGVO Art. 32: Security of processing — AES-256-GCM enforcement.
 */

import { EncryptedDataVO, EncryptedDataSchema } from '@domain/value-objects/EncryptedData';

describe('EncryptedDataVO', () => {
  const validParams = {
    ciphertext: 'Y2lwaGVydGV4dA==',
    iv: 'aXZiYXNlNjQ=',
    authTag: 'dGFnYmFzZTY0',
    salt: 'c2FsdGJhc2U2NA==',
  };

  describe('create()', () => {
    it('creates with AES-256-GCM defaults', () => {
      const vo = EncryptedDataVO.create(validParams);
      expect(vo.algorithm).toBe('aes-256-gcm');
      expect(vo.kdf.name).toBe('pbkdf2');
      expect(vo.kdf.iterations).toBe(600000);
      expect(vo.kdf.hash).toBe('sha256');
      expect(vo.encryptedAt).toBeInstanceOf(Date);
    });

    it('stores ciphertext, iv, authTag, salt immutably', () => {
      const vo = EncryptedDataVO.create(validParams);
      expect(vo.ciphertext).toBe(validParams.ciphertext);
      expect(vo.iv).toBe(validParams.iv);
      expect(vo.authTag).toBe(validParams.authTag);
      expect(vo.salt).toBe(validParams.salt);
    });
  });

  describe('equals()', () => {
    it('returns true for identical data', () => {
      const a = EncryptedDataVO.create(validParams);
      const b = EncryptedDataVO.create(validParams);
      expect(a.equals(b)).toBe(true);
    });

    it('returns false for different ciphertext', () => {
      const a = EncryptedDataVO.create(validParams);
      const b = EncryptedDataVO.create({ ...validParams, ciphertext: 'different' });
      expect(a.equals(b)).toBe(false);
    });
  });

  describe('toJSON() / fromJSON() round-trip', () => {
    it('serializes and deserializes without data loss', () => {
      const original = EncryptedDataVO.create(validParams);
      const json = original.toJSON();
      const restored = EncryptedDataVO.fromJSON(json);

      expect(restored.ciphertext).toBe(original.ciphertext);
      expect(restored.iv).toBe(original.iv);
      expect(restored.authTag).toBe(original.authTag);
      expect(restored.salt).toBe(original.salt);
      expect(restored.algorithm).toBe(original.algorithm);
      expect(restored.kdf).toEqual(original.kdf);
    });

    it('rejects invalid JSON via Zod schema', () => {
      expect(() => EncryptedDataVO.fromJSON({ ciphertext: 'x' })).toThrow();
      expect(() => EncryptedDataVO.fromJSON(null)).toThrow();
      expect(() => EncryptedDataVO.fromJSON({})).toThrow();
    });
  });

  describe('toString() / fromString() round-trip', () => {
    it('encodes to base64 and decodes back', () => {
      const original = EncryptedDataVO.create(validParams);
      const str = original.toString();
      expect(typeof str).toBe('string');

      const restored = EncryptedDataVO.fromString(str);
      expect(original.equals(restored)).toBe(true);
    });

    it('throws on invalid base64', () => {
      expect(() => EncryptedDataVO.fromString('not-valid-base64!!!')).toThrow();
    });
  });

  describe('EncryptedDataSchema', () => {
    it('enforces aes-256-gcm algorithm literal', () => {
      const valid = {
        ciphertext: 'ct',
        iv: 'iv',
        authTag: 'tag',
        salt: 'salt',
        algorithm: 'aes-256-gcm',
        kdf: { name: 'pbkdf2', iterations: 600000, hash: 'sha256' },
        encryptedAt: new Date(),
      };
      expect(() => EncryptedDataSchema.parse(valid)).not.toThrow();

      const invalid = { ...valid, algorithm: 'aes-128-cbc' };
      expect(() => EncryptedDataSchema.parse(invalid)).toThrow();
    });

    it('enforces pbkdf2 KDF literal', () => {
      const valid = {
        ciphertext: 'ct',
        iv: 'iv',
        authTag: 'tag',
        salt: 'salt',
        algorithm: 'aes-256-gcm',
        kdf: { name: 'pbkdf2', iterations: 600000, hash: 'sha256' },
        encryptedAt: new Date(),
      };
      const invalid = {
        ...valid,
        kdf: { name: 'scrypt', iterations: 600000, hash: 'sha256' },
      };
      expect(() => EncryptedDataSchema.parse(invalid)).toThrow();
    });
  });
});
