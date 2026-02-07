/**
 * Brute-Force Protection Tests
 *
 * BSI IT-Grundschutz ORP.4: Verifies brute-force mitigation.
 * Tests cover: free attempts, exponential backoff, hard lockout,
 * success reset, and boundary conditions.
 */

import { createBruteForceProtection } from '../../src/shared/bruteForceProtection';

// Mock logger
jest.mock('../../src/shared/logger', () => ({
  logEvent: jest.fn(),
  LogLevel: { INFO: 'INFO', WARN: 'WARN', ERROR: 'ERROR', CRITICAL: 'CRITICAL', DEBUG: 'DEBUG' },
  LogEventId: {
    AUTH_LOGIN_FAIL: 'AUTH_LOGIN_FAIL',
    AUTH_LOGIN_SUCCESS: 'AUTH_LOGIN_SUCCESS',
    AUTH_BRUTE_FORCE_LOCKOUT: 'AUTH_BRUTE_FORCE_LOCKOUT',
  },
}));

describe('BruteForceProtection', () => {
  describe('Given default configuration (3 free, 10 max)', () => {
    it('should allow first 3 attempts without backoff', () => {
      const bf = createBruteForceProtection();

      // First 3 failures should have no backoff
      for (let i = 0; i < 3; i++) {
        const state = bf.recordFailure();
        expect(state.remainingLockoutMs).toBe(0);
        expect(state.isLocked).toBe(false);
      }

      const check = bf.canAttempt();
      expect(check.allowed).toBe(true);
    });

    it('should apply exponential backoff after free attempts', () => {
      const bf = createBruteForceProtection();

      // Exhaust free attempts
      for (let i = 0; i < 3; i++) {
        bf.recordFailure();
      }

      // 4th attempt should trigger 2^1 = 2s backoff
      const state4 = bf.recordFailure();
      expect(state4.remainingLockoutMs).toBeGreaterThan(0);
      expect(state4.remainingLockoutMs).toBeLessThanOrEqual(2_000);
      expect(state4.isLocked).toBe(false);

      const check = bf.canAttempt();
      expect(check.allowed).toBe(false);
    });

    it('should hard-lock after maxAttempts', () => {
      const bf = createBruteForceProtection({ maxAttempts: 5 });

      for (let i = 0; i < 5; i++) {
        bf.recordFailure();
      }

      const state = bf.getState();
      expect(state.isLocked).toBe(true);
      expect(state.failedAttempts).toBe(5);

      const check = bf.canAttempt();
      expect(check.allowed).toBe(false);
    });

    it('should reset counters on success', () => {
      const bf = createBruteForceProtection();

      bf.recordFailure();
      bf.recordFailure();
      bf.recordSuccess();

      const state = bf.getState();
      expect(state.failedAttempts).toBe(0);
      expect(state.isLocked).toBe(false);
      expect(state.remainingLockoutMs).toBe(0);
    });

    it('should cap backoff at maxBackoffMs', () => {
      const bf = createBruteForceProtection({
        maxFreeAttempts: 0,
        maxAttempts: 100,
        maxBackoffMs: 5_000,
      });

      // Many failures to exceed cap
      for (let i = 0; i < 20; i++) {
        bf.recordFailure();
      }

      const state = bf.getState();
      // Backoff should be capped at 5s
      expect(state.remainingLockoutMs).toBeLessThanOrEqual(5_000);
    });

    it('should allow attempts again after backoff expires', () => {
      jest.useFakeTimers();

      const bf = createBruteForceProtection({ maxFreeAttempts: 0, maxAttempts: 100 });

      bf.recordFailure(); // triggers 2^1 = 2s backoff

      // Should be blocked immediately
      expect(bf.canAttempt().allowed).toBe(false);

      // Advance past backoff
      jest.advanceTimersByTime(3_000);

      // Should be allowed again
      expect(bf.canAttempt().allowed).toBe(true);

      jest.useRealTimers();
    });

    it('should reset all state on reset()', () => {
      const bf = createBruteForceProtection({ maxAttempts: 3 });

      // Hard lock
      for (let i = 0; i < 3; i++) {
        bf.recordFailure();
      }
      expect(bf.getState().isLocked).toBe(true);

      bf.reset();

      const state = bf.getState();
      expect(state.failedAttempts).toBe(0);
      expect(state.isLocked).toBe(false);
      expect(state.remainingLockoutMs).toBe(0);
    });
  });

  describe('Given custom configuration', () => {
    it('should use custom maxFreeAttempts', () => {
      const bf = createBruteForceProtection({ maxFreeAttempts: 5 });

      for (let i = 0; i < 5; i++) {
        const state = bf.recordFailure();
        expect(state.remainingLockoutMs).toBe(0);
      }

      // 6th should trigger backoff
      const state6 = bf.recordFailure();
      expect(state6.remainingLockoutMs).toBeGreaterThan(0);
    });
  });

  describe('Given audit logging', () => {
    it('should log failed attempts', () => {
      const { logEvent } = require('../../src/shared/logger');

      const bf = createBruteForceProtection();
      bf.recordFailure();

      expect(logEvent).toHaveBeenCalledWith(
        'AUTH_LOGIN_FAIL',
        'WARN',
        expect.stringContaining('attempt 1'),
        expect.objectContaining({ entity: 'session' }),
      );
    });

    it('should log lockout at CRITICAL level', () => {
      const { logEvent } = require('../../src/shared/logger');

      const bf = createBruteForceProtection({ maxAttempts: 1 });
      bf.recordFailure();

      expect(logEvent).toHaveBeenCalledWith(
        'AUTH_BRUTE_FORCE_LOCKOUT',
        'CRITICAL',
        expect.stringContaining('lockout'),
        expect.objectContaining({ entity: 'session' }),
      );
    });
  });
});
