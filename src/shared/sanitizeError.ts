/**
 * GDPR-compliant error sanitization utility
 *
 * Strips potentially sensitive information from error objects before logging.
 * Ensures no PII, stack traces with user data, or sensitive context leaks into logs.
 *
 * @security This module is critical for DSGVO Art. 9 compliance
 */

/**
 * Sanitized error representation safe for logging
 */
export interface SanitizedError {
  /** Error type/name (e.g., 'TypeError', 'NetworkError') */
  type: string;
  /** Generic error message without PII */
  message: string;
  /** Error code if available */
  code?: string;
}

/**
 * PII patterns to detect and redact in error messages
 */
const PII_PATTERNS = [
  // Email addresses
  /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/gi,
  // Phone numbers (various formats)
  /\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/g,
  /\+\d{1,3}[-.\s]?\d{2,4}[-.\s]?\d{2,4}[-.\s]?\d{2,4}\b/g,
  // German phone format
  /\b0\d{2,4}[-.\s]?\d{4,8}\b/g,
  // IP addresses
  /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g,
  // File paths with usernames (Windows)
  /C:\\Users\\[^\\]+/gi,
  // File paths with usernames (Unix)
  /\/home\/[^/]+/gi,
  // UUID-like patient IDs (keep generic, just note presence)
  /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi,
];

/**
 * Redact PII from a string
 */
function redactPII(text: string): string {
  let sanitized = text;
  PII_PATTERNS.forEach(pattern => {
    sanitized = sanitized.replace(pattern, '[REDACTED]');
  });
  return sanitized;
}

/**
 * Extract error code from various error types
 */
function extractErrorCode(error: unknown): string | undefined {
  if (error && typeof error === 'object') {
    const err = error as Record<string, unknown>;
    if (typeof err.code === 'string' || typeof err.code === 'number') {
      return String(err.code);
    }
    if (typeof err.errno === 'string' || typeof err.errno === 'number') {
      return String(err.errno);
    }
  }
  return undefined;
}

/**
 * Get a safe, generic message from an error
 */
function getSafeMessage(error: unknown): string {
  if (error instanceof Error) {
    // Redact any PII that might be in the message
    const rawMessage = error.message || 'Unknown error';
    return redactPII(rawMessage);
  }

  if (typeof error === 'string') {
    return redactPII(error);
  }

  if (error && typeof error === 'object') {
    const err = error as Record<string, unknown>;
    if (typeof err.message === 'string') {
      return redactPII(err.message);
    }
  }

  return 'Unknown error occurred';
}

/**
 * Sanitize an error for safe logging
 *
 * @param error - Any error value (Error, string, object, etc.)
 * @returns Sanitized error object safe for logging
 *
 * @example
 * try {
 *   await riskyOperation();
 * } catch (error) {
 *   const safe = sanitizeError(error);
 *   logError(`Operation failed: ${safe.type}`, safe);
 * }
 */
export function sanitizeError(error: unknown): SanitizedError {
  const type = error instanceof Error ? error.name : 'UnknownError';
  const message = getSafeMessage(error);
  const code = extractErrorCode(error);

  return {
    type,
    message,
    ...(code && { code }),
  };
}

/**
 * Create a loggable string from a sanitized error
 *
 * @param error - Any error value
 * @returns A single-line string safe for logging
 */
export function sanitizeErrorToString(error: unknown): string {
  const { type, message, code } = sanitizeError(error);
  const codeStr = code ? ` (code: ${code})` : '';
  return `[${type}] ${message}${codeStr}`;
}

/**
 * Check if error appears to contain PII
 * Useful for additional validation before logging
 */
export function errorMayContainPII(error: unknown): boolean {
  const message = getSafeMessage(error);
  return message.includes('[REDACTED]');
}
