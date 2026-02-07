/**
 * Jest Mock for react-native-tts
 *
 * This mock allows TTSService tests to run without the native module installed.
 * All TTS operations are no-ops that resolve immediately.
 *
 * @see src/infrastructure/speech/__tests__/TTSService.test.ts
 */

const mockTts = {
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
  removeEventListener: jest.fn(),
};

module.exports = mockTts;
module.exports.default = mockTts;
