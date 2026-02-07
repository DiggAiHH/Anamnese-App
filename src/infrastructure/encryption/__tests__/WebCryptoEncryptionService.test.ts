import { WebCryptoEncryptionService } from '../WebCryptoEncryptionService';

// Node/Jest environment has WebCrypto; ensure it's available as globalThis.crypto
// so the service can run in unit tests.
import { webcrypto } from 'crypto';

const globalWithCrypto = globalThis as unknown as { crypto?: Crypto };
if (!globalWithCrypto.crypto) {
  globalWithCrypto.crypto = webcrypto as unknown as Crypto;
}

describe('WebCryptoEncryptionService', () => {
  const service = new WebCryptoEncryptionService({ pbkdf2Iterations: 10_000 });

  it('derives a key and encrypts/decrypts roundtrip', async () => {
    const { key } = await service.deriveKey('StrongPassphrase123!');
    const encrypted = await service.encrypt('hello', key);
    const decrypted = await service.decrypt(encrypted, key);
    expect(decrypted).toBe('hello');
  });

  it('fails decrypt with wrong key', async () => {
    const { key: keyA } = await service.deriveKey('StrongPassphrase123!');
    const { key: keyB } = await service.deriveKey('OtherStrongPassphrase123!');

    const encrypted = await service.encrypt('hello', keyA);
    await expect(service.decrypt(encrypted, keyB)).rejects.toThrow(/Decryption failed/i);
  });

  it('rejects weak passwords (policy)', async () => {
    await expect(service.deriveKey('123')).rejects.toThrow(/Password policy violation/i);
  });
});
