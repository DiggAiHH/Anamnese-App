describe('shouldShowToast', () => {
  it('returns true when no throttleKey is provided', () => {
    jest.resetModules();
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { shouldShowToast } = require('../../src/presentation/components/ToastProvider') as {
      shouldShowToast: (
        lastShownAtMs: number | undefined,
        nowMs: number,
        throttleMs: number | undefined,
      ) => boolean;
    };

    expect(shouldShowToast(undefined, 1000, undefined)).toBe(true);
    expect(shouldShowToast(undefined, 1000, 0)).toBe(true);
    expect(shouldShowToast(undefined, 1000, -1)).toBe(true);
    expect(shouldShowToast(1000, 1000, undefined)).toBe(true);
    expect(shouldShowToast(1000, 1000, 0)).toBe(true);
    expect(shouldShowToast(1000, 1000, -1)).toBe(true);
  });

  it('throttles calls within throttle window and allows after window', () => {
    jest.resetModules();
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { shouldShowToast } = require('../../src/presentation/components/ToastProvider') as {
      shouldShowToast: (
        lastShownAtMs: number | undefined,
        nowMs: number,
        throttleMs: number | undefined,
      ) => boolean;
    };

    expect(shouldShowToast(undefined, 1_000, 500)).toBe(true);
    expect(shouldShowToast(1_000, 1_200, 500)).toBe(false);
    expect(shouldShowToast(1_000, 1_600, 500)).toBe(true);
  });
});
