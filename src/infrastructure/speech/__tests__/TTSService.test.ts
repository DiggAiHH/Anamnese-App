/**
 * TTSService Unit Tests
 *
 * Tests the Text-to-Speech service behavior.
 * Verifies GDPR compliance (no PII in logs) and proper language handling.
 *
 * Note: TTSService validates react-native-tts module shape at load time.
 * When the module is unavailable or has missing methods, TTSService enters
 * a graceful "mock mode" that silently ignores all TTS calls.
 */

const makeTtsMock = () => ({
  speak: jest.fn().mockResolvedValue(undefined),
  stop: jest.fn().mockResolvedValue(undefined),
  setDefaultRate: jest.fn().mockResolvedValue(undefined),
  setDefaultPitch: jest.fn().mockResolvedValue(undefined),
  setDefaultLanguage: jest.fn().mockResolvedValue(undefined),
  voices: jest.fn().mockResolvedValue([
    { id: 'voice1', name: 'German Voice', language: 'de-DE', quality: 300 },
    { id: 'voice2', name: 'English Voice', language: 'en-US', quality: 300 },
  ]),
  addEventListener: jest.fn(),
});

const flushPromises = () => new Promise(resolve => setImmediate(resolve));

const setupService = async (supportsTTS: boolean) => {
  const tts = makeTtsMock();
  jest.resetModules();
  jest.doMock('@shared/platformCapabilities', () => ({
    supportsTTS,
  }));
  jest.doMock('react-native-tts', () => ({
    __esModule: true,
    default: tts,
  }));
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { TTSService } = require('../TTSService');
  const service = new TTSService();
  await flushPromises();
  return { service, tts };
};

describe('TTSService (Mock Mode - TTS Unavailable)', () => {
  it('initializes without errors', async () => {
    const { service } = await setupService(false);
    expect(service).toBeDefined();
  });

  it('silently ignores speak calls', async () => {
    const { service } = await setupService(false);
    await expect(service.speak('Hallo Welt')).resolves.toBeUndefined();
  });

  it('skips empty text', async () => {
    const { service } = await setupService(false);
    await expect(service.speak('')).resolves.toBeUndefined();
    await expect(service.speak('   ')).resolves.toBeUndefined();
  });

  it('silently ignores stop calls', async () => {
    const { service } = await setupService(false);
    await expect(service.stop()).resolves.toBeUndefined();
  });

  it('returns empty voices list', async () => {
    const { service } = await setupService(false);
    const voices = await service.getAvailableVoices();
    expect(voices).toEqual([]);
  });

  it('returns all 19 supported languages', async () => {
    const { service } = await setupService(false);
    const languages = service.getSupportedLanguages();

    expect(languages).toHaveLength(19);
    expect(languages).toContain('de');
    expect(languages).toContain('en');
    expect(languages).toContain('ar');
    expect(languages).toContain('zh');
  });

  it('silently ignores rate changes', async () => {
    const { service } = await setupService(false);
    await expect(service.setRate(0.7)).resolves.toBeUndefined();
  });

  it('silently ignores pitch changes', async () => {
    const { service } = await setupService(false);
    await expect(service.setPitch(1.5)).resolves.toBeUndefined();
  });

  it('isSpeaking returns false', async () => {
    const { service } = await setupService(false);
    expect(service.isSpeaking()).toBe(false);
  });

  it('does not log spoken text content', async () => {
    const { service } = await setupService(false);
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

    await service.speak('Private medical information about patient');

    const allLogs = consoleSpy.mock.calls.flat().join(' ');
    expect(allLogs).not.toContain('Private medical');
    expect(allLogs).not.toContain('patient');

    consoleSpy.mockRestore();
  });

  it('destroy resets speaking state', async () => {
    const { service } = await setupService(false);
    service.destroy();
    expect(service.isSpeaking()).toBe(false);
  });
});

describe('TTSService (Supported Platform)', () => {
  it('sets up listeners and defaults on init', async () => {
    const { tts } = await setupService(true);
    const events = tts.addEventListener.mock.calls.map(call => call[0]);

    expect(events).toEqual(expect.arrayContaining(['tts-start', 'tts-finish', 'tts-cancel']));
    expect(tts.setDefaultRate).toHaveBeenCalledWith(0.5);
    expect(tts.setDefaultPitch).toHaveBeenCalledWith(1.0);
    expect(tts.setDefaultLanguage).toHaveBeenCalledWith('de-DE');
  });

  it('speaks text with mapped language', async () => {
    const { service, tts } = await setupService(true);
    await service.speak('Hello World', 'en');

    expect(tts.setDefaultLanguage).toHaveBeenCalledWith('en-US');
    expect(tts.speak).toHaveBeenCalledWith('Hello World');
  });

  it('truncates very long text', async () => {
    const { service, tts } = await setupService(true);
    const longText = 'a'.repeat(5000);
    await service.speak(longText);

    const calledText = tts.speak.mock.calls[0][0] as string;
    expect(calledText.length).toBeLessThanOrEqual(4003);
    expect(calledText.endsWith('...')).toBe(true);
  });

  it('falls back to German for unknown language', async () => {
    const { service, tts } = await setupService(true);
    await service.speak('test', 'xx');

    expect(tts.setDefaultLanguage).toHaveBeenCalledWith('de-DE');
  });

  it('clamps rate to valid range', async () => {
    const { service, tts } = await setupService(true);
    await service.setRate(2.0);
    await service.setRate(-0.5);

    expect(tts.setDefaultRate).toHaveBeenCalledWith(1.0);
    expect(tts.setDefaultRate).toHaveBeenCalledWith(0.1);
  });

  it('clamps pitch to valid range', async () => {
    const { service, tts } = await setupService(true);
    await service.setPitch(5.0);
    await service.setPitch(0.1);

    expect(tts.setDefaultPitch).toHaveBeenCalledWith(2.0);
    expect(tts.setDefaultPitch).toHaveBeenCalledWith(0.5);
  });

  it('returns available voices', async () => {
    const { service } = await setupService(true);
    const voices = await service.getAvailableVoices();

    expect(voices).toHaveLength(2);
    expect(voices[0].name).toBe('German Voice');
    expect(voices[1].language).toBe('en-US');
  });
});
