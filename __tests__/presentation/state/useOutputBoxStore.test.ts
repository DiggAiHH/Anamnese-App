import { useOutputBoxStore } from '../../../src/presentation/state/useOutputBoxStore';
import AsyncStorage from '@react-native-async-storage/async-storage';

// AsyncStorage is globally mocked in jest.setup.js

// Logger mock
jest.mock('../../../src/shared/logger', () => ({
  logError: jest.fn(),
  logWarn: jest.fn(),
}));

describe('useOutputBoxStore', () => {
  beforeEach(async () => {
    // Reset store state between tests
    useOutputBoxStore.setState({ expanded: false, loaded: false });
    await AsyncStorage.clear();
    jest.clearAllMocks();
  });

  it('has default state (collapsed, not loaded)', () => {
    const state = useOutputBoxStore.getState();
    expect(state.expanded).toBe(false);
    expect(state.loaded).toBe(false);
  });

  it('toggle() flips expanded state', () => {
    const { toggle } = useOutputBoxStore.getState();

    toggle();
    expect(useOutputBoxStore.getState().expanded).toBe(true);

    toggle();
    expect(useOutputBoxStore.getState().expanded).toBe(false);
  });

  it('toggle() persists to AsyncStorage', async () => {
    useOutputBoxStore.getState().toggle();

    // Allow async persist to complete
    await new Promise(resolve => setTimeout(resolve, 10));

    const stored = await AsyncStorage.getItem('output_box_expanded');
    expect(stored).toBe('true');
  });

  it('setExpanded() sets explicit value', () => {
    useOutputBoxStore.getState().setExpanded(true);
    expect(useOutputBoxStore.getState().expanded).toBe(true);

    useOutputBoxStore.getState().setExpanded(false);
    expect(useOutputBoxStore.getState().expanded).toBe(false);
  });

  it('setExpanded() persists to AsyncStorage', async () => {
    useOutputBoxStore.getState().setExpanded(true);

    await new Promise(resolve => setTimeout(resolve, 10));

    const stored = await AsyncStorage.getItem('output_box_expanded');
    expect(stored).toBe('true');
  });

  it('loadPersistedState() restores expanded=true from storage', async () => {
    await AsyncStorage.setItem('output_box_expanded', 'true');

    await useOutputBoxStore.getState().loadPersistedState();

    const state = useOutputBoxStore.getState();
    expect(state.expanded).toBe(true);
    expect(state.loaded).toBe(true);
  });

  it('loadPersistedState() sets loaded=true even with no stored value', async () => {
    await useOutputBoxStore.getState().loadPersistedState();

    const state = useOutputBoxStore.getState();
    expect(state.expanded).toBe(false);
    expect(state.loaded).toBe(true);
  });

  it('loadPersistedState() sets loaded=true on error', async () => {
    // Simulate storage error
    (AsyncStorage.getItem as jest.Mock).mockRejectedValueOnce(new Error('fail'));

    await useOutputBoxStore.getState().loadPersistedState();

    const state = useOutputBoxStore.getState();
    expect(state.loaded).toBe(true);
  });
});
