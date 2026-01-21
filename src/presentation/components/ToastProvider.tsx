import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

export type ToastVariant = 'default' | 'info' | 'success' | 'error';

export type ToastOptions = {
  message: string;
  title?: string;
  variant?: ToastVariant;
  durationMs?: number;
  throttleKey?: string;
  throttleMs?: number;
};

type ToastState = {
  id: number;
  message: string;
  title?: string;
  variant: ToastVariant;
};

export type ToastApi = {
  /**
   * Shows a toast. Returns true if shown, false if throttled/ignored.
   */
  showToast: (options: ToastOptions) => boolean;
  hideToast: () => void;
  isVisible: boolean;
  toast: ToastState | null;
};

const ToastContext = createContext<ToastApi | null>(null);

/**
 * Throttle helper.
 * Pure helper: does not mutate state.
 */
export function shouldShowToast(
  lastShownAtMs: number | undefined,
  nowMs: number,
  throttleMs: number | undefined,
): boolean {
  if (!throttleMs || throttleMs <= 0) return true;
  if (typeof lastShownAtMs !== 'number') return true;
  return nowMs - lastShownAtMs >= throttleMs;
}

export type ToastProviderProps = {
  children: React.ReactNode;
  /** Default auto-dismiss duration (ms). */
  defaultDurationMs?: number;
  /** Optional style override for the toast container. */
  toastContainerStyle?: StyleProp<ViewStyle>;
};

export function ToastProvider({
  children,
  defaultDurationMs = 3000,
  toastContainerStyle,
}: ToastProviderProps): React.JSX.Element {
  const [toast, setToast] = useState<ToastState | null>(null);

  const mountedRef = useRef(true);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const nextIdRef = useRef(1);
  const lastShownAtByKeyRef = useRef<Map<string, number>>(new Map());

  const clearTimer = useCallback((): void => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const hideToast = useCallback((): void => {
    clearTimer();
    if (!mountedRef.current) return;
    setToast(null);
  }, [clearTimer]);

  const showToast = useCallback(
    (options: ToastOptions): boolean => {
      const { message, title, variant = 'default', durationMs, throttleKey, throttleMs } = options;

      if (!message || message.trim().length === 0) {
        return false;
      }

      if (throttleKey && throttleKey.length > 0 && throttleMs && throttleMs > 0) {
        const nowMs = Date.now();
        const lastShownAtMs = lastShownAtByKeyRef.current.get(throttleKey);
        if (!shouldShowToast(lastShownAtMs, nowMs, throttleMs)) {
          return false;
        }
        lastShownAtByKeyRef.current.set(throttleKey, nowMs);
      }

      const resolvedDuration =
        typeof durationMs === 'number' && durationMs >= 0 ? durationMs : defaultDurationMs;

      clearTimer();

      const id = nextIdRef.current++;
      if (mountedRef.current) {
        setToast({ id, message, title, variant });
      }

      if (resolvedDuration > 0) {
        timeoutRef.current = setTimeout(() => {
          // Avoid clearing a newer toast if one was shown since.
          if (!mountedRef.current) return;
          setToast(current => {
            if (!current) return null;
            if (current.id !== id) return current;
            return null;
          });
        }, resolvedDuration);
      }

      return true;
    },
    [clearTimer, defaultDurationMs],
  );

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      clearTimer();
    };
  }, [clearTimer]);

  const value: ToastApi = useMemo(
    () => ({
      showToast,
      hideToast,
      isVisible: toast != null,
      toast,
    }),
    [hideToast, showToast, toast],
  );

  return (
    <ToastContext.Provider value={value}>
      <View style={styles.root} pointerEvents="box-none">
        {children}
        <ToastHost toast={toast} containerStyle={toastContainerStyle} />
      </View>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return ctx;
}

type ToastHostProps = {
  toast: ToastState | null;
  containerStyle?: StyleProp<ViewStyle>;
};

function ToastHost({ toast, containerStyle }: ToastHostProps): React.JSX.Element | null {
  if (!toast) return null;

  const accentColor = toast.variant === 'error' ? '#ef4444' : '#2563eb';
  const accessibilityLabel = toast.title ? `${toast.title}. ${toast.message}` : toast.message;

  return (
    <View pointerEvents="none" style={styles.host}>
      <View
        accessibilityRole="text"
        accessibilityLiveRegion="polite"
        accessibilityLabel={accessibilityLabel}
        style={[styles.toast, { borderLeftColor: accentColor }, containerStyle]}>
        <View style={styles.textBlock}>
          {toast.title ? <Text style={styles.title}>{toast.title}</Text> : null}
          <Text style={styles.message}>{toast.message}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  host: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 24,
    paddingHorizontal: 16,
  },
  toast: {
    backgroundColor: '#1f2937',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderLeftWidth: 6,
    paddingVertical: 12,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  textBlock: {
    flex: 1,
    paddingRight: 12,
  },
  title: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  message: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
});
