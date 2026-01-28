/**
 * Log Event Registry
 *
 * Predefined event IDs for structured, traceable logging.
 * Each event ID is unique and categorized for easy filtering.
 *
 * Categories:
 * - DB_*     - Database operations
 * - CRYPTO_* - Encryption/decryption
 * - AUTH_*   - Key management
 * - VALIDATION_* - Validation errors
 * - APP_*    - Application lifecycle
 * - USER_*   - User-facing events
 *
 * DSGVO Art. 9 compliant: No PII in event data.
 */

/**
 * Log levels for structured logging.
 */
export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
  CRITICAL = 'CRITICAL',
}

/**
 * Log event IDs enum.
 * Format: CATEGORY_ACTION_DETAIL
 */
export enum LogEventId {
  // Database events (DB_*)
  DB_CONNECT_START = 'DB_CONNECT_START',
  DB_CONNECT_SUCCESS = 'DB_CONNECT_SUCCESS',
  DB_CONNECT_FAIL = 'DB_CONNECT_FAIL',
  DB_QUERY_START = 'DB_QUERY_START',
  DB_QUERY_SUCCESS = 'DB_QUERY_SUCCESS',
  DB_QUERY_FAIL = 'DB_QUERY_FAIL',
  DB_TRANSACTION_START = 'DB_TRANSACTION_START',
  DB_TRANSACTION_COMMIT = 'DB_TRANSACTION_COMMIT',
  DB_TRANSACTION_ROLLBACK = 'DB_TRANSACTION_ROLLBACK',
  DB_MIGRATION_START = 'DB_MIGRATION_START',
  DB_MIGRATION_SUCCESS = 'DB_MIGRATION_SUCCESS',
  DB_MIGRATION_FAIL = 'DB_MIGRATION_FAIL',
  DB_CLEAR_ALL = 'DB_CLEAR_ALL',

  // Encryption events (CRYPTO_*)
  CRYPTO_ENCRYPT_START = 'CRYPTO_ENCRYPT_START',
  CRYPTO_ENCRYPT_SUCCESS = 'CRYPTO_ENCRYPT_SUCCESS',
  CRYPTO_ENCRYPT_FAIL = 'CRYPTO_ENCRYPT_FAIL',
  CRYPTO_DECRYPT_START = 'CRYPTO_DECRYPT_START',
  CRYPTO_DECRYPT_SUCCESS = 'CRYPTO_DECRYPT_SUCCESS',
  CRYPTO_DECRYPT_FAIL = 'CRYPTO_DECRYPT_FAIL',
  CRYPTO_KEY_DERIVE_START = 'CRYPTO_KEY_DERIVE_START',
  CRYPTO_KEY_DERIVE_SUCCESS = 'CRYPTO_KEY_DERIVE_SUCCESS',
  CRYPTO_KEY_DERIVE_FAIL = 'CRYPTO_KEY_DERIVE_FAIL',

  // Key management events (AUTH_*)
  AUTH_KEY_SET = 'AUTH_KEY_SET',
  AUTH_KEY_CLEAR = 'AUTH_KEY_CLEAR',
  AUTH_KEY_LOAD = 'AUTH_KEY_LOAD',
  AUTH_KEY_PERSIST = 'AUTH_KEY_PERSIST',
  AUTH_KEY_MISSING = 'AUTH_KEY_MISSING',
  AUTH_KEY_INVALID = 'AUTH_KEY_INVALID',
  AUTH_KEYCHAIN_AVAILABLE = 'AUTH_KEYCHAIN_AVAILABLE',
  AUTH_KEYCHAIN_UNAVAILABLE = 'AUTH_KEYCHAIN_UNAVAILABLE',

  // Validation events (VALIDATION_*)
  VALIDATION_START = 'VALIDATION_START',
  VALIDATION_SUCCESS = 'VALIDATION_SUCCESS',
  VALIDATION_FAIL = 'VALIDATION_FAIL',
  VALIDATION_PATIENT = 'VALIDATION_PATIENT',
  VALIDATION_ANSWER = 'VALIDATION_ANSWER',
  VALIDATION_CONSENT = 'VALIDATION_CONSENT',

  // Application lifecycle events (APP_*)
  APP_START = 'APP_START',
  APP_READY = 'APP_READY',
  APP_ERROR = 'APP_ERROR',
  APP_CRASH = 'APP_CRASH',
  APP_BACKGROUND = 'APP_BACKGROUND',
  APP_FOREGROUND = 'APP_FOREGROUND',

  // User-facing events (USER_*)
  USER_ERROR_SHOWN = 'USER_ERROR_SHOWN',
  USER_ACTION = 'USER_ACTION',

  // Repository events (REPO_*)
  REPO_SAVE_START = 'REPO_SAVE_START',
  REPO_SAVE_SUCCESS = 'REPO_SAVE_SUCCESS',
  REPO_SAVE_FAIL = 'REPO_SAVE_FAIL',
  REPO_FIND_START = 'REPO_FIND_START',
  REPO_FIND_SUCCESS = 'REPO_FIND_SUCCESS',
  REPO_FIND_FAIL = 'REPO_FIND_FAIL',
  REPO_DELETE_START = 'REPO_DELETE_START',
  REPO_DELETE_SUCCESS = 'REPO_DELETE_SUCCESS',
  REPO_DELETE_FAIL = 'REPO_DELETE_FAIL',

  // Backup events (BACKUP_*)
  BACKUP_CREATE_START = 'BACKUP_CREATE_START',
  BACKUP_CREATE_SUCCESS = 'BACKUP_CREATE_SUCCESS',
  BACKUP_CREATE_FAIL = 'BACKUP_CREATE_FAIL',
  BACKUP_RESTORE_START = 'BACKUP_RESTORE_START',
  BACKUP_RESTORE_SUCCESS = 'BACKUP_RESTORE_SUCCESS',
  BACKUP_RESTORE_FAIL = 'BACKUP_RESTORE_FAIL',
  BACKUP_INTEGRITY_CHECK = 'BACKUP_INTEGRITY_CHECK',
  BACKUP_INTEGRITY_FAIL = 'BACKUP_INTEGRITY_FAIL',
}

/**
 * Log event context type.
 * Additional data to include with log events (no PII!).
 */
export interface LogEventContext {
  /** Entity type being operated on */
  entity?: 'patient' | 'answer' | 'questionnaire' | 'consent' | 'document' | 'backup';
  /** Operation type */
  operation?: 'create' | 'read' | 'update' | 'delete' | 'encrypt' | 'decrypt';
  /** Duration in milliseconds */
  durationMs?: number;
  /** Additional safe context (no PII) */
  [key: string]: unknown;
}

/**
 * Structured log entry type.
 */
export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  eventId: LogEventId;
  message: string;
  context?: LogEventContext;
}

/**
 * Default log level thresholds for different environments.
 */
export const LOG_LEVEL_THRESHOLD = {
  development: LogLevel.DEBUG,
  test: LogLevel.WARN,
  production: LogLevel.ERROR,
} as const;

/**
 * Get numeric value for log level comparison.
 */
export function getLogLevelValue(level: LogLevel): number {
  const values: Record<LogLevel, number> = {
    [LogLevel.DEBUG]: 0,
    [LogLevel.INFO]: 1,
    [LogLevel.WARN]: 2,
    [LogLevel.ERROR]: 3,
    [LogLevel.CRITICAL]: 4,
  };
  return values[level];
}

/**
 * Check if a log level should be logged based on threshold.
 */
export function shouldLog(level: LogLevel, threshold: LogLevel): boolean {
  return getLogLevelValue(level) >= getLogLevelValue(threshold);
}
