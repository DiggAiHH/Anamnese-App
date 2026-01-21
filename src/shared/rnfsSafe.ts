/**
 * RNFS Safe Loader
 *
 * Purpose:
 * - Prevent app startup crashes when `react-native-fs` native module is not
 *   registered (e.g., RNFSManager missing on some Windows builds).
 *
 * Security/Privacy:
 * - Does not log paths or PII.
 */

import { NativeModules } from 'react-native';

export type RNFSModule = typeof import('react-native-fs');

export const isRNFSAvailable = (): boolean => {
  const manager = (NativeModules as unknown as { RNFSManager?: Record<string, unknown> }).RNFSManager;
  if (!manager) return false;

  // `react-native-fs` module initialization reads these constants immediately.
  // If they are missing, importing RNFS can crash the app.
  return (
    manager.RNFSFileTypeRegular !== undefined &&
    manager.RNFSFileTypeDirectory !== undefined
  );
};

export const requireRNFS = (): RNFSModule => {
  if (!isRNFSAvailable()) {
    throw new Error('RNFS is not available on this platform/build');
  }

  // eslint-disable-next-line @typescript-eslint/no-var-requires
  return require('react-native-fs') as RNFSModule;
};
