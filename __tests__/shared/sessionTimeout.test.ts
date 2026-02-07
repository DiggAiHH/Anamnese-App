/**
 * Session Timeout Tests
 *
 * BSI IT-Grundschutz APP.3.1 A.8: Verifies automatic session lock.
 * Tests cover: timer scheduling, activity reset, app backgrounding,
 * timeout callback invocation, and boundary conditions.
 */

import { createSessionTimeoutManager } from '../../src/shared/sessionTimeout';

// Mock AppState
const appStateListeners: Array<(state: string) => void> = [];
jest.mock('react-native', () => ({
  AppState: {
    addEventListener: jest.fn((_event: string, handler: (state: string) => void) => {
      appStateListeners.push(handler);
      return {
        remove: () => {
          const idx = appStateListeners.indexOf(handler);
          if (idx >= 0) appStateListeners.splice(idx, 1);
        },
      };
    }),
  },
}));

// Mock logger to prevent console noise
jest.mock('../../src/shared/logger', () => ({
  logEvent: jest.fn(),
  LogLevel: { INFO: 'INFO', WARN: 'WARN', ERROR: 'ERROR', CRITICAL: 'CRITICAL', DEBUG: 'DEBUG' },
  LogEventId: {
    AUTH_SESSION_EXPIRED: 'AUTH_SESSION_EXPIRED',
    AUTH_LOGIN_SUCCESS: 'AUTH_LOGIN_SUCCESS',
  },
}));

describe('SessionTimeoutManager', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    appStateListeners.length = 0;
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Given a manager with 60s timeout', () => {
    it('should call onTimeout after inactivity period', () => {
      // Given
      const onTimeout = jest.fn();
      const manager = createSessionTimeoutManager({
        timeoutMs: 60_000,
        onTimeout,
      });

      // When
      manager.start();
      jest.advanceTimersByTime(60_000);

      // Then
      expect(onTimeout).toHaveBeenCalledTimes(1);

      manager.stop();
    });

    it('should NOT call onTimeout before inactivity period', () => {
      const onTimeout = jest.fn();
      const manager = createSessionTimeoutManager({
        timeoutMs: 60_000,
        onTimeout,
      });

      manager.start();
      jest.advanceTimersByTime(59_999);

      expect(onTimeout).not.toHaveBeenCalled();

      manager.stop();
    });

    it('should reset timer on activity', () => {
      const onTimeout = jest.fn();
      const manager = createSessionTimeoutManager({
        timeoutMs: 60_000,
        onTimeout,
      });

      manager.start();

      // Advance 30s, then record activity
      jest.advanceTimersByTime(30_000);
      manager.recordActivity();

      // Advance another 30s (total 60s from start, but only 30s from activity)
      jest.advanceTimersByTime(30_000);
      expect(onTimeout).not.toHaveBeenCalled();

      // Advance remaining 30s (now 60s since last activity)
      jest.advanceTimersByTime(30_000);
      expect(onTimeout).toHaveBeenCalledTimes(1);

      manager.stop();
    });

    it('should call onWarning before timeout', () => {
      const onTimeout = jest.fn();
      const onWarning = jest.fn();
      const manager = createSessionTimeoutManager({
        timeoutMs: 60_000,
        onTimeout,
        onWarning,
        warningLeadMs: 20_000,
      });

      manager.start();

      // Warning at 40s (60s - 20s lead)
      jest.advanceTimersByTime(40_000);
      expect(onWarning).toHaveBeenCalledTimes(1);
      expect(onTimeout).not.toHaveBeenCalled();

      // Timeout at 60s
      jest.advanceTimersByTime(20_000);
      expect(onTimeout).toHaveBeenCalledTimes(1);

      manager.stop();
    });

    it('should only fire timeout once', () => {
      const onTimeout = jest.fn();
      const manager = createSessionTimeoutManager({
        timeoutMs: 60_000,
        onTimeout,
      });

      manager.start();
      jest.advanceTimersByTime(120_000);

      expect(onTimeout).toHaveBeenCalledTimes(1);

      manager.stop();
    });

    it('should allow unlock and restart timer', () => {
      const onTimeout = jest.fn();
      const manager = createSessionTimeoutManager({
        timeoutMs: 60_000,
        onTimeout,
      });

      manager.start();
      jest.advanceTimersByTime(60_000);
      expect(onTimeout).toHaveBeenCalledTimes(1);
      expect(manager.isLocked).toBe(true);

      // Unlock resets
      manager.unlock();
      expect(manager.isLocked).toBe(false);

      jest.advanceTimersByTime(60_000);
      expect(onTimeout).toHaveBeenCalledTimes(2);

      manager.stop();
    });

    it('should force-lock immediately', () => {
      const onTimeout = jest.fn();
      const manager = createSessionTimeoutManager({
        timeoutMs: 60_000,
        onTimeout,
      });

      manager.start();
      manager.lock();

      expect(onTimeout).toHaveBeenCalledTimes(1);
      expect(manager.isLocked).toBe(true);

      manager.stop();
    });

    it('should not fire after stop', () => {
      const onTimeout = jest.fn();
      const manager = createSessionTimeoutManager({
        timeoutMs: 60_000,
        onTimeout,
      });

      manager.start();
      manager.stop();
      jest.advanceTimersByTime(120_000);

      expect(onTimeout).not.toHaveBeenCalled();
    });
  });

  describe('Given app backgrounding', () => {
    it('should timeout if backgrounded longer than timeout', () => {
      const onTimeout = jest.fn();
      const manager = createSessionTimeoutManager({
        timeoutMs: 60_000,
        onTimeout,
      });

      manager.start();

      // Simulate background (clears timers internally)
      const handler = appStateListeners[0];
      handler('background');

      // Advance time past timeout
      jest.advanceTimersByTime(61_000);

      // Come back to foreground
      handler('active');

      expect(onTimeout).toHaveBeenCalledTimes(1);

      manager.stop();
    });
  });

  describe('Given timeout boundary values', () => {
    it('should clamp timeout below minimum to default (15 min)', () => {
      const onTimeout = jest.fn();
      const manager = createSessionTimeoutManager({
        timeoutMs: 100, // Below 60s minimum
        onTimeout,
      });

      // Should use default 15 min = 900_000ms
      expect(manager.timeoutMs).toBe(900_000);
      manager.stop();
    });

    it('should clamp timeout above maximum to 1 hour', () => {
      const onTimeout = jest.fn();
      const manager = createSessionTimeoutManager({
        timeoutMs: 999_999_999,
        onTimeout,
      });

      expect(manager.timeoutMs).toBe(3_600_000);
      manager.stop();
    });
  });
});
