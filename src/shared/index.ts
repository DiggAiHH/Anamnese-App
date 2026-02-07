/**
 * Shared Module Exports
 *
 * Central export point for all shared utilities, types, and helpers.
 */

// Error handling
export {
  BackendErrorCode,
  KeyState,
  ok,
  err,
  createErrorInfo,
  validationErr,
  validationOk,
  ERROR_MESSAGES,
  getErrorMessage,
  getErrorInfoMessage,
  isOk,
  isErr,
  isKeyActive,
} from './BackendError';

export type {
  BackendErrorInfo,
  BackendResult,
  KeyResult,
  ValidationError,
  ValidationResult,
} from './BackendError';

// Logging
export { logDebug, logWarn, logError, sanitizeError, sanitizeErrorToString } from './logger';

// Key management
export {
  getActiveEncryptionKey,
  setActiveEncryptionKey,
  clearActiveEncryptionKey,
  loadPersistedEncryptionKeyIfOptedIn,
  clearPersistedEncryptionKey,
  isSecureKeyStorageAvailable,
  getKeyOptIn,
  setKeyOptIn,
} from './keyManager';

// Platform capabilities
export {
  platformOS,
  supportsSQLite,
  supportsSecureKeychain,
  canUseSQLite,
  canUseQuickCrypto,
} from './platformCapabilities';

// User-facing errors
export { showUserErrorAlert, reportUserError } from './userFacingError';

// Validation
export { isMissingRequiredAnswer } from './questionnaireValidation';

// Error sanitization
export { sanitizeError as sanitizeErrorObject } from './sanitizeError';

// Global error handlers
export { installGlobalErrorHandlers } from './globalErrorHandlers';
