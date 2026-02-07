/**
 * useAccessibilityZoom - Global accessibility zoom state
 *
 * Provides app-wide font scaling and touch target enlargement
 * for users with visual impairments.
 *
 * @security No PII stored
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AccessibilityZoomState {
  isZoomed: boolean;
  fontScale: number;
  toggleZoom: () => void;
  setFontScale: (scale: number) => void;
}

export const useAccessibilityZoom = create<AccessibilityZoomState>()(
  persist(
    (set) => ({
      isZoomed: false,
      fontScale: 1.0,
      toggleZoom: () =>
        set((state) => ({
          isZoomed: !state.isZoomed,
          fontScale: state.isZoomed ? 1.0 : 1.3,
        })),
      setFontScale: (scale: number) =>
        set({
          fontScale: scale,
          isZoomed: scale > 1.0,
        }),
    }),
    {
      name: 'accessibility-zoom-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

export default useAccessibilityZoom;
