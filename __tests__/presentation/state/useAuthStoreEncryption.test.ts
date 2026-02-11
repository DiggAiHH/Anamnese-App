/**
 * useAuthStore encryptionKey Tests
 *
 * Tests the extended auth store with encryption key support.
 */

import { useAuthStore } from '../../../src/presentation/state/useAuthStore';
import { act } from '@testing-library/react-native';

describe('useAuthStore - encryptionKey', () => {
  beforeEach(() => {
    act(() => {
      useAuthStore.getState().logout();
    });
  });

  it('should initialize encryptionKey as null', () => {
    expect(useAuthStore.getState().encryptionKey).toBeNull();
  });

  it('should store encryptionKey via setAuth', () => {
    act(() => {
      useAuthStore.getState().setAuth('user-1', 'therapist', 'Dr. Test', 'token-abc', 'enc-key-123');
    });

    const state = useAuthStore.getState();
    expect(state.encryptionKey).toBe('enc-key-123');
    expect(state.userId).toBe('user-1');
    expect(state.sessionToken).toBe('token-abc');
  });

  it('should set encryptionKey to null when not provided', () => {
    act(() => {
      useAuthStore.getState().setAuth('user-1', 'therapist', 'Dr. Test', 'token-abc');
    });

    expect(useAuthStore.getState().encryptionKey).toBeNull();
  });

  it('should store encryptionKey via setPending2FA', () => {
    act(() => {
      useAuthStore.getState().setPending2FA('user-1', 'therapist', 'Dr. Test', 'pending-key-456');
    });

    const state = useAuthStore.getState();
    expect(state.encryptionKey).toBe('pending-key-456');
    expect(state.pending2FA).toBe(true);
  });

  it('should preserve encryptionKey through complete2FA', () => {
    act(() => {
      useAuthStore.getState().setPending2FA('user-1', 'therapist', 'Dr. Test', 'my-enc-key');
    });
    act(() => {
      useAuthStore.getState().complete2FA('final-token');
    });

    const state = useAuthStore.getState();
    expect(state.encryptionKey).toBe('my-enc-key');
    expect(state.sessionToken).toBe('final-token');
    expect(state.pending2FA).toBe(false);
  });

  it('should clear encryptionKey on logout', () => {
    act(() => {
      useAuthStore.getState().setAuth('user-1', 'therapist', 'Dr. Test', 'token', 'enc-key');
    });
    expect(useAuthStore.getState().encryptionKey).toBe('enc-key');

    act(() => {
      useAuthStore.getState().logout();
    });
    expect(useAuthStore.getState().encryptionKey).toBeNull();
  });
});
