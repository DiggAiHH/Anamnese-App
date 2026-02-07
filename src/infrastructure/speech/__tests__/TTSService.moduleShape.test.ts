describe('TTSService (module shape hardening)', () => {
  afterEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it('supports CommonJS export shape (no default export)', async () => {
    jest.resetModules();

    jest.doMock('@shared/platformCapabilities', () => ({
      supportsTTS: true,
    }));

    const cjsTts = {
      speak: jest.fn().mockResolvedValue(undefined),
      stop: jest.fn().mockResolvedValue(undefined),
      setDefaultRate: jest.fn().mockResolvedValue(undefined),
      setDefaultPitch: jest.fn().mockResolvedValue(undefined),
      setDefaultLanguage: jest.fn().mockResolvedValue(undefined),
      voices: jest.fn().mockResolvedValue([]),
      addEventListener: jest.fn(),
    };

    jest.doMock('react-native-tts', () => cjsTts, { virtual: true });

    const { TTSService } = require('../TTSService') as typeof import('../TTSService');
    // Constructor triggers initialization
    new TTSService();

    expect(cjsTts.addEventListener).toHaveBeenCalledWith('tts-start', expect.any(Function));

    // async init awaits rate/pitch before setting default language
    await Promise.resolve();
    await Promise.resolve();
    expect(cjsTts.setDefaultLanguage).toHaveBeenCalledWith('de-DE');
  });

  it('does not crash if TTS module is present but missing required methods', () => {
    jest.resetModules();

    jest.doMock('@shared/platformCapabilities', () => ({
      supportsTTS: true,
    }));

    const brokenTts = {
      speak: jest.fn().mockResolvedValue(undefined),
      stop: jest.fn().mockResolvedValue(undefined),
      // missing addEventListener -> should be treated as unavailable
    };

    jest.doMock('react-native-tts', () => ({ __esModule: true, default: brokenTts }), {
      virtual: true,
    });

    const { TTSService } = require('../TTSService') as typeof import('../TTSService');
    expect(() => new TTSService()).not.toThrow();
  });
});
