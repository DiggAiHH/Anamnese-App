/**
 * Unit tests for BackendError types and utilities.
 */

import {
  BackendErrorCode,
  BackendResult,
  KeyState,
  KeyResult,
  ok,
  err,
  createErrorInfo,
  validationErr,
  validationOk,
  getErrorMessage,
  getErrorInfoMessage,
  isOk,
  isErr,
  isKeyActive,
  ERROR_MESSAGES,
} from '@shared/BackendError';

describe('BackendError', () => {
  describe('BackendErrorCode', () => {
    it('should have all expected error codes', () => {
      expect(BackendErrorCode.ENCRYPTION_KEY_MISSING).toBe('ENCRYPTION_KEY_MISSING');
      expect(BackendErrorCode.DATABASE_ERROR).toBe('DATABASE_ERROR');
      expect(BackendErrorCode.VALIDATION_ERROR).toBe('VALIDATION_ERROR');
      expect(BackendErrorCode.NOT_FOUND).toBe('NOT_FOUND');
      expect(BackendErrorCode.UNKNOWN_ERROR).toBe('UNKNOWN_ERROR');
    });
  });

  describe('KeyState', () => {
    it('should have all expected key states', () => {
      expect(KeyState.ACTIVE).toBe('ACTIVE');
      expect(KeyState.MISSING).toBe('MISSING');
      expect(KeyState.INVALID).toBe('INVALID');
      expect(KeyState.LOCKED).toBe('LOCKED');
    });
  });

  describe('ok()', () => {
    it('should create a successful result', () => {
      const result = ok('test data');
      
      expect(result.ok).toBe(true);
      expect((result as { ok: true; data: string }).data).toBe('test data');
    });

    it('should work with objects', () => {
      const data = { id: '123', name: 'test' };
      const result = ok(data);
      
      expect(result.ok).toBe(true);
      expect((result as { ok: true; data: typeof data }).data).toEqual(data);
    });

    it('should work with null', () => {
      const result = ok(null);
      
      expect(result.ok).toBe(true);
      expect((result as { ok: true; data: null }).data).toBeNull();
    });
  });

  describe('err()', () => {
    it('should create a failed result', () => {
      const result = err(BackendErrorCode.NOT_FOUND, 'Entity not found');
      
      expect(result.ok).toBe(false);
      expect((result as { ok: false; error: { code: string } }).error.code).toBe(BackendErrorCode.NOT_FOUND);
      expect((result as { ok: false; error: { message: string } }).error.message).toBe('Entity not found');
    });

    it('should include cause when provided', () => {
      const cause = new Error('Original error');
      const result = err(BackendErrorCode.DATABASE_ERROR, 'DB failed', { cause });
      
      expect(result.ok).toBe(false);
      expect((result as { ok: false; error: { cause: unknown } }).error.cause).toBe(cause);
    });

    it('should include context when provided', () => {
      const result = err(BackendErrorCode.VALIDATION_ERROR, 'Invalid input', {
        context: { field: 'email', attempted: 'test' },
      });
      
      expect(result.ok).toBe(false);
      expect((result as { ok: false; error: { context: Record<string, unknown> } }).error.context).toEqual({
        field: 'email',
        attempted: 'test',
      });
    });
  });

  describe('createErrorInfo()', () => {
    it('should create error info object', () => {
      const info = createErrorInfo(BackendErrorCode.ENCRYPTION_FAILED, 'Encryption failed');
      
      expect(info.code).toBe(BackendErrorCode.ENCRYPTION_FAILED);
      expect(info.message).toBe('Encryption failed');
    });
  });

  describe('validationOk()', () => {
    it('should create a valid validation result', () => {
      const result = validationOk();
      
      expect(result.valid).toBe(true);
    });
  });

  describe('validationErr()', () => {
    it('should create an invalid validation result', () => {
      const errors = [
        { field: 'email', message: 'Invalid email' },
        { field: 'name', message: 'Name required' },
      ];
      const result = validationErr(errors);
      
      expect(result.valid).toBe(false);
      expect((result as { valid: false; errors: typeof errors }).errors).toEqual(errors);
    });
  });

  describe('getErrorMessage()', () => {
    it('should return message for known error code', () => {
      const message = getErrorMessage(BackendErrorCode.ENCRYPTION_KEY_MISSING);
      
      expect(message).toBe(ERROR_MESSAGES[BackendErrorCode.ENCRYPTION_KEY_MISSING]);
    });

    it('should return unknown error message for undefined codes', () => {
      // Cast to test fallback behavior
      const message = getErrorMessage('FAKE_CODE' as BackendErrorCode);
      
      expect(message).toBe(ERROR_MESSAGES[BackendErrorCode.UNKNOWN_ERROR]);
    });
  });

  describe('getErrorInfoMessage()', () => {
    it('should return error message from error info', () => {
      const info = createErrorInfo(BackendErrorCode.NOT_FOUND, 'Custom message');
      const message = getErrorInfoMessage(info);
      
      expect(message).toBe('Custom message');
    });

    it('should fallback to error code message if message is empty', () => {
      const info = { code: BackendErrorCode.NOT_FOUND, message: '' };
      const message = getErrorInfoMessage(info);
      
      expect(message).toBe(ERROR_MESSAGES[BackendErrorCode.NOT_FOUND]);
    });
  });

  describe('isOk()', () => {
    it('should return true for successful results', () => {
      const result = ok('data');
      
      expect(isOk(result)).toBe(true);
    });

    it('should return false for failed results', () => {
      const result = err(BackendErrorCode.NOT_FOUND, 'Not found');
      
      expect(isOk(result)).toBe(false);
    });
  });

  describe('isErr()', () => {
    it('should return true for failed results', () => {
      const result = err(BackendErrorCode.NOT_FOUND, 'Not found');
      
      expect(isErr(result)).toBe(true);
    });

    it('should return false for successful results', () => {
      const result = ok('data');
      
      expect(isErr(result)).toBe(false);
    });
  });

  describe('isKeyActive()', () => {
    it('should return true for active key state', () => {
      const result: KeyResult = { state: KeyState.ACTIVE, key: 'test-key' };
      
      expect(isKeyActive(result)).toBe(true);
    });

    it('should return false for missing key state', () => {
      const result: KeyResult = { state: KeyState.MISSING };
      
      expect(isKeyActive(result)).toBe(false);
    });

    it('should return false for locked key state', () => {
      const result: KeyResult = { state: KeyState.LOCKED };
      
      expect(isKeyActive(result)).toBe(false);
    });
  });

  describe('Type narrowing', () => {
    it('should narrow BackendResult type with isOk', () => {
      const result: BackendResult<string> = ok('test');
      
      if (isOk(result)) {
        // TypeScript should know result.data exists here
        expect(result.data).toBe('test');
      }
    });

    it('should narrow BackendResult type with isErr', () => {
      const result: BackendResult<string> = err(BackendErrorCode.NOT_FOUND, 'Not found');
      
      if (isErr(result)) {
        // TypeScript should know result.error exists here
        expect(result.error.code).toBe(BackendErrorCode.NOT_FOUND);
      }
    });

    it('should narrow KeyResult type with isKeyActive', () => {
      const result: KeyResult = { state: KeyState.ACTIVE, key: 'secret' };
      
      if (isKeyActive(result)) {
        // TypeScript should know result.key exists here
        expect(result.key).toBe('secret');
      }
    });
  });
});
