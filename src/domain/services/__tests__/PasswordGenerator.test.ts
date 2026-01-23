import { PasswordGenerator } from '../PasswordGenerator';

// Mock crypto for test environment if needed, but jest usually accesses node crypto.
// Since we use `crypto.getRandomValues`, we might need a polyfill in Jest if not present.
// Node 19+ has global crypto. If not, we mock it.

beforeAll(() => {
  if (!global.crypto) {
    Object.defineProperty(global, 'crypto', {
      value: {
        getRandomValues: (arr: Uint32Array) => {
          for (let i = 0; i < arr.length; i++) {
            arr[i] = Math.floor(Math.random() * 4294967296);
          }
          return arr;
        },
      },
    });
  } else if (!global.crypto.getRandomValues) {
    // @ts-expect-error - In some TS lib versions, getRandomValues can be readonly on Crypto.
    global.crypto.getRandomValues = (arr: Uint32Array) => {
      for (let i = 0; i < arr.length; i++) {
        arr[i] = Math.floor(Math.random() * 4294967296);
      }
      return arr;
    };
  }
});

describe('PasswordGenerator', () => {
  it('should generate a password of specified length', () => {
    const pwd = PasswordGenerator.generate(20);
    expect(pwd.length).toBe(20);
  });

  it('should generate different passwords', () => {
    const pwd1 = PasswordGenerator.generate(16);
    const pwd2 = PasswordGenerator.generate(16);
    expect(pwd1).not.toBe(pwd2);
  });

  it('should contain a mix of characters', () => {
    const pwd = PasswordGenerator.generate(50);
    expect(pwd).toMatch(/[a-z]/);
    expect(pwd).toMatch(/[A-Z]/);
    expect(pwd).toMatch(/[0-9]/);
    expect(pwd).toMatch(/[!@#$%^&*()-_=+[\]{};:,.?]/);
  });
});
