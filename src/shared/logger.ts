import { sanitizeError, sanitizeErrorToString } from './sanitizeError';
import {
  LogLevel,
  LogEventId,
  LogEventContext,
  LogEntry,
  shouldLog,
  LOG_LEVEL_THRESHOLD,
} from './LogEvents';

type LogFn = (message: string, error?: unknown) => void;

const isDev = typeof __DEV__ !== 'undefined' && __DEV__;

// Current log level threshold
let currentThreshold: LogLevel = isDev
  ? LOG_LEVEL_THRESHOLD.development
  : LOG_LEVEL_THRESHOLD.production;

/**
 * Set the current log level threshold.
 */
export const setLogThreshold = (level: LogLevel): void => {
  currentThreshold = level;
};

/**
 * Get the current log level threshold.
 */
export const getLogThreshold = (): LogLevel => currentThreshold;

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
    console.warn(message);
  }
};

/**
 * Info logging (dev only)
 */
export const logInfo: LogFn = message => {
  if (isDev) {
    console.info(message);
  }
};

/**
 * Error logging with PII sanitization (GDPR Art. 9 compliant)
 * In production: logs only sanitized error type
 * In dev: logs full sanitized error details
 */
export const logError: LogFn = (message, error) => {
  if (isDev) {
    console.error(message, error ? sanitizeError(error) : '');
  } else if (error) {
    // Production: minimal logging with PII stripped

    console.error(`[ERROR] ${sanitizeErrorToString(error)}`);
  }
};

/**
 * Structured log event function.
 * Use this for traceable, filterable logs with event IDs.
 *
 * @param eventId - Predefined event ID from LogEventId
 * @param level - Log level
 * @param message - Human-readable message (no PII!)
 * @param context - Optional additional context (no PII!)
 *
 * @example
 * ```ts
 * logEvent(LogEventId.DB_CONNECT_SUCCESS, LogLevel.INFO, 'Database connected', { durationMs: 150 });
 * ```
 */
export const logEvent = (
  eventId: LogEventId,
  level: LogLevel,
  message: string,
  context?: LogEventContext,
): void => {
  if (!shouldLog(level, currentThreshold)) {
    return;
  }

  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level,
    eventId,
    message,
    context,
  };

  // Format for console output
  const prefix = `[${entry.level}] [${entry.eventId}]`;
  const contextStr = context ? ` ${JSON.stringify(context)}` : '';

  switch (level) {
    case LogLevel.DEBUG:
      if (isDev) console.log(`${prefix} ${message}${contextStr}`);
      break;
    case LogLevel.INFO:
      if (isDev) console.log(`${prefix} ${message}${contextStr}`);
      break;
    case LogLevel.WARN:
      console.warn(`${prefix} ${message}${contextStr}`);
      break;
    case LogLevel.ERROR:
    case LogLevel.CRITICAL:
      console.error(`${prefix} ${message}${contextStr}`);
      break;
  }

  // Return entry for potential external logging systems
  return;
};

/**
 * Create a scoped logger with preset entity type.
 * Useful for repository or service classes.
 *
 * @example
 * ```ts
 * const logger = createScopedLogger('patient');
 * logger.info(LogEventId.REPO_SAVE_SUCCESS, 'Patient saved');
 * ```
 */
export const createScopedLogger = (entity: LogEventContext['entity']) => ({
  debug: (eventId: LogEventId, message: string, context?: Omit<LogEventContext, 'entity'>) =>
    logEvent(eventId, LogLevel.DEBUG, message, { ...context, entity }),
  info: (eventId: LogEventId, message: string, context?: Omit<LogEventContext, 'entity'>) =>
    logEvent(eventId, LogLevel.INFO, message, { ...context, entity }),
  warn: (eventId: LogEventId, message: string, context?: Omit<LogEventContext, 'entity'>) =>
    logEvent(eventId, LogLevel.WARN, message, { ...context, entity }),
  error: (eventId: LogEventId, message: string, context?: Omit<LogEventContext, 'entity'>) =>
    logEvent(eventId, LogLevel.ERROR, message, { ...context, entity }),
  critical: (eventId: LogEventId, message: string, context?: Omit<LogEventContext, 'entity'>) =>
    logEvent(eventId, LogLevel.CRITICAL, message, { ...context, entity }),
});

// Re-export sanitization utilities for direct use
export { sanitizeError, sanitizeErrorToString } from './sanitizeError';

// Re-export log types for consumers
export { LogLevel, LogEventId } from './LogEvents';
export type { LogEventContext, LogEntry } from './LogEvents';
