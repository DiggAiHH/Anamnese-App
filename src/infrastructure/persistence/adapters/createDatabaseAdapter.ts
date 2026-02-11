/**
 * Database Adapter Factory
 *
 * Creates the appropriate IDatabaseAdapter based on Platform.OS
 * and runtime capability checks.
 *
 * Selection order (conservative / most-to-least capable):
 * 1. iOS / Android / Windows with native SQLite → null (use existing SQLite path in DatabaseConnection)
 * 2. Web → IndexedDBAdapter (persistent, fast)
 * 3. macOS / fallback → AsyncStorageAdapter (universal RN persistence)
 *
 * Note: This factory returns null when native SQLite is available.
 * DatabaseConnection continues to use the existing react-native-sqlite-storage
 * path in that case — we only inject an adapter for platforms where native
 * SQLite is NOT available.
 *
 * @security No PII. Platform detection only.
 */

import { Platform } from 'react-native';
import type { IDatabaseAdapter } from './IDatabaseAdapter';

/**
 * Create the appropriate database adapter for the current platform.
 * Returns null if native SQLite should be used (iOS, Android, Windows with native module).
 */
export function createDatabaseAdapter(): IDatabaseAdapter | null {
  const os = Platform.OS;

  // iOS / Android: Always have native SQLite
  if (os === 'ios' || os === 'android') {
    return null; // use native SQLite path
  }

  // Windows: Native SQLite is partially supported — check at runtime
  if (os === 'windows') {
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const mod = require('react-native-sqlite-storage');
      const sqlite = (mod?.default ?? mod) as { openDatabase?: unknown } | undefined;
      if (typeof sqlite?.openDatabase === 'function') {
        return null; // native SQLite works on this Windows build
      }
    } catch {
      // Native module not available — fall through to AsyncStorage
    }
    // Windows without native SQLite: use AsyncStorage
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { AsyncStorageAdapter } = require('./AsyncStorageAdapter');
    return new AsyncStorageAdapter();
  }

  // Web: Use IndexedDB
  if (os === 'web') {
    // Check if IndexedDB is available (it should be in all modern browsers)
    if (typeof indexedDB !== 'undefined') {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { IndexedDBAdapter } = require('./IndexedDBAdapter');
      return new IndexedDBAdapter();
    }
    // Fallback to AsyncStorage (unlikely on web, but safe)
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { AsyncStorageAdapter } = require('./AsyncStorageAdapter');
    return new AsyncStorageAdapter();
  }

  // macOS: No native SQLite support typically — use AsyncStorage
  if (os === 'macos') {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { AsyncStorageAdapter } = require('./AsyncStorageAdapter');
    return new AsyncStorageAdapter();
  }

  // Unknown platform: AsyncStorage as universal fallback
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { AsyncStorageAdapter } = require('./AsyncStorageAdapter');
  return new AsyncStorageAdapter();
}
