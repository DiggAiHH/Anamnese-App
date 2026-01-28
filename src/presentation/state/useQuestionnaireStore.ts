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
import { enableMapSet } from 'immer';
import { QuestionnaireEntity, Section, Question } from '@domain/entities/Questionnaire';
import { PatientEntity } from '@domain/entities/Patient';
import { AnswerValue } from '@domain/entities/Answer';
import { saveActiveSession, clearActiveSession } from '@shared/sessionPersistence';

enableMapSet();

const HIDDEN_SECTION_IDS = new Set<string>(['q0000']);

function findNextVisibleSectionIndex(
  sections: Section[],
  startIndex: number,
  direction: 1 | -1,
): number {
  let i = startIndex;
  while (i >= 0 && i < sections.length) {
    if (!HIDDEN_SECTION_IDS.has(sections[i].id)) return i;
    i += direction;
  }
  return startIndex;
}

/**
 * User Mode Type
 */
export type UserMode = 'doctor' | 'patient' | null;

/**
 * State Interface
 */
interface QuestionnaireState {
  // User Mode (doctor/patient)
  userMode: UserMode;

  // Current Patient
  patient: PatientEntity | null;

  // Active IDs (for session resume)
  activePatientId: string | null;
  activeQuestionnaireId: string | null;

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
  // User Mode Action
  setUserMode: (mode: UserMode) => void;

  // Patient Actions
  setPatient: (patient: PatientEntity) => void;
  clearPatient: () => void;

  // Session IDs
  setActiveSessionIds: (patientId: string | null, questionnaireId: string | null) => void;
  clearActiveSessionIds: () => void;

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
  userMode: null,
  patient: null,
  activePatientId: null,
  activeQuestionnaireId: null,
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

    // User Mode Action
    setUserMode: mode =>
      set(state => {
        state.userMode = mode;
      }),

    // Patient Actions
    setPatient: patient =>
      set(state => {
        state.patient = patient;
        state.activePatientId = patient.id;
        void saveActiveSession({ patientId: patient.id });
      }),

    clearPatient: () =>
      set(state => {
        state.patient = null;
        state.activePatientId = null;
        void saveActiveSession({ patientId: null });
      }),

    // Session IDs
    setActiveSessionIds: (patientId, questionnaireId) =>
      set(state => {
        state.activePatientId = patientId;
        state.activeQuestionnaireId = questionnaireId;
      }),

    clearActiveSessionIds: () =>
      set(state => {
        state.activePatientId = null;
        state.activeQuestionnaireId = null;
        void clearActiveSession();
      }),

    // Questionnaire Actions
    setQuestionnaire: questionnaire =>
      set(state => {
        state.questionnaire = questionnaire;
        state.activeQuestionnaireId = questionnaire.id;
        state.currentSectionIndex = findNextVisibleSectionIndex(questionnaire.sections, 0, 1);
        void saveActiveSession({
          patientId: state.activePatientId,
          questionnaireId: questionnaire.id,
          currentSectionIndex: state.currentSectionIndex,
        });
      }),

    clearQuestionnaire: () =>
      set(state => {
        state.questionnaire = null;
        state.activeQuestionnaireId = null;
        state.currentSectionIndex = 0;
        void saveActiveSession({ questionnaireId: null, currentSectionIndex: 0 });
      }),

    // Answer Actions
    setAnswer: (questionId, value) =>
      set(state => {
        state.answers.set(questionId, value);
      }),

    setAnswers: answers =>
      set(state => {
        state.answers = new Map(answers);
      }),

    clearAnswers: () =>
      set(state => {
        state.answers = new Map();
      }),

    // Navigation Actions
    nextSection: () =>
      set(state => {
        const { questionnaire, currentSectionIndex } = get();

        if (questionnaire && currentSectionIndex < questionnaire.sections.length - 1) {
          const nextIndex = findNextVisibleSectionIndex(
            questionnaire.sections,
            currentSectionIndex + 1,
            1,
          );
          if (nextIndex >= 0 && nextIndex < questionnaire.sections.length) {
            state.currentSectionIndex = nextIndex;
            void saveActiveSession({
              currentSectionIndex: state.currentSectionIndex,
              questionnaireId: state.activeQuestionnaireId,
              patientId: state.activePatientId,
            });
          }
        }
      }),

    previousSection: () =>
      set(state => {
        const { currentSectionIndex } = get();

        if (currentSectionIndex > 0) {
          const { questionnaire } = get();
          if (!questionnaire) return;

          const prevIndex = findNextVisibleSectionIndex(
            questionnaire.sections,
            currentSectionIndex - 1,
            -1,
          );
          if (prevIndex >= 0 && prevIndex < questionnaire.sections.length) {
            state.currentSectionIndex = prevIndex;
            void saveActiveSession({
              currentSectionIndex: state.currentSectionIndex,
              questionnaireId: state.activeQuestionnaireId,
              patientId: state.activePatientId,
            });
          }
        }
      }),

    goToSection: index =>
      set(state => {
        const { questionnaire } = get();

        if (questionnaire && index >= 0 && index < questionnaire.sections.length) {
          const targetIndex = findNextVisibleSectionIndex(questionnaire.sections, index, 1);
          if (targetIndex >= 0 && targetIndex < questionnaire.sections.length) {
            state.currentSectionIndex = targetIndex;
            void saveActiveSession({
              currentSectionIndex: state.currentSectionIndex,
              questionnaireId: state.activeQuestionnaireId,
              patientId: state.activePatientId,
            });
          }
        }
      }),

    // Encryption Key
    setEncryptionKey: key =>
      set(state => {
        state.encryptionKey = key;
      }),

    clearEncryptionKey: () =>
      set(state => {
        state.encryptionKey = null;
      }),

    // Loading & Error
    setLoading: isLoading =>
      set(state => {
        state.isLoading = isLoading;
      }),

    setError: error =>
      set(state => {
        state.error = error;
      }),

    // Reset All
    reset: () => {
      void clearActiveSession();
      set(initialState);
    },
  })),
);

/**
 * Selectors (für Performance-Optimierung)
 */
export const selectCurrentSection = (
  state: QuestionnaireState & QuestionnaireActions,
): Section | null => {
  if (!state.questionnaire) return null;
  return state.questionnaire.sections[state.currentSectionIndex];
};

export const selectVisibleQuestions = (
  state: QuestionnaireState & QuestionnaireActions,
): Question[] => {
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
