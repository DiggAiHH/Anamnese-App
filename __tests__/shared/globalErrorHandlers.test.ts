describe('globalErrorHandlers', () => {
  const originalErrorUtils = (globalThis as unknown as { ErrorUtils?: unknown }).ErrorUtils;
  const originalWindow = (globalThis as unknown as { window?: unknown }).window;

  afterEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    (globalThis as unknown as { ErrorUtils?: unknown }).ErrorUtils = originalErrorUtils;
    (globalThis as unknown as { window?: unknown }).window = originalWindow;
  });

  it('installs ErrorUtils global handler and notifies once per dedupe window', () => {
    jest.resetModules();

    const logError = jest.fn();
    jest.doMock('../../src/shared/logger', () => ({
      logError,
      sanitizeErrorToString: (error: unknown) =>
        error instanceof Error ? error.message : typeof error === 'string' ? error : 'unknown',
    }));

    const previousHandler = jest.fn();
    const setGlobalHandler = jest.fn();
    const getGlobalHandler = jest.fn(() => previousHandler);
    (globalThis as unknown as { ErrorUtils?: unknown }).ErrorUtils = {
      setGlobalHandler,
      getGlobalHandler,
    };

    const {
      installGlobalErrorHandlers,
      resetGlobalErrorHandlersForTests,
    } = require('../../src/shared/globalErrorHandlers');
    const onUserError = jest.fn();

    const nowSpy = jest.spyOn(Date, 'now');
    nowSpy.mockReturnValue(1000);
    installGlobalErrorHandlers({ onUserError, dedupeWindowMs: 1500 });

    expect(setGlobalHandler).toHaveBeenCalledTimes(1);
    const installedHandler = setGlobalHandler.mock.calls[0][0];

    const error = new Error('boom');
    installedHandler(error, true);
    installedHandler(error, true);

    expect(logError).toHaveBeenCalled();
    expect(onUserError).toHaveBeenCalledTimes(1);
    expect(previousHandler).toHaveBeenCalledTimes(2);

    nowSpy.mockReturnValue(3000);
    installedHandler(error, true);
    expect(onUserError).toHaveBeenCalledTimes(2);

    nowSpy.mockRestore();
    resetGlobalErrorHandlersForTests();
  });

  it('installs window error handlers and notifies on events', () => {
    jest.resetModules();

    const logError = jest.fn();
    jest.doMock('../../src/shared/logger', () => ({
      logError,
      sanitizeErrorToString: (error: unknown) =>
        error instanceof Error ? error.message : typeof error === 'string' ? error : 'unknown',
    }));

    const listeners: Record<string, (event: unknown) => void> = {};
    (globalThis as unknown as { window?: unknown }).window = {
      addEventListener: (name: string, handler: (event: unknown) => void) => {
        listeners[name] = handler;
      },
    };

    const {
      installGlobalErrorHandlers,
      resetGlobalErrorHandlersForTests,
    } = require('../../src/shared/globalErrorHandlers');
    const onUserError = jest.fn();

    const nowSpy = jest.spyOn(Date, 'now');
    nowSpy.mockReturnValue(1000);
    installGlobalErrorHandlers({ onUserError, dedupeWindowMs: 1500 });

    listeners.error?.({ message: 'window error' });
    listeners.unhandledrejection?.({ reason: new Error('rejected') });

    expect(logError).toHaveBeenCalled();
    expect(onUserError).toHaveBeenCalledTimes(2);

    nowSpy.mockRestore();
    resetGlobalErrorHandlersForTests();
  });
});
