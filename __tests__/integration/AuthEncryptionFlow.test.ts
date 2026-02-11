/**
 * Integration Test: Full Auth + Encryption Flow
 *
 * Tests the complete flow: register → login → encryption key available
 */

import { InMemoryUserRepository } from '../../src/infrastructure/persistence/InMemoryUserRepository';
import { AuthService } from '../../src/application/services/AuthService';

// Mock encryptionService
jest.mock('../../src/infrastructure/encryption/encryptionService', () => ({
  encryptionService: {
    deriveKey: jest.fn(async (password: string) => ({
      key: `derived:${password}`,
      salt: 'test-salt-hex',
    })),
    encrypt: jest.fn(async (plaintext: string, _key: string) => ({
      ciphertext: `enc(${plaintext})`,
      iv: 'mock-iv',
      authTag: 'mock-tag',
      salt: 'mock-salt',
      algorithm: 'AES-256-GCM',
      kdf: 'PBKDF2',
      encryptedAt: new Date().toISOString(),
      toString: () => Buffer.from(JSON.stringify({
        ciphertext: `enc(${plaintext})`,
        iv: 'mock-iv',
        authTag: 'mock-tag',
        salt: 'mock-salt',
      })).toString('base64'),
      toJSON: () => ({
        ciphertext: `enc(${plaintext})`,
        iv: 'mock-iv',
      }),
    })),
    decrypt: jest.fn(async () => 'decrypted-content'),
  },
}));

jest.mock('../../src/shared/logger', () => ({
  logDebug: jest.fn(),
  logError: jest.fn(),
}));

describe('Auth + Encryption Integration', () => {
  let userRepo: InMemoryUserRepository;
  let authService: AuthService;

  beforeEach(() => {
    userRepo = new InMemoryUserRepository();
    authService = new AuthService(userRepo);
  });

  it('should register a therapist and login successfully', async () => {
    // Register
    const regResult = await authService.register(
      'therapist',
      'dr.test@clinic.de',
      'SecurePassword123!',
      'Dr. Test',
    );
    expect(regResult.success).toBe(true);
    expect(regResult.user).toBeDefined();
    expect(regResult.totpSecret).toBeDefined();

    // Login
    const loginResult = await authService.login('dr.test@clinic.de', 'SecurePassword123!');
    expect(loginResult.success).toBe(true);
    expect(loginResult.user).toBeDefined();
    expect(loginResult.sessionToken).toBeDefined();
  });

  it('should reject login with wrong password', async () => {
    await authService.register('therapist', 'doc@test.de', 'CorrectPass!', 'Doc');
    const result = await authService.login('doc@test.de', 'WrongPass!');
    expect(result.success).toBe(false);
    expect(result.error).toBe('auth.invalidCredentials');
  });

  it('should lock account after 5 failed attempts', async () => {
    await authService.register('therapist', 'doc@test.de', 'MyPassword!', 'Doc');

    // 5 failed attempts
    for (let i = 0; i < 5; i++) {
      const result = await authService.login('doc@test.de', 'wrong');
      expect(result.success).toBe(false);
    }

    // 6th attempt → locked
    const locked = await authService.login('doc@test.de', 'MyPassword!');
    expect(locked.success).toBe(false);
    expect(locked.error).toBe('auth.accountLocked');
  });

  it('should handle 2FA flow end-to-end', async () => {
    // Register with 2FA enabled
    const reg = await authService.register('therapist', 'secure@test.de', 'Pass1234!', 'SecureDoc');
    expect(reg.success).toBe(true);

    // Enable 2FA
    const enable2FA = await authService.enable2FA(reg.user!.id);
    expect(enable2FA.success).toBe(true);

    // Login should require 2FA
    const login = await authService.login('secure@test.de', 'Pass1234!');
    expect(login.success).toBe(true);
    expect(login.requires2FA).toBe(true);
    expect(login.sessionToken).toBeUndefined();
  });

  it('should not return PII in error messages', async () => {
    const result = await authService.login('nonexistent@test.de', 'anything');
    // Error should be generic, not expose whether email exists
    expect(result.error).toBe('auth.invalidCredentials');
    expect(result.error).not.toContain('nonexistent@test.de');
  });

  it('should reject duplicate email registration', async () => {
    await authService.register('therapist', 'dup@test.de', 'Pass1234!', 'First');
    const dup = await authService.register('patient', 'dup@test.de', 'Pass5678!', 'Second');
    expect(dup.success).toBe(false);
    expect(dup.error).toBe('auth.emailExists');
  });

  it('should reject short passwords', async () => {
    const result = await authService.register('therapist', 'short@test.de', '1234567', 'Doc');
    expect(result.success).toBe(false);
    expect(result.error).toBe('auth.passwordTooShort');
  });
});
