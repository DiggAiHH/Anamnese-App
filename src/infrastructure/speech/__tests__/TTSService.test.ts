/**
 * TTSService Unit Tests
 * 
 * Tests the Text-to-Speech service with mocked react-native-tts.
 * Verifies GDPR compliance (no PII in logs) and proper language handling.
 */

// Mock the module - Jest hoists this
jest.mock('react-native-tts', () => ({
  __esModule: true,
  default: {
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
  },
}));

jest.mock('@shared/platformCapabilities', () => ({
  supportsTTS: true,
}));

// Import AFTER mock
import Tts from 'react-native-tts';
import { TTSService } from '../TTSService';

// Get references to the mocked functions for assertions
const mockedTts = Tts as jest.Mocked<typeof Tts>;

describe('TTSService', () => {
  let service: TTSService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new TTSService();
  });

  describe('initialization', () => {
    it('should set up event listeners on construction', () => {
      expect(mockedTts.addEventListener).toHaveBeenCalledWith('tts-start', expect.any(Function));
      expect(mockedTts.addEventListener).toHaveBeenCalledWith('tts-finish', expect.any(Function));
      expect(mockedTts.addEventListener).toHaveBeenCalledWith('tts-cancel', expect.any(Function));
    });

    it('should set default rate and pitch', () => {
      expect(mockedTts.setDefaultRate).toHaveBeenCalledWith(0.5);
      expect(mockedTts.setDefaultPitch).toHaveBeenCalledWith(1.0);
    });

    it('should set default language to German', () => {
      expect(mockedTts.setDefaultLanguage).toHaveBeenCalledWith('de-DE');
    });
  });

  describe('speak()', () => {
    it('should speak text in default language', async () => {
      await service.speak('Hallo Welt');
      
      expect(mockedTts.speak).toHaveBeenCalledWith('Hallo Welt');
    });

    it('should set language before speaking', async () => {
      await service.speak('Hello World', 'en');
      
      expect(mockedTts.setDefaultLanguage).toHaveBeenCalledWith('en-US');
      expect(mockedTts.speak).toHaveBeenCalledWith('Hello World');
    });

    it('should skip empty text', async () => {
      await service.speak('');
      await service.speak('   ');
      
      expect(mockedTts.speak).not.toHaveBeenCalled();
    });

    it('should truncate very long text', async () => {
      const longText = 'a'.repeat(5000);
      await service.speak(longText);
      
      expect(mockedTts.speak).toHaveBeenCalled();
      const calledText = (mockedTts.speak as jest.Mock).mock.calls[0][0] as string;
      expect(calledText.length).toBeLessThanOrEqual(4003); // 4000 + '...'
      expect(calledText.endsWith('...')).toBe(true);
    });

    it('should map all 19 languages correctly', async () => {
      const languageTests = [
        { app: 'de', tts: 'de-DE' },
        { app: 'en', tts: 'en-US' },
        { app: 'ar', tts: 'ar-SA' },
        { app: 'el', tts: 'el-GR' },
        { app: 'es', tts: 'es-ES' },
        { app: 'fa', tts: 'fa-IR' },
        { app: 'fr', tts: 'fr-FR' },
        { app: 'it', tts: 'it-IT' },
        { app: 'ja', tts: 'ja-JP' },
        { app: 'ko', tts: 'ko-KR' },
        { app: 'nl', tts: 'nl-NL' },
        { app: 'pl', tts: 'pl-PL' },
        { app: 'pt', tts: 'pt-BR' },
        { app: 'ro', tts: 'ro-RO' },
        { app: 'ru', tts: 'ru-RU' },
        { app: 'tr', tts: 'tr-TR' },
        { app: 'uk', tts: 'uk-UA' },
        { app: 'vi', tts: 'vi-VN' },
        { app: 'zh', tts: 'zh-CN' },
      ];

      for (const { app, tts } of languageTests) {
        jest.clearAllMocks();
        await service.speak('test', app);
        expect(mockedTts.setDefaultLanguage).toHaveBeenCalledWith(tts);
      }
    });

    it('should fallback to German for unknown language', async () => {
      await service.speak('test', 'xx');
      
      expect(mockedTts.setDefaultLanguage).toHaveBeenCalledWith('de-DE');
    });
  });

  describe('stop()', () => {
    it('should stop TTS playback', async () => {
      await service.stop();
      
      expect(mockedTts.stop).toHaveBeenCalled();
    });
  });

  describe('getAvailableVoices()', () => {
    it('should return available voices', async () => {
      const voices = await service.getAvailableVoices();
      
      expect(voices).toHaveLength(2);
      expect(voices[0].name).toBe('German Voice');
      expect(voices[1].language).toBe('en-US');
    });

    it('should return empty array on error', async () => {
      (mockedTts.voices as jest.Mock).mockRejectedValueOnce(new Error('No voices'));
      
      const voices = await service.getAvailableVoices();
      
      expect(voices).toEqual([]);
    });
  });

  describe('getSupportedLanguages()', () => {
    it('should return all 19 supported languages', () => {
      const languages = service.getSupportedLanguages();
      
      expect(languages).toHaveLength(19);
      expect(languages).toContain('de');
      expect(languages).toContain('en');
      expect(languages).toContain('ar');
      expect(languages).toContain('zh');
    });
  });

  describe('setRate()', () => {
    it('should set speech rate', async () => {
      await service.setRate(0.7);
      
      expect(mockedTts.setDefaultRate).toHaveBeenCalledWith(0.7);
    });

    it('should clamp rate to valid range', async () => {
      await service.setRate(2.0);
      expect(mockedTts.setDefaultRate).toHaveBeenLastCalledWith(1.0);

      await service.setRate(-0.5);
      expect(mockedTts.setDefaultRate).toHaveBeenLastCalledWith(0.1);
    });
  });

  describe('setPitch()', () => {
    it('should set speech pitch', async () => {
      await service.setPitch(1.5);
      
      expect(mockedTts.setDefaultPitch).toHaveBeenCalledWith(1.5);
    });

    it('should clamp pitch to valid range', async () => {
      await service.setPitch(5.0);
      expect(mockedTts.setDefaultPitch).toHaveBeenLastCalledWith(2.0);

      await service.setPitch(0.1);
      expect(mockedTts.setDefaultPitch).toHaveBeenLastCalledWith(0.5);
    });
  });

  describe('isSpeaking()', () => {
    it('should return false initially', () => {
      expect(service.isSpeaking()).toBe(false);
    });
  });

  describe('GDPR Compliance', () => {
    it('should NOT log spoken text content', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      await service.speak('Private medical information about patient');
      
      // Check that no log contains the sensitive text
      const allLogs = consoleSpy.mock.calls.flat().join(' ');
      expect(allLogs).not.toContain('Private medical');
      expect(allLogs).not.toContain('patient');
      
      consoleSpy.mockRestore();
    });

    it('should only log metadata (language, length)', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      await service.speak('Test text', 'en');
      
      const allLogs = consoleSpy.mock.calls.flat().join(' ');
      // Should log language and character count only
      expect(allLogs).toContain('en-US');
      expect(allLogs).toContain('chars');
      
      consoleSpy.mockRestore();
    });
  });

  describe('destroy()', () => {
    it('should cleanup resources and reset state', () => {
      service.destroy();
      
      // Destroy should reset speaking state
      expect(service.isSpeaking()).toBe(false);
      // stop() is only called if currently speaking
    });

    it('should stop playback if currently speaking', async () => {
      // Simulate speaking state by calling speak
      await service.speak('Test text');
      
      // Manually trigger the start event callback to set speaking=true
      const startCallback = (mockedTts.addEventListener as jest.Mock).mock.calls
        .find(call => call[0] === 'tts-start')?.[1];
      if (startCallback) {
        startCallback();
      }
      
      jest.clearAllMocks();
      service.destroy();
      
      // Now stop should have been called
      expect(mockedTts.stop).toHaveBeenCalled();
    });
  });
});
