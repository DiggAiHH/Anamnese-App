import 'react-native-gesture-handler/jestSetup';

jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  Reanimated.default.call = () => {};
  return Reanimated;
});

jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper');

// Mock react-native-quick-crypto for Jest (native module not available in tests)
jest.mock('react-native-quick-crypto', () => ({
  randomBytes: (size) => Buffer.alloc(size).fill(1),
  pbkdf2: (password, salt, iterations, keylen, digest, callback) => {
    const key = Buffer.alloc(keylen).fill(2);
    if (callback) callback(null, key);
    return key;
  },
  pbkdf2Sync: (password, salt, iterations, keylen) => Buffer.alloc(keylen).fill(2),
  createCipheriv: () => ({
    update: (data) => Buffer.from(data),
    final: () => Buffer.alloc(0),
    getAuthTag: () => Buffer.alloc(16).fill(3),
  }),
  createDecipheriv: () => ({
    setAuthTag: () => {},
    update: (data) => data,
    final: () => Buffer.alloc(0),
  }),
}));

global.__reanimatedWorkletInit = () => {};
