import { NativeModules } from 'react-native';
import { isRNFSAvailable } from '../../src/shared/rnfsSafe';

describe('rnfsSafe', () => {
  const originalRNFSManager = (NativeModules as unknown as { RNFSManager?: unknown }).RNFSManager;

  afterEach(() => {
    (NativeModules as unknown as { RNFSManager?: unknown }).RNFSManager = originalRNFSManager;
  });

  it('returns false when RNFSManager is missing', () => {
    (NativeModules as unknown as { RNFSManager?: unknown }).RNFSManager = undefined;
    expect(isRNFSAvailable()).toBe(false);
  });

  it('returns true when RNFSManager exposes required constants', () => {
    (NativeModules as unknown as { RNFSManager?: unknown }).RNFSManager = {
      RNFSFileTypeRegular: 0,
      RNFSFileTypeDirectory: 1,
    };
    expect(isRNFSAvailable()).toBe(true);
  });
});
