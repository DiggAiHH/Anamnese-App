/**
 * TTSService Unit Tests
 * 
 * Tests the Text-to-Speech service behavior.
 * Verifies GDPR compliance (no PII in logs) and proper language handling.
 * 
 * Note: TTSService validates react-native-tts module shape at load time.
 * When the module is unavailable or has missing methods, TTSService enters
 * a graceful "mock mode" that silently ignores all TTS calls.
 * 
 * These tests verify the mock mode behavior when the TTS module is unavailable,
 * and the moduleShape.test.ts covers the actual module validation logic.
 */

// Mock platformCapabilities to simulate unsupported platform (mock mode)
jest.mock('@shared/platformCapabilities', () => ({
  supportsTTS: false, // Force mock mode
}));

// Mock react-native-tts but the module won't be used due to supportsTTS=false
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

// Import AFTER mock
import { TTSService } from '../TTSService';

describe('TTSService (Mock Mode - TTS Unavailable)', () => {
  let service: TTSService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new TTSService();
  });

  describe('initialization in mock mode', () => {
    it('should initialize without errors when TTS unavailable', () => {
      expect(service).toBeDefined();
    });
  });

  describe('speak() in mock mode', () => {
    it('should silently ignore speak calls when TTS unavailable', async () => {
      // Should not throw
      await expect(service.speak('Hallo Welt')).resolves.toBeUndefined();
    });

    it('should skip empty text', async () => {
      await expect(service.speak('')).resolves.toBeUndefined();
      await expect(service.speak('   ')).resolves.toBeUndefined();
    });
  });

  describe('stop() in mock mode', () => {
    it('should silently ignore stop calls when TTS unavailable', async () => {
      await expect(service.stop()).resolves.toBeUndefined();
    });
  });

  describe('getAvailableVoices() in mock mode', () => {
    it('should return empty array when TTS unavailable', async () => {
      const voices = await service.getAvailableVoices();
      expect(voices).toEqual([]);
    });
  });

  describe('getSupportedLanguages()', () => {
    it('should return all 19 supported languages even in mock mode', () => {
      const languages = service.getSupportedLanguages();
      
      expect(languages).toHaveLength(19);
      expect(languages).toContain('de');
      expect(languages).toContain('en');
      expect(languages).toContain('ar');
      expect(languages).toContain('zh');
    });
  });

  describe('setRate() in mock mode', () => {
    it('should silently ignore rate changes when TTS unavailable', async () => {
      await expect(service.setRate(0.7)).resolves.toBeUndefined();
    });
  });

  describe('setPitch() in mock mode', () => {
    it('should silently ignore pitch changes when TTS unavailable', async () => {
      await expect(service.setPitch(1.5)).resolves.toBeUndefined();
    });
  });

  describe('isSpeaking()', () => {
    it('should return false in mock mode', () => {
      expect(service.isSpeaking()).toBe(false);
    });
  });

  describe('GDPR Compliance', () => {
    it('should NOT log spoken text content even in mock mode', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      await service.speak('Private medical information about patient');
      
      // Check that no log contains the sensitive text
      const allLogs = consoleSpy.mock.calls.flat().join(' ');
      expect(allLogs).not.toContain('Private medical');
      expect(allLogs).not.toContain('patient');
      
      consoleSpy.mockRestore();
    });
  });

  describe('destroy()', () => {
    it('should cleanup resources and reset state', () => {
      service.destroy();
      expect(service.isSpeaking()).toBe(false);
    });
  });
});
