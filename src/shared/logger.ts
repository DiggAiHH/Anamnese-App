import { sanitizeError, sanitizeErrorToString } from './sanitizeError';

type LogFn = (message: string, error?: unknown) => void;

const isDev = typeof __DEV__ !== 'undefined' && __DEV__;

/**
 * Debug logging (dev only)
 */
export const logDebug: LogFn = message => {
  if (isDev) {
    // eslint-disable-next-line no-console
    console.log(message);
  }
};

/**
 * Warning logging (dev only)
 */
export const logWarn: LogFn = message => {
  if (isDev) {
    // eslint-disable-next-line no-console
    console.warn(message);
  }
};

/**
 * Error logging with PII sanitization (GDPR Art. 9 compliant)
 * In production: logs only sanitized error type
 * In dev: logs full sanitized error details
 */
export const logError: LogFn = (message, error) => {
  if (isDev) {
    // eslint-disable-next-line no-console
    console.error(message, error ? sanitizeError(error) : '');
  } else if (error) {
    // Production: minimal logging with PII stripped
    // eslint-disable-next-line no-console
    console.error(`[ERROR] ${sanitizeErrorToString(error)}`);
  }
};

// Re-export sanitization utilities for direct use
export { sanitizeError, sanitizeErrorToString } from './sanitizeError';
