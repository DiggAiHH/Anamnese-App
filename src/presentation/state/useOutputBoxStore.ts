/**
 * useOutputBoxStore - Zustand store for OutputBox UI state
 *
 * Manages the collapsed/expanded state of the OutputBox component.
 * Persisted via AsyncStorage so users' preference survives session restarts.
 *
 * @security No PII. UI state only.
 */

import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { logError } from '../../shared/logger';

const STORAGE_KEY = 'output_box_expanded';

interface OutputBoxState {
  /** Whether the output box is currently expanded */
  expanded: boolean;
  /** Whether the persisted state has been loaded */
  loaded: boolean;
  /** Toggle expand/collapse */
  toggle: () => void;
  /** Set expanded state explicitly */
  setExpanded: (value: boolean) => void;
  /** Load persisted state from AsyncStorage */
  loadPersistedState: () => Promise<void>;
}

export const useOutputBoxStore = create<OutputBoxState>((set, get) => ({
  expanded: false,
  loaded: false,

  toggle: () => {
    const next = !get().expanded;
    set({ expanded: next });
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(e =>
      logError('Failed to persist OutputBox state', e),
    );
  },

  setExpanded: (value: boolean) => {
    set({ expanded: value });
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(value)).catch(e =>
      logError('Failed to persist OutputBox state', e),
    );
  },

  loadPersistedState: async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored !== null) {
        set({ expanded: JSON.parse(stored), loaded: true });
      } else {
        set({ loaded: true });
      }
    } catch (e) {
      logError('Failed to load OutputBox state', e);
      set({ loaded: true });
    }
  },
}));
