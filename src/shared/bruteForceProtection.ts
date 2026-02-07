/**
 * Brute-Force Protection Service
 *
 * BSI IT-Grundschutz ORP.4: Protection against brute-force attacks
 * on the master password entry.
 *
 * Strategy:
 * - Track failed attempts in memory (not persisted – reset on app restart).
 * - Exponential backoff: 2^(attempts-maxFree) seconds, capped at 5 minutes.
 * - Hard lockout after maxAttempts (default: 10), requiring app restart.
 * - Audit logging of all failed attempts and lockouts (no PII).
 *
 * @security This is a mandatory control for BSI APP.3.1 compliance
 *           when processing health data (DSGVO Art. 9).
 */

import { logEvent, LogLevel, LogEventId } from './logger';

/** BSI ORP.4 defaults */
const DEFAULT_MAX_FREE_ATTEMPTS = 3;
const DEFAULT_MAX_ATTEMPTS = 10;
const DEFAULT_MAX_BACKOFF_MS = 5 * 60 * 1000; // 5 minutes
const BASE_BACKOFF_MS = 1_000; // 1 second

export interface BruteForceConfig {
  /** Attempts before backoff kicks in. Default: 3. */
  maxFreeAttempts?: number;
  /** Total attempts before hard lockout. Default: 10. */
  maxAttempts?: number;
  /** Maximum backoff duration in ms. Default: 300_000 (5 min). */
  maxBackoffMs?: number;
}

export interface BruteForceState {
  /** Number of consecutive failed attempts. */
  failedAttempts: number;
  /** Whether the account is hard-locked (requires app restart). */
  isLocked: boolean;
  /** Remaining lockout time in ms (0 if no lockout active). */
  remainingLockoutMs: number;
  /** Timestamp when lockout expires (null if not locked out). */
  lockoutUntil: number | null;
}

/**
 * Creates an in-memory brute-force protection manager.
 *
 * @security BSI ORP.4 – Brute-force mitigation with exponential backoff
 */
export function createBruteForceProtection(config?: BruteForceConfig) {
  const maxFree = config?.maxFreeAttempts ?? DEFAULT_MAX_FREE_ATTEMPTS;
  const maxAttempts = config?.maxAttempts ?? DEFAULT_MAX_ATTEMPTS;
  const maxBackoffMs = config?.maxBackoffMs ?? DEFAULT_MAX_BACKOFF_MS;

  let failedAttempts = 0;
  let lockoutUntil: number | null = null;
  let isHardLocked = false;

  /**
   * Calculate backoff duration for current attempt count.
   * Exponential: 2^(attempts - maxFree) seconds, capped at maxBackoffMs.
   */
  function calculateBackoffMs(attempts: number): number {
    if (attempts <= maxFree) return 0;

    const exponent = attempts - maxFree;
    const backoff = BASE_BACKOFF_MS * Math.pow(2, exponent);
    return Math.min(backoff, maxBackoffMs);
  }

  return {
    /**
     * Record a failed authentication attempt.
     * Returns the current state after recording.
     */
    recordFailure(): BruteForceState {
      failedAttempts++;

      // BSI ORP.4: Audit log for failed attempt (no PII – no password/username)
      logEvent(
        LogEventId.AUTH_LOGIN_FAIL,
        LogLevel.WARN,
        `Authentication failed (attempt ${failedAttempts}/${maxAttempts})`,
        { entity: 'session', action: 'login_fail' },
      );

      // Hard lockout
      if (failedAttempts >= maxAttempts) {
        isHardLocked = true;
        lockoutUntil = null;

        logEvent(
          LogEventId.AUTH_BRUTE_FORCE_LOCKOUT,
          LogLevel.CRITICAL,
          `Hard lockout after ${failedAttempts} failed attempts. App restart required.`,
          { entity: 'session', action: 'lockout' },
        );

        return this.getState();
      }

      // Exponential backoff
      const backoffMs = calculateBackoffMs(failedAttempts);
      if (backoffMs > 0) {
        lockoutUntil = Date.now() + backoffMs;
      }

      return this.getState();
    },

    /**
     * Record a successful authentication. Resets all counters.
     */
    recordSuccess(): void {
      failedAttempts = 0;
      lockoutUntil = null;
      isHardLocked = false;

      logEvent(
        LogEventId.AUTH_LOGIN_SUCCESS,
        LogLevel.INFO,
        'Authentication successful, brute-force counters reset',
        { entity: 'session', action: 'login_success' },
      );
    },

    /**
     * Check if an authentication attempt is currently allowed.
     * Returns { allowed: true } or { allowed: false, state }.
     */
    canAttempt(): { allowed: boolean; state: BruteForceState } {
      const state = this.getState();
      return {
        allowed: !state.isLocked && state.remainingLockoutMs === 0,
        state,
      };
    },

    /**
     * Get current brute-force state.
     */
    getState(): BruteForceState {
      const now = Date.now();
      let remainingMs = 0;

      if (lockoutUntil !== null && lockoutUntil > now) {
        remainingMs = lockoutUntil - now;
      } else if (lockoutUntil !== null && lockoutUntil <= now) {
        // Backoff expired
        lockoutUntil = null;
      }

      return {
        failedAttempts,
        isLocked: isHardLocked,
        remainingLockoutMs: remainingMs,
        lockoutUntil,
      };
    },

    /**
     * Reset all state (e.g., on app restart simulation in tests).
     */
    reset(): void {
      failedAttempts = 0;
      lockoutUntil = null;
      isHardLocked = false;
    },
  };
}

export type BruteForceProtection = ReturnType<typeof createBruteForceProtection>;

/**
 * Singleton instance for app-wide use.
 * BSI ORP.4: Single point of enforcement.
 */
export const bruteForceProtection = createBruteForceProtection();
