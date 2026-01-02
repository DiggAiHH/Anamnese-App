/**
 * Zustand Store - Global State Management
 * 
 * VERBINDUNG:
 * Components (Presentation Layer)
 *   ↔ Zustand Store (State Management)
 *   ↔ Use Cases (Application Layer)
 *   ↔ Repositories (Infrastructure Layer)
 */

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { QuestionnaireEntity } from '@domain/entities/Questionnaire';
import { PatientEntity } from '@domain/entities/Patient';
import { AnswerValue } from '@domain/entities/Answer';

/**
 * State Interface
 */
interface QuestionnaireState {
  // Current Patient
  patient: PatientEntity | null;
  
  // Current Questionnaire
  questionnaire: QuestionnaireEntity | null;
  
  // Answers (questionId -> value)
  answers: Map<string, AnswerValue>;
  
  // Current Section Index
  currentSectionIndex: number;
  
  // Encryption Key (Session)
  encryptionKey: string | null;
  
  // Loading State
  isLoading: boolean;
  
  // Error State
  error: string | null;
}

/**
 * Actions Interface
 */
interface QuestionnaireActions {
  // Patient Actions
  setPatient: (patient: PatientEntity) => void;
  clearPatient: () => void;
  
  // Questionnaire Actions
  setQuestionnaire: (questionnaire: QuestionnaireEntity) => void;
  clearQuestionnaire: () => void;
  
  // Answer Actions
  setAnswer: (questionId: string, value: AnswerValue) => void;
  setAnswers: (answers: Map<string, AnswerValue>) => void;
  clearAnswers: () => void;
  
  // Navigation Actions
  nextSection: () => void;
  previousSection: () => void;
  goToSection: (index: number) => void;
  
  // Encryption Key
  setEncryptionKey: (key: string) => void;
  clearEncryptionKey: () => void;
  
  // Loading & Error
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  
  // Reset All
  reset: () => void;
}

/**
 * Initial State
 */
const initialState: QuestionnaireState = {
  patient: null,
  questionnaire: null,
  answers: new Map(),
  currentSectionIndex: 0,
  encryptionKey: null,
  isLoading: false,
  error: null,
};

/**
 * Zustand Store mit Immer Middleware (für immutable updates)
 */
export const useQuestionnaireStore = create<QuestionnaireState & QuestionnaireActions>()(
  immer((set, get) => ({
    // State
    ...initialState,

    // Patient Actions
    setPatient: (patient) =>
      set((state) => {
        state.patient = patient;
      }),

    clearPatient: () =>
      set((state) => {
        state.patient = null;
      }),

    // Questionnaire Actions
    setQuestionnaire: (questionnaire) =>
      set((state) => {
        state.questionnaire = questionnaire;
        state.currentSectionIndex = 0;
      }),

    clearQuestionnaire: () =>
      set((state) => {
        state.questionnaire = null;
        state.currentSectionIndex = 0;
      }),

    // Answer Actions
    setAnswer: (questionId, value) =>
      set((state) => {
        state.answers.set(questionId, value);
      }),

    setAnswers: (answers) =>
      set((state) => {
        state.answers = new Map(answers);
      }),

    clearAnswers: () =>
      set((state) => {
        state.answers = new Map();
      }),

    // Navigation Actions
    nextSection: () =>
      set((state) => {
        const { questionnaire, currentSectionIndex } = get();
        
        if (questionnaire && currentSectionIndex < questionnaire.sections.length - 1) {
          state.currentSectionIndex = currentSectionIndex + 1;
        }
      }),

    previousSection: () =>
      set((state) => {
        const { currentSectionIndex } = get();
        
        if (currentSectionIndex > 0) {
          state.currentSectionIndex = currentSectionIndex - 1;
        }
      }),

    goToSection: (index) =>
      set((state) => {
        const { questionnaire } = get();
        
        if (questionnaire && index >= 0 && index < questionnaire.sections.length) {
          state.currentSectionIndex = index;
        }
      }),

    // Encryption Key
    setEncryptionKey: (key) =>
      set((state) => {
        state.encryptionKey = key;
      }),

    clearEncryptionKey: () =>
      set((state) => {
        state.encryptionKey = null;
      }),

    // Loading & Error
    setLoading: (isLoading) =>
      set((state) => {
        state.isLoading = isLoading;
      }),

    setError: (error) =>
      set((state) => {
        state.error = error;
      }),

    // Reset All
    reset: () => set(initialState),
  })),
);

/**
 * Selectors (für Performance-Optimierung)
 */
export const selectCurrentSection = (state: QuestionnaireState & QuestionnaireActions) => {
  if (!state.questionnaire) return null;
  return state.questionnaire.sections[state.currentSectionIndex];
};

export const selectVisibleQuestions = (state: QuestionnaireState & QuestionnaireActions) => {
  const { questionnaire, currentSectionIndex, answers } = state;
  
  if (!questionnaire) return [];
  
  const section = questionnaire.sections[currentSectionIndex];
  if (!section) return [];
  
  return questionnaire.getVisibleQuestions(answers, section.id);
};

export const selectProgress = (state: QuestionnaireState & QuestionnaireActions): number => {
  const { questionnaire, answers } = state;
  
  if (!questionnaire) return 0;
  
  return questionnaire.calculateProgress(answers);
};
