import { logError, sanitizeErrorToString } from './logger';

export type GlobalErrorHandlersOptions = {
  onUserError?: (error: unknown) => void;
  dedupeWindowMs?: number;
};

type GlobalHandlerState = {
  installed: boolean;
  options: GlobalErrorHandlersOptions;
  lastFingerprint: string | null;
  lastAt: number;
};

const STATE_KEY = '__ANAMNESE_GLOBAL_ERROR_HANDLER_STATE__';

const getState = (): GlobalHandlerState => {
  const existing = (globalThis as unknown as Record<string, unknown>)[STATE_KEY] as GlobalHandlerState | undefined;
  if (existing) {
    return existing;
  }

  const created: GlobalHandlerState = {
    installed: false,
    options: { dedupeWindowMs: 1500 },
    lastFingerprint: null,
    lastAt: 0,
  };

  (globalThis as unknown as Record<string, unknown>)[STATE_KEY] = created;
  return created;
};

const shouldNotify = (fingerprint: string): boolean => {
  const state = getState();
  const now = Date.now();
  const windowMs = state.options.dedupeWindowMs ?? 1500;

  if (state.lastFingerprint === fingerprint && now - state.lastAt < windowMs) {
    return false;
  }

  state.lastFingerprint = fingerprint;
  state.lastAt = now;
  return true;
};

const notifyUser = (error: unknown): void => {
  const state = getState();
  if (state.options.onUserError) {
    state.options.onUserError(error);
  }
};

const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) return error.message ?? '';
  if (typeof error === 'string') return error;
  if (error && typeof error === 'object') {
    const maybe = error as { message?: unknown };
    if (typeof maybe.message === 'string') return maybe.message;
  }
  return '';
};

/**
 * Some runtime/devtool errors should not be shown to end users.
 * These are typically transient in dev builds and not actionable within the app.
 */
export const shouldSuppressUserNotification = (error: unknown): boolean => {
  const message = getErrorMessage(error);
  if (!message) return false;

  // React Native devtools / inspector connectivity
  if (/Executor instance not connected to WebSocket endpoint/i.test(message)) return true;

  // React Native (Hermes) serialization edge case: NaN inside layout payloads
  if (/NaN.*serializ/i.test(message) && /layout/i.test(message)) return true;

  return false;
};

export const installGlobalErrorHandlers = (options: GlobalErrorHandlersOptions = {}): void => {
  const state = getState();
  state.options = { ...state.options, ...options };

  if (state.installed) {
    return;
  }
  state.installed = true;

  const errorUtils = (globalThis as unknown as { ErrorUtils?: unknown }).ErrorUtils as
    | {
        getGlobalHandler?: () => ((error: unknown, isFatal?: boolean) => void) | undefined;
        setGlobalHandler?: (handler: (error: unknown, isFatal?: boolean) => void) => void;
      }
    | undefined;

  if (errorUtils?.setGlobalHandler && errorUtils?.getGlobalHandler) {
    const previous = errorUtils.getGlobalHandler();
    errorUtils.setGlobalHandler((error, isFatal) => {
      const fingerprint = `rn:${String(isFatal)}:${sanitizeErrorToString(error)}`;
      logError(`[GlobalErrorHandler] ${isFatal ? 'Fatal' : 'Non-fatal'} JS error`, error);
      if (shouldNotify(fingerprint) && !shouldSuppressUserNotification(error)) {
        notifyUser(error);
      }
      if (previous) {
        previous(error, isFatal);
      }
    });
  }

  const maybeWindow = (globalThis as unknown as { window?: unknown }).window as
    | {
        addEventListener?: (name: string, handler: (event: unknown) => void) => void;
      }
    | undefined;

  if (maybeWindow?.addEventListener) {
    maybeWindow.addEventListener('error', event => {
      const error =
        (event as { error?: unknown; message?: unknown })?.error ??
        (event as { error?: unknown; message?: unknown })?.message;
      const fingerprint = `window:error:${sanitizeErrorToString(error)}`;
      logError('[GlobalErrorHandler] window.error', error);
      if (shouldNotify(fingerprint) && !shouldSuppressUserNotification(error)) {
        notifyUser(error);
      }
    });

    maybeWindow.addEventListener('unhandledrejection', event => {
      const error = (event as { reason?: unknown })?.reason;
      const fingerprint = `window:unhandledrejection:${sanitizeErrorToString(error)}`;
      logError('[GlobalErrorHandler] window.unhandledrejection', error);
      if (shouldNotify(fingerprint) && !shouldSuppressUserNotification(error)) {
        notifyUser(error);
      }
    });
  }
};

export const resetGlobalErrorHandlersForTests = (): void => {
  delete (globalThis as unknown as Record<string, unknown>)[STATE_KEY];
};
