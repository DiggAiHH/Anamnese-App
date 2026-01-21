import AsyncStorage from '@react-native-async-storage/async-storage';

const SESSION_KEY = 'active_session_v1';

export type ActiveSessionSnapshot = {
  patientId: string | null;
  questionnaireId: string | null;
  currentSectionIndex: number | null;
  updatedAt: number;
};

const normalizeSnapshot = (value: Partial<ActiveSessionSnapshot>): ActiveSessionSnapshot => {
  return {
    patientId: value.patientId ?? null,
    questionnaireId: value.questionnaireId ?? null,
    currentSectionIndex:
      typeof value.currentSectionIndex === 'number' ? value.currentSectionIndex : null,
    updatedAt: typeof value.updatedAt === 'number' ? value.updatedAt : Date.now(),
  };
};

export const loadActiveSession = async (): Promise<ActiveSessionSnapshot | null> => {
  try {
    const raw = await AsyncStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<ActiveSessionSnapshot>;
    return normalizeSnapshot(parsed);
  } catch {
    return null;
  }
};

export const saveActiveSession = async (
  partial: Partial<ActiveSessionSnapshot>,
): Promise<ActiveSessionSnapshot | null> => {
  try {
    const existing = await loadActiveSession();
    const next = normalizeSnapshot({
      ...existing,
      ...partial,
      updatedAt: Date.now(),
    });
    await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(next));
    return next;
  } catch {
    return null;
  }
};

export const clearActiveSession = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(SESSION_KEY);
  } catch {
    // ignore
  }
};
