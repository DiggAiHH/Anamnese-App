/**
 * Session Timeout Manager
 *
 * BSI IT-Grundschutz APP.3.1 A.8: Automatic session lock after inactivity.
 * DSGVO Art. 32: Technical measures to protect health data.
 *
 * Configurable inactivity timeout (default: 15 minutes per BSI baseline).
 * On timeout: encryption key is wiped from memory, user must re-authenticate.
 *
 * @security Session timeout is a mandatory control for medical applications
 *           processing Art. 9 DSGVO special category data (health data).
 */

import { AppState, AppStateStatus } from 'react-native';
import { logEvent, LogLevel, LogEventId } from './logger';

// BSI APP.3.1: 15-minute default for medical/public-sector applications
const DEFAULT_TIMEOUT_MS = 15 * 60 * 1000;
const MIN_TIMEOUT_MS = 60 * 1000; // 1 minute minimum
const MAX_TIMEOUT_MS = 60 * 60 * 1000; // 1 hour maximum

export interface SessionTimeoutConfig {
  /** Inactivity timeout in milliseconds. Default: 900000 (15 min). */
  timeoutMs?: number;
  /** Callback invoked when session times out. */
  onTimeout: () => void;
  /** Optional callback for warning before timeout (e.g., 1 min before). */
  onWarning?: () => void;
  /** Warning lead time in ms before timeout. Default: 60000 (1 min). */
  warningLeadMs?: number;
}

/**
 * Creates a session timeout manager that tracks user activity
 * and triggers auto-lock on inactivity.
 *
 * @security BSI APP.3.1 A.8 – Automatic session termination
 */
export function createSessionTimeoutManager(config: SessionTimeoutConfig) {
  const timeoutMs = clampTimeout(config.timeoutMs ?? DEFAULT_TIMEOUT_MS);
  const warningLeadMs = config.warningLeadMs ?? 60_000;

  let lastActivityTimestamp = Date.now();
  let timeoutTimer: ReturnType<typeof setTimeout> | null = null;
  let warningTimer: ReturnType<typeof setTimeout> | null = null;
  let appStateSubscription: { remove: () => void } | null = null;
  let isActive = false;
  let isLocked = false;

  function resetTimers(): void {
    if (timeoutTimer) {
      clearTimeout(timeoutTimer);
      timeoutTimer = null;
    }
    if (warningTimer) {
      clearTimeout(warningTimer);
      warningTimer = null;
    }
  }

  function scheduleTimeout(): void {
    resetTimers();

    if (!isActive || isLocked) return;

    const elapsed = Date.now() - lastActivityTimestamp;
    const remaining = timeoutMs - elapsed;

    if (remaining <= 0) {
      handleTimeout();
      return;
    }

    // Schedule warning
    if (config.onWarning && remaining > warningLeadMs) {
      warningTimer = setTimeout(() => {
        config.onWarning?.();
      }, remaining - warningLeadMs);
    }

    // Schedule lock
    timeoutTimer = setTimeout(() => {
      handleTimeout();
    }, remaining);
  }

  function handleTimeout(): void {
    if (isLocked) return;
    isLocked = true;

    // BSI APP.3.1: Log security event (no PII)
    logEvent(
      LogEventId.AUTH_SESSION_EXPIRED,
      LogLevel.WARN,
      'Session timed out due to inactivity',
      { entity: 'session', action: 'timeout' },
    );

    config.onTimeout();
  }

  function recordActivity(): void {
    if (!isActive) return;
    lastActivityTimestamp = Date.now();
    isLocked = false;
    scheduleTimeout();
  }

  function handleAppStateChange(nextState: AppStateStatus): void {
    if (nextState === 'active') {
      // App came to foreground – check if timeout elapsed while backgrounded
      const elapsed = Date.now() - lastActivityTimestamp;
      if (elapsed >= timeoutMs) {
        handleTimeout();
      } else {
        scheduleTimeout();
      }
    } else if (nextState === 'background' || nextState === 'inactive') {
      // App went to background – keep lastActivityTimestamp, clear timers
      resetTimers();
    }
  }

  return {
    /**
     * Start monitoring inactivity. Call once on app mount.
     */
    start(): void {
      if (isActive) return;
      isActive = true;
      isLocked = false;
      lastActivityTimestamp = Date.now();

      appStateSubscription = AppState.addEventListener('change', handleAppStateChange);
      scheduleTimeout();

      logEvent(
        LogEventId.AUTH_LOGIN_SUCCESS,
        LogLevel.INFO,
        `Session timeout armed: ${timeoutMs / 1000}s`,
        { entity: 'session', action: 'start' },
      );
    },

    /**
     * Stop monitoring. Call on app unmount.
     */
    stop(): void {
      isActive = false;
      resetTimers();
      appStateSubscription?.remove();
      appStateSubscription = null;
    },

    /**
     * Record user interaction (touch, key press, navigation).
     * Resets the inactivity timer.
     */
    recordActivity,

    /**
     * Force-lock the session immediately (e.g., user presses "Lock" button).
     */
    lock(): void {
      handleTimeout();
    },

    /**
     * Unlock after re-authentication. Resets timers.
     */
    unlock(): void {
      isLocked = false;
      lastActivityTimestamp = Date.now();
      scheduleTimeout();
    },

    /** Whether the session is currently locked. */
    get isLocked(): boolean {
      return isLocked;
    },

    /** Current timeout value in ms. */
    get timeoutMs(): number {
      return timeoutMs;
    },
  };
}

function clampTimeout(ms: number): number {
  if (!Number.isFinite(ms) || ms < MIN_TIMEOUT_MS) return DEFAULT_TIMEOUT_MS;
  if (ms > MAX_TIMEOUT_MS) return MAX_TIMEOUT_MS;
  return ms;
}

export type SessionTimeoutManager = ReturnType<typeof createSessionTimeoutManager>;
