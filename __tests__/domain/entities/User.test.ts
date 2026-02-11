/**
 * Unit Tests: User Entity
 * @security Validates UserSchema, createUser factory, role constraints.
 */
import { createUser, UserSchema, type UserEntity } from '../../../src/domain/entities/User';

describe('User Entity', () => {
  const validUser: UserEntity = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    role: 'therapist',
    email: 'dr.mueller@example.com',
    passwordHash: 'pbkdf2-derived-hash-string',
    displayName: 'Dr. Müller',
    is2FAEnabled: false,
    failedAttempts: 0,
    createdAt: new Date(),
  };

  describe('UserSchema', () => {
    it('validates a correct therapist user', () => {
      const result = UserSchema.safeParse(validUser);
      expect(result.success).toBe(true);
    });

    it('validates a correct patient user', () => {
      const patient = { ...validUser, role: 'patient' as const };
      const result = UserSchema.safeParse(patient);
      expect(result.success).toBe(true);
    });

    it('rejects invalid role', () => {
      const bad = { ...validUser, role: 'admin' };
      const result = UserSchema.safeParse(bad);
      expect(result.success).toBe(false);
    });

    it('rejects invalid email', () => {
      const bad = { ...validUser, email: 'not-an-email' };
      const result = UserSchema.safeParse(bad);
      expect(result.success).toBe(false);
    });

    it('accepts optional totpSecret', () => {
      const withTotp = { ...validUser, totpSecret: 'ABCDEFGHIJKLMNOP' };
      const result = UserSchema.safeParse(withTotp);
      expect(result.success).toBe(true);
    });

    it('accepts optional lockedUntil', () => {
      const locked = { ...validUser, lockedUntil: new Date() };
      const result = UserSchema.safeParse(locked);
      expect(result.success).toBe(true);
    });
  });

  describe('createUser', () => {
    it('creates a therapist with correct defaults', () => {
      const user = createUser('therapist', 'test@example.com', 'hash123', 'Dr. Test');
      expect(user.role).toBe('therapist');
      expect(user.email).toBe('test@example.com');
      expect(user.passwordHash).toBe('hash123');
      expect(user.displayName).toBe('Dr. Test');
      expect(user.is2FAEnabled).toBe(false);
      expect(user.failedAttempts).toBe(0);
      expect(user.id).toBeDefined();
      expect(user.createdAt).toBeInstanceOf(Date);
    });

    it('creates a patient user', () => {
      const user = createUser('patient', 'patient@example.com', 'hash456', 'Max Mustermann');
      expect(user.role).toBe('patient');
    });

    it('generates unique IDs', () => {
      const u1 = createUser('therapist', 'a@b.com', 'h', 'A');
      const u2 = createUser('therapist', 'c@d.com', 'h', 'B');
      expect(u1.id).not.toBe(u2.id);
    });
  });
});
