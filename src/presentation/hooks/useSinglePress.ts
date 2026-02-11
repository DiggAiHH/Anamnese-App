/**
 * useSinglePress — prevents double-tap/click on buttons.
 *
 * Wraps an async callback so that subsequent taps within the cooldown
 * period are silently ignored. The lock is released when the callback
 * resolves or after the cooldown timeout, whichever is later.
 *
 * @example
 * ```tsx
 * const handleSubmit = useSinglePress(async () => {
 *   await saveData();
 * });
 * <AppButton onPress={handleSubmit} />
 * ```
 */

import { useRef, useCallback } from 'react';

const DEFAULT_COOLDOWN_MS = 1000;

/**
 * @param callback - The async function to debounce
 * @param cooldownMs - Minimum interval between invocations (default 1000ms)
 * @returns A wrapped function that ignores rapid repeated calls
 */
export function useSinglePress<T extends (...args: any[]) => Promise<any> | void>(
  callback: T,
  cooldownMs: number = DEFAULT_COOLDOWN_MS,
): (...args: Parameters<T>) => void {
  const isLockedRef = useRef(false);

  return useCallback(
    (...args: Parameters<T>) => {
      if (isLockedRef.current) return;
      isLockedRef.current = true;

      const result = callback(...args);

      if (result instanceof Promise) {
        result.finally(() => {
          setTimeout(() => {
            isLockedRef.current = false;
          }, cooldownMs);
        });
      } else {
        setTimeout(() => {
          isLockedRef.current = false;
        }, cooldownMs);
      }
    },
    [callback, cooldownMs],
  );
}
