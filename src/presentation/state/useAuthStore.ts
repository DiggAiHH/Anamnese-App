/**
 * Auth Store - Zustand-based authentication state
 *
 * @security Session tokens stored in memory only (not persisted).
 * @gdpr No PII in store beyond display name. No logging of credentials.
 */

import { create } from 'zustand';
import type { UserRole } from '../../domain/entities/User';

interface AuthState {
  /** Currently authenticated user ID */
  userId: string | null;
  /** User role */
  userRole: UserRole | null;
  /** Display name (not PII-critical) */
  displayName: string | null;
  /** Session token (memory-only, not persisted) */
  sessionToken: string | null;
  /** Whether 2FA verification is pending */
  pending2FA: boolean;
  /** Whether auth is being checked */
  isAuthLoading: boolean;
  /** Derived encryption key (memory-only, never persisted) */
  encryptionKey: string | null;
}

interface AuthActions {
  setAuth: (userId: string, role: UserRole, displayName: string, token: string, encryptionKey?: string) => void;
  setPending2FA: (userId: string, role: UserRole, displayName: string, encryptionKey?: string) => void;
  complete2FA: (token: string) => void;
  logout: () => void;
  setAuthLoading: (loading: boolean) => void;
}

const initialState: AuthState = {
  userId: null,
  userRole: null,
  displayName: null,
  sessionToken: null,
  pending2FA: false,
  isAuthLoading: false,
  encryptionKey: null,
};

export const useAuthStore = create<AuthState & AuthActions>()((set) => ({
  ...initialState,

  setAuth: (userId, role, displayName, token, encryptionKey) =>
    set({
      userId,
      userRole: role,
      displayName,
      sessionToken: token,
      pending2FA: false,
      isAuthLoading: false,
      encryptionKey: encryptionKey ?? null,
    }),

  setPending2FA: (userId, role, displayName, encryptionKey) =>
    set({
      userId,
      userRole: role,
      displayName,
      pending2FA: true,
      isAuthLoading: false,
      encryptionKey: encryptionKey ?? null,
    }),

  complete2FA: (token) =>
    set({
      sessionToken: token,
      pending2FA: false,
    }),

  logout: () => set(initialState),

  setAuthLoading: (loading) => set({ isAuthLoading: loading }),
}));
