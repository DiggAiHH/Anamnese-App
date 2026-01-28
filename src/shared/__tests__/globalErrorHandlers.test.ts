import { shouldSuppressUserNotification } from '../globalErrorHandlers';

describe('shouldSuppressUserNotification', () => {
  it('suppresses RN devtools websocket errors', () => {
    expect(
      shouldSuppressUserNotification(
        new Error('Executor instance not connected to WebSocket endpoint'),
      ),
    ).toBe(true);
  });

  it('suppresses NaN layout serialization errors', () => {
    expect(
      shouldSuppressUserNotification(
        new Error(
          'JSON object value was a NaN when serializing value at "arguments"<2<"layout"<"height"',
        ),
      ),
    ).toBe(true);
  });

  it('does not suppress unrelated errors', () => {
    expect(shouldSuppressUserNotification(new Error('Something else happened'))).toBe(false);
  });

  it('does not suppress non-message values', () => {
    expect(shouldSuppressUserNotification({})).toBe(false);
    expect(shouldSuppressUserNotification(null)).toBe(false);
  });
});
