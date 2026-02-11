/**
 * User Entity - Therapeut/Patient Authentication
 *
 * @security Passwords stored as PBKDF2 hashes only.
 * @gdpr PII (email, name) encrypted at rest. No PII in logs.
 */

import { z } from 'zod';

export type UserRole = 'therapist' | 'patient';

export const UserSchema = z.object({
  id: z.string().uuid(),
  role: z.enum(['therapist', 'patient']),
  email: z.string().email(),
  /** PBKDF2-derived hash — never stored in plaintext */
  passwordHash: z.string(),
  /** TOTP secret for 2FA — encrypted at rest */
  totpSecret: z.string().optional(),
  /** Whether 2FA is enabled and verified */
  is2FAEnabled: z.boolean().default(false),
  displayName: z.string(),
  createdAt: z.date(),
  lastLoginAt: z.date().optional(),
  /** Failed login attempts (brute-force protection) */
  failedAttempts: z.number().default(0),
  /** Account lockout timestamp */
  lockedUntil: z.date().optional(),
});

export type UserEntity = z.infer<typeof UserSchema>;

export const createUser = (
  role: UserRole,
  email: string,
  passwordHash: string,
  displayName: string,
): UserEntity => ({
  id: crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`,
  role,
  email,
  passwordHash,
  displayName,
  is2FAEnabled: false,
  failedAttempts: 0,
  createdAt: new Date(),
});
