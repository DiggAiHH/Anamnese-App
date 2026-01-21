/**
 * Unit tests for sanitizeError utility
 *
 * Tests GDPR compliance for error sanitization
 */

import {
  sanitizeError,
  sanitizeErrorToString,
  errorMayContainPII,
} from '../../src/shared/sanitizeError';

describe('sanitizeError', () => {
  describe('sanitizeError()', () => {
    it('should return SanitizedError for standard Error', () => {
      const error = new Error('Something went wrong');
      const result = sanitizeError(error);

      expect(result.type).toBe('Error');
      expect(result.message).toBe('Something went wrong');
      expect(result.code).toBeUndefined();
    });

    it('should handle TypeError correctly', () => {
      const error = new TypeError('Cannot read property');
      const result = sanitizeError(error);

      expect(result.type).toBe('TypeError');
      expect(result.message).toBe('Cannot read property');
    });

    it('should extract error code from object', () => {
      const error = { message: 'Connection failed', code: 'ECONNREFUSED' };
      const result = sanitizeError(error);

      expect(result.message).toBe('Connection failed');
      expect(result.code).toBe('ECONNREFUSED');
    });

    it('should handle string errors', () => {
      const result = sanitizeError('Simple error string');

      expect(result.type).toBe('UnknownError');
      expect(result.message).toBe('Simple error string');
    });

    it('should handle null/undefined', () => {
      expect(sanitizeError(null).message).toBe('Unknown error occurred');
      expect(sanitizeError(undefined).message).toBe('Unknown error occurred');
    });
  });

  describe('PII redaction', () => {
    it('should redact email addresses', () => {
      const error = new Error('User john.doe@example.com not found');
      const result = sanitizeError(error);

      expect(result.message).toBe('User [REDACTED] not found');
      expect(result.message).not.toContain('john.doe@example.com');
    });

    it('should redact phone numbers (US format)', () => {
      const error = new Error('Call failed to 555-123-4567');
      const result = sanitizeError(error);

      expect(result.message).toBe('Call failed to [REDACTED]');
    });

    it('should redact phone numbers (international format)', () => {
      const error = new Error('SMS failed to +49 123 456 7890');
      const result = sanitizeError(error);

      // Phone number is at least partially redacted
      expect(result.message).not.toContain('123 456 7890');
      expect(result.message).toContain('[REDACTED]');
    });

    it('should redact IP addresses', () => {
      const error = new Error('Connection from 192.168.1.100 refused');
      const result = sanitizeError(error);

      expect(result.message).toBe('Connection from [REDACTED] refused');
    });

    it('should redact Windows user paths', () => {
      const error = new Error('File not found: C:\\Users\\JohnDoe\\Documents\\file.txt');
      const result = sanitizeError(error);

      expect(result.message).toContain('[REDACTED]');
      expect(result.message).not.toContain('JohnDoe');
    });

    it('should redact Unix home paths', () => {
      const error = new Error('Permission denied: /home/johndoe/private.key');
      const result = sanitizeError(error);

      expect(result.message).toContain('[REDACTED]');
      expect(result.message).not.toContain('johndoe');
    });

    it('should redact UUIDs (potential patient IDs)', () => {
      const error = new Error('Patient 550e8400-e29b-41d4-a716-446655440000 not found');
      const result = sanitizeError(error);

      expect(result.message).toBe('Patient [REDACTED] not found');
    });

    it('should handle multiple PII occurrences', () => {
      const error = new Error('Email: test@test.com, Phone: 123-456-7890, IP: 10.0.0.1');
      const result = sanitizeError(error);

      expect(result.message).toBe('Email: [REDACTED], Phone: [REDACTED], IP: [REDACTED]');
    });
  });

  describe('sanitizeErrorToString()', () => {
    it('should format error as single line string', () => {
      const error = new Error('Database connection failed');
      const result = sanitizeErrorToString(error);

      expect(result).toBe('[Error] Database connection failed');
    });

    it('should include error code when present', () => {
      const error = { message: 'Network error', code: 'ERR_NETWORK' };
      const result = sanitizeErrorToString(error);

      expect(result).toBe('[UnknownError] Network error (code: ERR_NETWORK)');
    });

    it('should redact PII in string output', () => {
      const error = new Error('Failed for user@domain.com');
      const result = sanitizeErrorToString(error);

      expect(result).toBe('[Error] Failed for [REDACTED]');
    });
  });

  describe('errorMayContainPII()', () => {
    it('should return true when PII is detected and redacted', () => {
      const error = new Error('Error with email@example.com');
      expect(errorMayContainPII(error)).toBe(true);
    });

    it('should return false when no PII is detected', () => {
      const error = new Error('Simple technical error');
      expect(errorMayContainPII(error)).toBe(false);
    });

    it('should detect IP addresses as potential PII', () => {
      const error = new Error('Request from 127.0.0.1');
      expect(errorMayContainPII(error)).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('should handle empty error message', () => {
      const error = new Error('');
      const result = sanitizeError(error);

      // Empty message falls back to 'Unknown error'
      expect(result.message).toBe('Unknown error');
      expect(result.type).toBe('Error');
    });

    it('should handle very long error messages', () => {
      const longMessage = 'A'.repeat(10000);
      const error = new Error(longMessage);
      const result = sanitizeError(error);

      expect(result.message).toBe(longMessage);
    });

    it('should handle object with numeric code', () => {
      const error = { message: 'HTTP error', code: 404 };
      const result = sanitizeError(error);

      expect(result.code).toBe('404');
    });

    it('should handle object with errno', () => {
      const error = { message: 'FS error', errno: -2 };
      const result = sanitizeError(error);

      expect(result.code).toBe('-2');
    });
  });
});
