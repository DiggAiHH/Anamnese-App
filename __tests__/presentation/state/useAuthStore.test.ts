/**
 * Unit Tests: useAuthStore (Zustand)
 */
import { useAuthStore } from '../../../src/presentation/state/useAuthStore';

describe('useAuthStore', () => {
  beforeEach(() => {
    // Reset store state between tests
    useAuthStore.getState().logout();
  });

  it('starts with null auth state', () => {
    const state = useAuthStore.getState();
    expect(state.userId).toBeNull();
    expect(state.userRole).toBeNull();
    expect(state.sessionToken).toBeNull();
    expect(state.pending2FA).toBe(false);
  });

  it('setAuth stores user info', () => {
    useAuthStore.getState().setAuth('user-1', 'therapist', 'Dr. Test', 'token-abc');
    const state = useAuthStore.getState();
    expect(state.userId).toBe('user-1');
    expect(state.userRole).toBe('therapist');
    expect(state.displayName).toBe('Dr. Test');
    expect(state.sessionToken).toBe('token-abc');
  });

  it('setPending2FA sets 2FA state', () => {
    useAuthStore.getState().setPending2FA('user-2', 'therapist', 'Dr. Test');
    const state = useAuthStore.getState();
    expect(state.pending2FA).toBe(true);
    expect(state.userId).toBe('user-2');
  });

  it('complete2FA clears pending and sets session', () => {
    useAuthStore.getState().setPending2FA('user-2', 'therapist', 'Dr. Test');
    useAuthStore.getState().complete2FA('session-token-xyz');
    const state = useAuthStore.getState();
    expect(state.pending2FA).toBe(false);
    expect(state.sessionToken).toBe('session-token-xyz');
  });

  it('logout clears all state', () => {
    useAuthStore.getState().setAuth('user-1', 'therapist', 'Dr.', 'token');
    useAuthStore.getState().logout();
    const state = useAuthStore.getState();
    expect(state.userId).toBeNull();
    expect(state.userRole).toBeNull();
    expect(state.displayName).toBeNull();
    expect(state.sessionToken).toBeNull();
    expect(state.pending2FA).toBe(false);
  });

  it('setAuthLoading toggles loading state', () => {
    useAuthStore.getState().setAuthLoading(true);
    expect(useAuthStore.getState().isAuthLoading).toBe(true);
    useAuthStore.getState().setAuthLoading(false);
    expect(useAuthStore.getState().isAuthLoading).toBe(false);
  });
});
