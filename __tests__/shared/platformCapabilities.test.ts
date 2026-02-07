const loadCapabilities = (
  os: string,
  quickCryptoMode: 'present' | 'missing' | 'none' = 'none',
  sqliteMode: 'present' | 'missing' | 'none' = 'none',
) => {
  jest.resetModules();
  jest.doMock('react-native', () => ({
    Platform: { OS: os },
  }));

  if (quickCryptoMode === 'present') {
    jest.doMock(
      'react-native-quick-crypto',
      () => ({
        randomBytes: jest.fn(),
        pbkdf2: jest.fn(),
        createCipheriv: jest.fn(),
        createDecipheriv: jest.fn(),
      }),
      { virtual: true },
    );
  }

  if (quickCryptoMode === 'missing') {
    jest.doMock('react-native-quick-crypto', () => {
      throw new Error('missing');
    });
  }

  if (sqliteMode === 'present') {
    jest.doMock(
      'react-native-sqlite-storage',
      () => ({
        openDatabase: jest.fn(),
      }),
      { virtual: true },
    );
  }

  if (sqliteMode === 'missing') {
    jest.doMock('react-native-sqlite-storage', () => {
      throw new Error('missing');
    });
  }

  return require('../../src/shared/platformCapabilities');
};

describe('platformCapabilities', () => {
  const originalCrypto = globalThis.crypto;

  afterEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    if (originalCrypto) {
      Object.defineProperty(globalThis, 'crypto', {
        value: originalCrypto,
        configurable: true,
      });
    }
  });

  it('flags iOS capabilities', () => {
    const caps = loadCapabilities('ios', 'none', 'present');
    expect(caps.isIOS).toBe(true);
    expect(caps.isAndroid).toBe(false);
    expect(caps.isWeb).toBe(false);
    expect(caps.supportsTTS).toBe(true);
    expect(caps.supportsSQLite).toBe(true);
    expect(caps.supportsDocumentPicker).toBe(true);
    expect(caps.canUseSQLite()).toBe(true);
  });

  it('flags web capabilities as unsupported for native modules', () => {
    const caps = loadCapabilities('web');
    expect(caps.isWeb).toBe(true);
    expect(caps.supportsTTS).toBe(false);
    expect(caps.supportsSpeechToText).toBe(false);
    expect(caps.supportsOCR).toBe(false);
    expect(caps.supportsSQLite).toBe(false);
    expect(caps.canUseSQLite()).toBe(false);
  });

  it('flags Windows capabilities and detects SQLite availability', () => {
    const caps = loadCapabilities('windows', 'none', 'missing');
    expect(caps.isWindows).toBe(true);
    expect(caps.supportsSQLite).toBe(true);
    expect(caps.canUseSQLite()).toBe(false);
  });

  it('flags macOS secure storage capability', () => {
    const caps = loadCapabilities('macos');
    expect(caps.isMacOS).toBe(true);
    expect(caps.supportsSecureKeychain).toBe(true);
  });

  it('detects WebCrypto availability', () => {
    const caps = loadCapabilities('web');
    Object.defineProperty(globalThis, 'crypto', {
      value: undefined,
      configurable: true,
    });
    expect(caps.supportsWebCrypto()).toBe(false);

    Object.defineProperty(globalThis, 'crypto', {
      value: { getRandomValues: () => new Uint8Array(8) },
      configurable: true,
    });
    expect(caps.supportsWebCrypto()).toBe(true);
  });

  it('detects quick-crypto availability', () => {
    const capsPresent = loadCapabilities('ios', 'present');
    expect(capsPresent.canUseQuickCrypto()).toBe(true);

    const capsWeb = loadCapabilities('web', 'present');
    expect(capsWeb.canUseQuickCrypto()).toBe(false);

    const capsWindows = loadCapabilities('windows', 'present');
    expect(capsWindows.canUseQuickCrypto()).toBe(false);

    const capsMissing = loadCapabilities('ios', 'missing');
    expect(capsMissing.canUseQuickCrypto()).toBe(false);
  });
});
