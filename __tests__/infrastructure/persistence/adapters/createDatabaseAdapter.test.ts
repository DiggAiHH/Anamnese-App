/**
 * createDatabaseAdapter factory unit tests
 *
 * Tests platform detection logic for adapter selection.
 *
 * @security No PII in tests.
 */

import { Platform } from 'react-native';

// Mock the adapters to avoid importing real IndexedDB/AsyncStorage
jest.mock('../../../../src/infrastructure/persistence/adapters/IndexedDBAdapter', () => ({
  IndexedDBAdapter: class MockIndexedDBAdapter {
    readonly name = 'IndexedDB';
  },
}));

jest.mock('../../../../src/infrastructure/persistence/adapters/AsyncStorageAdapter', () => ({
  AsyncStorageAdapter: class MockAsyncStorageAdapter {
    readonly name = 'AsyncStorage';
  },
}));

import { createDatabaseAdapter } from '../../../../src/infrastructure/persistence/adapters/createDatabaseAdapter';

describe('createDatabaseAdapter', () => {
  const originalOS = Platform.OS;

  afterEach(() => {
    // Restore original Platform.OS
    Object.defineProperty(Platform, 'OS', { value: originalOS, writable: true });
  });

  it('returns null for iOS (native SQLite)', () => {
    Object.defineProperty(Platform, 'OS', { value: 'ios', writable: true });
    expect(createDatabaseAdapter()).toBeNull();
  });

  it('returns null for Android (native SQLite)', () => {
    Object.defineProperty(Platform, 'OS', { value: 'android', writable: true });
    expect(createDatabaseAdapter()).toBeNull();
  });

  it('returns AsyncStorageAdapter for macOS', () => {
    Object.defineProperty(Platform, 'OS', { value: 'macos', writable: true });
    const adapter = createDatabaseAdapter();
    expect(adapter).not.toBeNull();
    expect(adapter!.name).toBe('AsyncStorage');
  });

  it('returns AsyncStorageAdapter for unknown platform', () => {
    Object.defineProperty(Platform, 'OS', { value: 'unknown' as never, writable: true });
    const adapter = createDatabaseAdapter();
    expect(adapter).not.toBeNull();
    expect(adapter!.name).toBe('AsyncStorage');
  });
});
