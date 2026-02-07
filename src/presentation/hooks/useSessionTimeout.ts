/**
 * useSessionTimeout Hook
 *
 * BSI IT-Grundschutz APP.3.1 A.8: Integrates session timeout with Zustand store.
 * Wipes encryption key from memory on inactivity timeout.
 *
 * @security Mandatory for medical apps processing DSGVO Art. 9 health data.
 */

import { useEffect, useRef, useCallback } from 'react';
import { useQuestionnaireStore } from '../state/useQuestionnaireStore';
import { clearActiveEncryptionKey } from '../../shared/keyManager';
import {
  createSessionTimeoutManager,
  SessionTimeoutManager,
} from '../../shared/sessionTimeout';

interface UseSessionTimeoutOptions {
  /** Timeout in ms. Default: 900_000 (15 min). */
  timeoutMs?: number;
  /** Callback when session locks (e.g., navigate to unlock screen). */
  onLock?: () => void;
  /** Callback for warning before timeout. */
  onWarning?: () => void;
}

/**
 * Hook that manages session timeout lifecycle.
 *
 * - Arms timeout when encryption key is present
 * - Disarms when no key (not authenticated)
 * - Wipes key + navigates on timeout
 *
 * @returns recordActivity function to call on user interactions
 */
export function useSessionTimeout(options?: UseSessionTimeoutOptions) {
  const encryptionKey = useQuestionnaireStore(s => s.encryptionKey);
  const clearEncryptionKey = useQuestionnaireStore(s => s.clearEncryptionKey);
  const managerRef = useRef<SessionTimeoutManager | null>(null);

  const handleTimeout = useCallback(() => {
    // BSI APP.3.1: Wipe encryption key from memory on timeout
    clearEncryptionKey();
    void clearActiveEncryptionKey({ removePersisted: false });
    options?.onLock?.();
  }, [clearEncryptionKey, options]);

  useEffect(() => {
    if (!encryptionKey) {
      // Not authenticated – no timeout needed
      managerRef.current?.stop();
      managerRef.current = null;
      return;
    }

    // Create and start timeout manager
    const manager = createSessionTimeoutManager({
      timeoutMs: options?.timeoutMs,
      onTimeout: handleTimeout,
      onWarning: options?.onWarning,
    });

    managerRef.current = manager;
    manager.start();

    return () => {
      manager.stop();
      managerRef.current = null;
    };
  }, [encryptionKey, handleTimeout, options?.timeoutMs, options?.onWarning]);

  const recordActivity = useCallback(() => {
    managerRef.current?.recordActivity();
  }, []);

  const lockNow = useCallback(() => {
    managerRef.current?.lock();
  }, []);

  return { recordActivity, lockNow };
}
