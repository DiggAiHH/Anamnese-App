/**
 * BackendError - Typed Error System for Backend Operations
 *
 * Provides consistent error handling across all backend operations:
 * - Encryption/decryption
 * - Database operations
 * - Validation
 * - Key management
 *
 * DSGVO Art. 9 compliant: Error messages never contain PII.
 *
 * @security Error codes designed to be user-friendly without exposing system internals.
 */

/**
 * Backend error codes enum.
 * Used for programmatic error handling and i18n-ready error messages.
 */
export enum BackendErrorCode {
  // Encryption errors (1xx)
  ENCRYPTION_KEY_MISSING = 'ENCRYPTION_KEY_MISSING',
  ENCRYPTION_KEY_INVALID = 'ENCRYPTION_KEY_INVALID',
  ENCRYPTION_FAILED = 'ENCRYPTION_FAILED',
  DECRYPTION_FAILED = 'DECRYPTION_FAILED',

  // Database errors (2xx)
  DATABASE_ERROR = 'DATABASE_ERROR',
  DATABASE_NOT_CONNECTED = 'DATABASE_NOT_CONNECTED',
  DATABASE_SCHEMA_ERROR = 'DATABASE_SCHEMA_ERROR',

  // Entity errors (3xx)
  NOT_FOUND = 'NOT_FOUND',
  ALREADY_EXISTS = 'ALREADY_EXISTS',
  CONSTRAINT_VIOLATION = 'CONSTRAINT_VIOLATION',

  // Validation errors (4xx)
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_INPUT = 'INVALID_INPUT',
  REQUIRED_FIELD_MISSING = 'REQUIRED_FIELD_MISSING',

  // Backup errors (5xx)
  BACKUP_INTEGRITY_ERROR = 'BACKUP_INTEGRITY_ERROR',
  BACKUP_VERSION_MISMATCH = 'BACKUP_VERSION_MISMATCH',
  BACKUP_CORRUPTED = 'BACKUP_CORRUPTED',

  // Key management errors (6xx)
  KEY_STORAGE_ERROR = 'KEY_STORAGE_ERROR',
  KEY_RETRIEVAL_ERROR = 'KEY_RETRIEVAL_ERROR',
  KEY_PERSISTENCE_ERROR = 'KEY_PERSISTENCE_ERROR',

  // Generic errors (9xx)
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
  OPERATION_CANCELLED = 'OPERATION_CANCELLED',
  TIMEOUT = 'TIMEOUT',
}

/**
 * Key lifecycle states for encryption key management.
 */
export enum KeyState {
  /** Key is loaded and ready for use */
  ACTIVE = 'ACTIVE',
  /** No key has been set */
  MISSING = 'MISSING',
  /** Key failed validation */
  INVALID = 'INVALID',
  /** Key is locked (secure storage access denied) */
  LOCKED = 'LOCKED',
}

/**
 * Detailed error information with code, message, and optional cause.
 * Designed for both programmatic handling and user-facing messages.
 */
export interface BackendErrorInfo {
  /** Error code for programmatic handling */
  code: BackendErrorCode;
  /** Human-readable error message (no PII) */
  message: string;
  /** Original error cause (optional, for debugging) */
  cause?: unknown;
  /** Additional context (no PII) */
  context?: Record<string, unknown>;
}

/**
 * Discriminated union type for backend operation results.
 * Enforces explicit error handling without exceptions.
 *
 * @example
 * ```ts
 * const result = await repository.findById(id);
 * if (result.ok) {
 *   console.log(result.data);
 * } else {
 *   handleError(result.error);
 * }
 * ```
 */
export type BackendResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: BackendErrorInfo };

/**
 * Key result type for key manager operations.
 */
export type KeyResult =
  | { state: KeyState.ACTIVE; key: string }
  | { state: KeyState.MISSING | KeyState.INVALID | KeyState.LOCKED; key?: never };

/**
 * Validation result type for validators.
 */
export interface ValidationError {
  /** Field that failed validation */
  field: string;
  /** Error message for this field */
  message: string;
  /** Error code for this validation error */
  code?: BackendErrorCode;
}

export type ValidationResult =
  | { valid: true }
  | { valid: false; errors: ValidationError[] };

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * Create a successful result.
 */
export function ok<T>(data: T): BackendResult<T> {
  return { ok: true, data };
}

/**
 * Create a failed result with error info.
 */
export function err<T>(
  code: BackendErrorCode,
  message: string,
  options?: { cause?: unknown; context?: Record<string, unknown> },
): BackendResult<T> {
  return {
    ok: false,
    error: {
      code,
      message,
      cause: options?.cause,
      context: options?.context,
    },
  };
}

/**
 * Create error info object.
 */
export function createErrorInfo(
  code: BackendErrorCode,
  message: string,
  options?: { cause?: unknown; context?: Record<string, unknown> },
): BackendErrorInfo {
  return {
    code,
    message,
    cause: options?.cause,
    context: options?.context,
  };
}

/**
 * Create a validation result with errors.
 */
export function validationErr(errors: ValidationError[]): ValidationResult {
  return { valid: false, errors };
}

/**
 * Create a successful validation result.
 */
export function validationOk(): ValidationResult {
  return { valid: true };
}

// ============================================================================
// Error Message Mapping (i18n-ready)
// ============================================================================

/**
 * User-friendly error messages for each error code.
 * These messages are safe to display to users (no PII, no system internals).
 */
export const ERROR_MESSAGES: Record<BackendErrorCode, string> = {
  // Encryption errors
  [BackendErrorCode.ENCRYPTION_KEY_MISSING]:
    'Bitte entsperren Sie die Sitzung mit Ihrem Passwort.',
  [BackendErrorCode.ENCRYPTION_KEY_INVALID]:
    'Das Passwort ist ungültig. Bitte versuchen Sie es erneut.',
  [BackendErrorCode.ENCRYPTION_FAILED]:
    'Die Daten konnten nicht verschlüsselt werden. Bitte versuchen Sie es erneut.',
  [BackendErrorCode.DECRYPTION_FAILED]:
    'Die Daten konnten nicht entschlüsselt werden. Möglicherweise ist das Passwort falsch.',

  // Database errors
  [BackendErrorCode.DATABASE_ERROR]:
    'Ein Datenbankfehler ist aufgetreten. Bitte versuchen Sie es erneut.',
  [BackendErrorCode.DATABASE_NOT_CONNECTED]:
    'Die Datenbank ist nicht verbunden. Bitte starten Sie die App neu.',
  [BackendErrorCode.DATABASE_SCHEMA_ERROR]:
    'Ein Schema-Fehler ist aufgetreten. Bitte aktualisieren Sie die App.',

  // Entity errors
  [BackendErrorCode.NOT_FOUND]: 'Der Eintrag wurde nicht gefunden.',
  [BackendErrorCode.ALREADY_EXISTS]: 'Ein Eintrag mit diesen Daten existiert bereits.',
  [BackendErrorCode.CONSTRAINT_VIOLATION]:
    'Die Daten verletzen eine Einschränkung. Bitte überprüfen Sie Ihre Eingaben.',

  // Validation errors
  [BackendErrorCode.VALIDATION_ERROR]:
    'Die Eingabe ist ungültig. Bitte überprüfen Sie Ihre Daten.',
  [BackendErrorCode.INVALID_INPUT]:
    'Die Eingabe hat ein ungültiges Format.',
  [BackendErrorCode.REQUIRED_FIELD_MISSING]:
    'Ein Pflichtfeld fehlt. Bitte füllen Sie alle erforderlichen Felder aus.',

  // Backup errors
  [BackendErrorCode.BACKUP_INTEGRITY_ERROR]:
    'Das Backup ist beschädigt oder wurde manipuliert.',
  [BackendErrorCode.BACKUP_VERSION_MISMATCH]:
    'Die Backup-Version ist nicht kompatibel mit dieser App-Version.',
  [BackendErrorCode.BACKUP_CORRUPTED]:
    'Das Backup ist beschädigt und kann nicht wiederhergestellt werden.',

  // Key management errors
  [BackendErrorCode.KEY_STORAGE_ERROR]:
    'Der Schlüssel konnte nicht gespeichert werden.',
  [BackendErrorCode.KEY_RETRIEVAL_ERROR]:
    'Der Schlüssel konnte nicht abgerufen werden.',
  [BackendErrorCode.KEY_PERSISTENCE_ERROR]:
    'Der Schlüssel konnte nicht dauerhaft gespeichert werden.',

  // Generic errors
  [BackendErrorCode.UNKNOWN_ERROR]:
    'Ein unbekannter Fehler ist aufgetreten. Bitte versuchen Sie es erneut.',
  [BackendErrorCode.OPERATION_CANCELLED]: 'Die Operation wurde abgebrochen.',
  [BackendErrorCode.TIMEOUT]:
    'Die Operation hat zu lange gedauert. Bitte versuchen Sie es erneut.',
};

/**
 * Get user-friendly message for an error code.
 */
export function getErrorMessage(code: BackendErrorCode): string {
  return ERROR_MESSAGES[code] ?? ERROR_MESSAGES[BackendErrorCode.UNKNOWN_ERROR];
}

/**
 * Get user-friendly message from BackendErrorInfo.
 */
export function getErrorInfoMessage(error: BackendErrorInfo): string {
  return error.message || getErrorMessage(error.code);
}

// ============================================================================
// Type Guards
// ============================================================================

/**
 * Type guard for successful results.
 */
export function isOk<T>(result: BackendResult<T>): result is { ok: true; data: T } {
  return result.ok === true;
}

/**
 * Type guard for failed results.
 */
export function isErr<T>(
  result: BackendResult<T>,
): result is { ok: false; error: BackendErrorInfo } {
  return result.ok === false;
}

/**
 * Type guard for active key state.
 */
export function isKeyActive(result: KeyResult): result is { state: KeyState.ACTIVE; key: string } {
  return result.state === KeyState.ACTIVE;
}
