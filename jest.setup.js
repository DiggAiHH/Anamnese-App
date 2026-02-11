import 'react-native-gesture-handler/jestSetup';

jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  Reanimated.default.call = () => {};
  return Reanimated;
});

jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper');

// Mock react-native-quick-crypto for Jest (native module not available in tests)
jest.mock('react-native-quick-crypto', () => ({
  randomBytes: size => Buffer.alloc(size).fill(1),
  pbkdf2: (password, salt, iterations, keylen, digest, callback) => {
    const key = Buffer.alloc(keylen).fill(2);
    if (callback) callback(null, key);
    return key;
  },
  pbkdf2Sync: (password, salt, iterations, keylen) => Buffer.alloc(keylen).fill(2),
  createCipheriv: () => ({
    update: data => Buffer.from(data),
    final: () => Buffer.alloc(0),
    getAuthTag: () => Buffer.alloc(16).fill(3),
  }),
  createDecipheriv: () => ({
    setAuthTag: () => {},
    update: data => data,
    final: () => Buffer.alloc(0),
  }),
}));

// Mock react-native-sqlite-storage
jest.mock('react-native-sqlite-storage', () => ({
  DEBUG: jest.fn(),
  enablePromise: jest.fn(),
  openDatabase: jest.fn(() =>
    Promise.resolve({
      executeSql: jest.fn(() =>
        Promise.resolve([
          { rows: { length: 0, item: () => null } }, // Default empty result
        ]),
      ),
      transaction: jest.fn(cb =>
        cb({
          executeSql: jest.fn(),
        }),
      ),
      close: jest.fn(() => Promise.resolve()),
    }),
  ),
}));

// Mock @react-native-async-storage/async-storage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

// Mock react-native-keychain (ESM module) for Jest
jest.mock('react-native-keychain', () => ({
  setGenericPassword: jest.fn(),
  getGenericPassword: jest.fn(),
  resetGenericPassword: jest.fn(),
  ACCESSIBLE: { WHEN_UNLOCKED_THIS_DEVICE_ONLY: 'DEVICE_ONLY' },
}));

// Mock react-native-safe-area-context for ScreenContainer
jest.mock('react-native-safe-area-context', () => {
  const { View } = require('react-native');
  const React = require('react');
  return {
    SafeAreaView: (props) => React.createElement(View, props),
    SafeAreaProvider: (props) => React.createElement(View, props),
    useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
  };
});

global.__reanimatedWorkletInit = () => {};
