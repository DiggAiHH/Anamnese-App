/**
 * QuestionnaireScreen - Hauptbildschirm für Fragebogen
 * ISO/WCAG: Token-based design system
 *
 * VOLLSTÄNDIGER DATENFLUSS:
 *
 * 1. User öffnet Screen
 *    ↓
 * 2. LoadQuestionnaireUseCase lädt Questionnaire + Answers
 *    ↓
 * 3. Store wird aktualisiert (setQuestionnaire, setAnswers)
 *    ↓
 * 4. Component rendert aktuelle Sektion mit Fragen
 *    ↓
 * 5. User beantwortet Frage (QuestionCard)
 *    ↓
 * 6. onValueChange → Store.setAnswer
 *    ↓
 * 7. SaveAnswerUseCase speichert verschlüsselt in DB
 *    ↓
 * 8. Conditional Logic evaluated (getVisibleQuestions)
 *    ↓
 * 9. UI updated automatisch (Zustand)
 */

import React, { useEffect, useMemo, useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';

import { AppText } from '../components/AppText';
import { useTranslation } from 'react-i18next';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { QuestionCard } from '../components/QuestionCard';
import { AppButton } from '../components/AppButton';
import { LinkedItemsBox } from '../components/LinkedItemsBox';
import { TemplateMigrationService } from '../../infrastructure/services/TemplateMigrationService';
import {
  useQuestionnaireStore,
  selectCurrentSection,
  selectVisibleQuestions,
  selectProgress,
} from '../state/useQuestionnaireStore';
import { AnswerValue } from '@domain/entities/Answer';
import type { Question } from '@domain/entities/Questionnaire';
import { colors, spacing, radius } from '../theme/tokens';
import { logWarn, logError } from '../../shared/logger';
import { isMissingRequiredAnswer } from '../../shared/questionnaireValidation';

// Use Cases
import { LoadQuestionnaireUseCase } from '@application/use-cases/LoadQuestionnaireUseCase';
import { SaveAnswerUseCase } from '@application/use-cases/SaveAnswerUseCase';

// Repositories (DI - Dependency Injection)
import { SQLiteQuestionnaireRepository } from '@infrastructure/persistence/SQLiteQuestionnaireRepository';
import { SQLiteAnswerRepository } from '@infrastructure/persistence/SQLiteAnswerRepository';
import { SQLitePatientRepository } from '@infrastructure/persistence/SQLitePatientRepository';
import { encryptionService } from '@infrastructure/encryption/encryptionService';

type Props = NativeStackScreenProps<RootStackParamList, 'Questionnaire'>;

export const QuestionnaireScreen = ({ route, navigation }: Props): React.JSX.Element => {
  const { t } = useTranslation();
  const questionnaireId = route.params?.questionnaireId;

  // Zustand Store
  const {
    patient,
    questionnaire,
    answers,
    currentSectionIndex,
    encryptionKey,
    activePatientId,
    activeQuestionnaireId,
    isLoading,
    error,
    setQuestionnaire,
    setAnswers,
    setAnswer,
    setPatient,
    setLoading,
    setError,
    nextSection,
    previousSection,
    goToSection,
  } = useQuestionnaireStore();

  // Local state for Single Question Mode
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const pendingQuestionJumpRef = useRef<string | null>(null);

  // Selectors (reactive - subscribe to store changes)
  const currentSection = useQuestionnaireStore(selectCurrentSection);
  const visibleQuestions = useQuestionnaireStore(selectVisibleQuestions);

  // Reset/Update question index when section changes
  useEffect(() => {
    if (pendingQuestionJumpRef.current) {
      // We are jumping to a specific question (Deep Link)
      const targetId = pendingQuestionJumpRef.current;
      const targetIndex = visibleQuestions.findIndex(q => q.id === targetId);

      if (targetIndex !== -1) {
        setCurrentQuestionIndex(targetIndex);
      } else {
        // Fallback if not found (e.g. hidden by condition)
        setCurrentQuestionIndex(0);
      }
      // Clear the jump ref
      pendingQuestionJumpRef.current = null;
    } else {
      // Normal section navigation -> Start at first question
      setCurrentQuestionIndex(0);
    }
  }, [currentSectionIndex, visibleQuestions]); // Re-run when section (and thus visible questions) changes
  const currentQuestion = visibleQuestions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === visibleQuestions.length - 1;
  const isFirstQuestion = currentQuestionIndex === 0;
  const progress = useQuestionnaireStore(selectProgress);
  const safeProgress = Number.isFinite(progress) ? progress : 0;
  const isLastSection = questionnaire ? currentSectionIndex === questionnaire.sections.length - 1 : false;

  // Local State
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const [showSectionNav, setShowSectionNav] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [pendingSaves, setPendingSaves] = useState(0);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [saveStatusError, setSaveStatusError] = useState<string | null>(null);

  // Use Cases — memoized to avoid re-instantiation on every render (H-2 fix)
  const loadQuestionnaireUseCase = useMemo(
    () =>
      new LoadQuestionnaireUseCase(
        new SQLiteQuestionnaireRepository(),
        new SQLiteAnswerRepository(),
        new SQLitePatientRepository(),
      ),
    [],
  );

  const saveAnswerUseCase = useMemo(
    () => new SaveAnswerUseCase(new SQLiteAnswerRepository(), encryptionService),
    [],
  );



  // ...

  /**
   * Load Questionnaire on Mount
   */
  useEffect(() => {
    const init = async () => {
      // Run migration (idempotent)
      try {
        const migration = new TemplateMigrationService();
        await migration.migrate();
      } catch (e) {
        logError('Migration failed', e);
      }
      loadQuestionnaire();
    };
    init();
  }, []);

  /**
   * Load Questionnaire + Answers
   */
  const loadQuestionnaire = async (): Promise<void> => {
    setLoading(true);
    setError(null);

    const storedPatientId = patient?.id ?? activePatientId;
    let resolvedPatient = patient;

    if (!resolvedPatient && storedPatientId && encryptionKey) {
      try {
        const patientRepo = new SQLitePatientRepository();
        const loaded = await patientRepo.findById(storedPatientId);
        if (loaded) {
          setPatient(loaded);
          resolvedPatient = loaded;
        }
      } catch {
        // ignore: fallback to error handling below
      }
    }

    if (!resolvedPatient || !encryptionKey) {
      setError(t('questionnaire.patientMissing'));
      setLoading(false);
      return;
    }

    try {
      const resumeQuestionnaireId = questionnaireId ?? activeQuestionnaireId ?? undefined;
      const withTimeout = async <T,>(promise: Promise<T>, ms: number): Promise<T> => {
        let timeoutId: ReturnType<typeof setTimeout> | undefined;
        try {
          return await Promise.race([
            promise,
            new Promise<T>((_, reject) => {
              timeoutId = setTimeout(() => {
                reject(new Error('Questionnaire load timeout'));
              }, ms);
            }),
          ]);
        } finally {
          if (timeoutId) {
            clearTimeout(timeoutId);
          }
        }
      };

      const result = await withTimeout(
        loadQuestionnaireUseCase.execute({
          patientId: resolvedPatient.id,
          questionnaireId: resumeQuestionnaireId,
          encryptionKey,
        }),
        10000,
      );

      if (result.success && result.questionnaire && result.answers) {
        const questionnaireEntity = result.questionnaire;

        const parseIsoDateParts = (
          iso: string,
        ): { year: number; month: number; day: number } | null => {
          const m = /^\s*(\d{4})-(\d{2})-(\d{2})/.exec(iso);
          if (!m) return null;
          const year = Number(m[1]);
          const month = Number(m[2]);
          const day = Number(m[3]);
          if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day))
            return null;
          if (month < 1 || month > 12) return null;
          if (day < 1 || day > 31) return null;
          return { year, month, day };
        };

        const isMissingAnswerValue = (q: Question, v: AnswerValue | undefined): boolean => {
          if (v === null || v === undefined) return true;
          if (typeof v === 'string') return v.trim().length === 0;

          if (typeof v === 'number') {
            // Placeholder (e.g. Tag/Monat/Jahr) and "no selection" for bitsets
            if (q.type === 'select' || q.type === 'radio') return v === 0;
            if (q.type === 'checkbox' || q.type === 'multiselect') return v === 0;
            return false;
          }

          if (Array.isArray(v)) return v.length === 0;

          return false;
        };

        const prefillBasisdatenIfNeeded = async (
          answersIn: Map<string, AnswerValue>,
        ): Promise<Map<string, AnswerValue>> => {
          if (!patient || !encryptionKey) return answersIn;

          const basisSection = questionnaireEntity.sections.find(s => s.id === 'q0000');
          if (!basisSection) return answersIn;

          const byFieldName = new Map<string, string>();
          for (const q of basisSection.questions) {
            const md = (q.metadata ?? {}) as Record<string, unknown>;
            const fieldName = typeof md.fieldName === 'string' ? md.fieldName : undefined;
            const compartmentCode =
              typeof md.compartmentCode === 'string' ? md.compartmentCode : undefined;
            const key = (fieldName ?? compartmentCode)?.trim();
            if (key) byFieldName.set(key, q.id);
          }

          const nextAnswers = new Map(answersIn);
          const changedQuestionIds: string[] = [];

          const setIfMissing = (field: string, value: AnswerValue): void => {
            const questionId = byFieldName.get(field);
            if (!questionId) return;
            const question = questionnaireEntity.findQuestion(questionId);
            if (!question) return;

            const existing = nextAnswers.get(questionId);
            if (!isMissingAnswerValue(question, existing)) return;

            nextAnswers.set(questionId, value);
            changedQuestionIds.push(questionId);
          };

          setIfMissing('0', patient.encryptedData.lastName);
          setIfMissing('1', patient.encryptedData.firstName);

          if (patient.encryptedData.gender) {
            const genderValue =
              patient.encryptedData.gender === 'male'
                ? 1
                : patient.encryptedData.gender === 'female'
                  ? 2
                  : 3;
            setIfMissing('2', genderValue);
          }

          const birth = parseIsoDateParts(patient.encryptedData.birthDate);
          if (birth) {
            setIfMissing('0003_tag', birth.day);
            setIfMissing('0003_monat', birth.month);
            setIfMissing('0003_jahr', birth.year);
            setIfMissing('3', patient.encryptedData.birthDate);
          }

          // PERFORMANCE FIX: Persist prefilled answers in the background (non-blocking).
          // The UI will use the in-memory `nextAnswers` immediately, while DB writes happen async.
          if (changedQuestionIds.length > 0) {
            const failedSaves: string[] = [];
            // Fire-and-forget background save (do not block UI)
            Promise.all(
              changedQuestionIds.map(async qid => {
                const question = questionnaireEntity.findQuestion(qid);
                if (!question) return;

                const value = nextAnswers.get(qid);
                const persistValue = value === undefined ? null : value;

                try {
                  await saveAnswerUseCase.execute({
                    questionnaireId: questionnaireEntity.id,
                    question,
                    value: persistValue,
                    encryptionKey,
                    sourceType: 'manual',
                  });
                } catch (err) {
                  // Track failed saves - user can still proceed; next interaction will persist
                  failedSaves.push(qid);
                }
              }),
            )
              .then(() => {
                // Notify user if any saves failed (non-blocking)
                if (failedSaves.length > 0) {
                  logWarn(`[QuestionnaireScreen] ${failedSaves.length} prefill saves failed`);
                  // Non-blocking toast/alert - user can continue, data will re-save on interaction
                  Alert.alert(
                    t('common.warning', 'Warning'),
                    t(
                      'questionnaire.prefillSaveWarning',
                      'Some auto-filled data may not have been saved. Your answers will be saved when you continue.',
                    ),
                    [{ text: t('common.ok', 'OK') }],
                  );
                }
              })
              .catch(() => {
                // Catch to prevent unhandled rejection warnings
              });
          }

          return nextAnswers;
        };

        const mergedAnswers = await prefillBasisdatenIfNeeded(result.answers);

        setQuestionnaire(questionnaireEntity);
        setAnswers(mergedAnswers);
      } else {
        const message = result.error ?? t('questionnaire.failedToLoad');
        setError(message);
        Alert.alert(t('common.error'), message);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : t('questionnaire.failedToLoad');
      setError(message);
      Alert.alert(t('common.error'), message);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle Answer Change
   */
  const handleAnswerChange = async (questionId: string, value: AnswerValue): Promise<void> => {
    if (!questionnaire || !encryptionKey) return;

    // Update Store (optimistic update)
    setAnswer(questionId, value);

    // Clear validation error
    setValidationErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[questionId];
      return newErrors;
    });

    // Find question
    const question = questionnaire.findQuestion(questionId);
    if (!question) return;

    // Save to DB (async)
    setPendingSaves(prev => prev + 1);
    setSaveStatusError(null);
    const result = await saveAnswerUseCase.execute({
      questionnaireId: questionnaire.id,
      question,
      value,
      encryptionKey,
      sourceType: 'manual',
    });
    setPendingSaves(prev => Math.max(0, prev - 1));

    if (!result.success) {
      if (result.validationErrors) {
        // Show validation errors
        setValidationErrors(prev => ({
          ...prev,
          [questionId]: result.validationErrors![0],
        }));
        setSaveStatusError(
          t('questionnaire.failedToSave', { defaultValue: 'Failed to save answer' }),
        );
      } else {
        setSaveStatusError(
          result.error ??
          t('questionnaire.failedToSave', { defaultValue: 'Failed to save answer' }),
        );
        Alert.alert(t('common.error'), result.error ?? t('questionnaire.failedToSave'));
      }
    } else {
      setLastSavedAt(new Date());
    }
  };

  /**
   * Handle Next Button Click (Question or Section)
   */
  const handleNext = () => {
    if (!currentQuestion) return;

    // Check for nextMap navigation
    const answer = answers.get(currentQuestion.id);
    if (currentQuestion.nextMap) {
      let targetId: string | undefined;
      // Convert answer to string for lookup if needed
      const answerStr = answer !== undefined && answer !== null ? String(answer) : undefined;

      if (answerStr && currentQuestion.nextMap[answerStr]) {
        const target = currentQuestion.nextMap[answerStr];
        targetId = Array.isArray(target) ? target[0] : target;
      } else if (currentQuestion.nextMap['default']) {
        const target = currentQuestion.nextMap['default'];
        targetId = Array.isArray(target) ? target[0] : target;
      }

      if (targetId) {
        handleNavigateToQuestion(targetId);
        return;
      }
    }

    if (isLastQuestion) {
      handleNextSection();
    } else {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  /**
   * Handle Back Button Click (Question or Section)
   */
  const handleBack = () => {
    if (isFirstQuestion) {
      handlePrevSection();
    } else {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  /**
   * Handle moving to next section
   */
  const handleNextSection = (): void => {
    // Validate required questions
    if (!currentSection || !questionnaire) return;

    const requiredQuestions = visibleQuestions.filter(q => q.required);
    const missingAnswers = requiredQuestions.filter(q =>
      isMissingRequiredAnswer(q, answers.get(q.id)),
    );

    if (missingAnswers.length > 0) {
      // Show validation errors
      const errors: Record<string, string> = {};
      missingAnswers.forEach(q => {
        errors[q.id] = t('questionnaire.requiredField');
      });
      setValidationErrors(errors);

      Alert.alert(
        t('questionnaire.missingRequiredTitle'),
        t('questionnaire.missingRequiredMessage', { count: missingAnswers.length }),
      );
      return;
    }

    // Clear validation errors
    setValidationErrors({});

    // Check if last section
    if (currentSectionIndex === questionnaire.sections.length - 1) {
      // Go to Summary
      navigation.navigate('Summary', { questionnaireId: questionnaire.id });
    } else {
      // Next section
      nextSection();
    }
  };

  /**
   * Handle Previous Section
   */
  const handlePrevSection = (): void => {
    if (currentSectionIndex === 0) {
      navigation.goBack();
    } else {
      previousSection();
    }
  };

  /**
   * Navigate to specific section
   */
  const handleGoToSection = (index: number): void => {
    setShowSectionNav(false);
    goToSection(index);
  };

  /**
   * Jump to specific question's section
   */
  const handleNavigateToQuestion = (questionId: string): void => {
    if (!questionnaire) return;
    const sectionIndex = questionnaire.sections.findIndex(s =>
      s.questions.some(q => q.id === questionId)
    );

    if (sectionIndex !== -1) {
      // Set the pending jump target
      pendingQuestionJumpRef.current = questionId;

      if (sectionIndex !== currentSectionIndex) {
        goToSection(sectionIndex);
      } else {
        // Same section: Manually match the effect logic because section index didn't change
        const targetIndex = visibleQuestions.findIndex(q => q.id === questionId);
        if (targetIndex !== -1) {
          setCurrentQuestionIndex(targetIndex);
          pendingQuestionJumpRef.current = null;
        }
      }
    }
  };

  /**
   * Calculate section completion status
   */
  const getSectionCompletion = (
    sectionIndex: number,
  ): { answered: number; total: number; percent: number } => {
    if (!questionnaire) return { answered: 0, total: 0, percent: 0 };

    const section = questionnaire.sections[sectionIndex];
    if (!section) return { answered: 0, total: 0, percent: 0 };

    const questions = section.questions;
    const total = questions.length;

    let answered = 0;
    for (const q of questions) {
      const value = answers.get(q.id);
      if (value !== null && value !== undefined && value !== '') {
        answered++;
      }
    }

    const percent = total > 0 ? Math.round((answered / total) * 100) : 0;
    return { answered, total, percent };
  };

  /**
   * Helper: Render Section Navigation Content
   * extracted to allow conditional wrapping (Modal vs Absolute View)
   */
  const renderSectionNavContent = () => (
    <View style={styles.modalContent}>
      <View style={styles.modalHeader}>
        <AppText style={styles.modalTitle}>{t('questionnaire.sections')}</AppText>
        <TouchableOpacity onPress={() => setShowSectionNav(false)} style={styles.modalCloseButton}>
          <AppText style={styles.modalCloseText}>✕</AppText>
        </TouchableOpacity>
      </View>
      <ScrollView style={styles.sectionList}>
        {questionnaire &&
          questionnaire.sections.map((section, index) => {
            const completion = getSectionCompletion(index);
            const isActive = index === currentSectionIndex;

            return (
              <TouchableOpacity
                key={section.id}
                style={[styles.sectionItem, isActive && styles.sectionItemActive]}
                onPress={() => handleGoToSection(index)}
                accessibilityRole="button"
                accessibilityLabel={`${t('questionnaire.sectionNumber', { current: index + 1, total: questionnaire.sections.length })} ${section.titleKey ? t(section.titleKey) : section.title} ${t('questionnaire.questionsAnswered', { answered: completion.answered, total: completion.total })}`}
                accessibilityState={{ selected: isActive }}
              >
                <View style={styles.sectionItemContent}>
                  <AppText style={styles.sectionItemNumber}>{index + 1}</AppText>
                  <View style={styles.sectionItemText}>
                    <AppText
                      style={[styles.sectionItemTitle, isActive && styles.sectionItemTitleActive]}
                      numberOfLines={2}>
                      {section.titleKey ? t(section.titleKey, { defaultValue: section.title ?? '' }) : (section.title ?? '')}
                    </AppText>
                    <AppText style={styles.sectionItemMeta}>
                      {t('questionnaire.questionsAnswered', {
                        answered: completion.answered,
                        total: completion.total,
                      })}
                    </AppText>
                  </View>
                </View>
                <View style={styles.sectionItemProgress}>
                  <View
                    style={[styles.sectionItemProgressFill, { width: `${completion.percent}%` }]}
                  />
                </View>
              </TouchableOpacity>
            );
          })}
      </ScrollView>
    </View>
  );

  /**
   * Helper: Render History/Answer Box
   */
  const renderHistoryContent = () => {
    // Collect all answered questions (linearized)
    // We iterate sections -> questions.
    // We only show questions that have a value in `answers`.
    const historyItems: {
      qId: string;
      label: string;
      value: string;
      sectionIndex: number
    }[] = [];

    if (questionnaire) {
      questionnaire.sections.forEach((sec, sIdx) => {
        sec.questions.forEach(q => {
          const val = answers.get(q.id);
          if (val !== undefined && val !== null && val !== '') {
            // Simple formatting similar to Summary
            let displayVal = String(val);
            if (q.options) {
              // Try to resolve label
              if (Array.isArray(val)) {
                displayVal = val.map(v => q.options?.find(o => String(o.value) === String(v))?.label ?? v).join(', ');
              } else {
                const opt = q.options.find(o => String(o.value) === String(val));
                if (opt) displayVal = opt.label ?? String(opt.value);
              }
            }
            historyItems.push({
              qId: q.id,
              label: q.text ?? q.id,
              value: displayVal,
              sectionIndex: sIdx
            });
          }
        });
      });
    }

    return (
      <View style={styles.modalContent}>
        <View style={styles.modalHeader}>
          <AppText style={styles.modalTitle}>{t('questionnaire.history', { defaultValue: 'Verlauf / Antworten' })}</AppText>
          <TouchableOpacity onPress={() => setShowHistory(false)} style={styles.modalCloseButton}>
            <AppText style={styles.modalCloseText}>✕</AppText>
          </TouchableOpacity>
        </View>
        <ScrollView style={styles.sectionList}>
          {historyItems.length === 0 ? (
            <AppText style={styles.emptyText}>{t('questionnaire.noAnswersYet', { defaultValue: 'Noch keine Antworten.' })}</AppText>
          ) : (
            historyItems.map((item) => (
              <TouchableOpacity
                key={item.qId}
                style={styles.historyItem}
                onPress={() => {
                  handleGoToSection(item.sectionIndex);
                  handleNavigateToQuestion(item.qId);
                  setShowHistory(false);
                }}
              >
                <AppText style={styles.historyLabel} numberOfLines={1}>{item.label}</AppText>
                <AppText style={styles.historyValue} numberOfLines={1}>{item.value}</AppText>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      </View>
    );
  };

  /**
   * Render Loading State
   */
  if (isLoading) {
    return (
      <View
        style={styles.centerContainer}
        accessibilityRole="progressbar"
        accessibilityLabel={t('questionnaire.loading')}>
        <ActivityIndicator size="large" color={colors.primary} />
        <AppText style={styles.loadingText}>{t('questionnaire.loading')}</AppText>
      </View>
    );
  }

  /**
   * Render Error State
   */
  if (error) {
    return (
      <View style={styles.centerContainer}>
        <AppText style={styles.errorText}>{error}</AppText>
        <AppButton
          title={t('common.retry')}
          onPress={loadQuestionnaire}
          style={styles.retryButton}
        />
      </View>
    );
  }

  /**
   * Render Empty State
   */
  if (!currentSection || !questionnaire) {
    return (
      <View style={styles.centerContainer}>
        <AppText>{t('questionnaire.noneLoaded')}</AppText>
      </View>
    );
  }

  /**
   * Main Render
   */
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}>
      <View style={styles.innerContainer}>
        {/* Section Navigation Modal */}
        {Platform.OS === 'windows' ? (
          <>
            {showSectionNav && (
              <View style={[StyleSheet.absoluteFill, { zIndex: 1000 }]}>
                <Pressable style={styles.modalOverlay} onPress={() => setShowSectionNav(false)}>
                  <View onStartShouldSetResponder={() => true} onTouchEnd={e => e.stopPropagation()}>
                    {renderSectionNavContent()}
                  </View>
                </Pressable>
              </View>
            )}
            {showHistory && (
              <View style={[StyleSheet.absoluteFill, { zIndex: 1000 }]}>
                <Pressable style={styles.modalOverlay} onPress={() => setShowHistory(false)}>
                  <View onStartShouldSetResponder={() => true} onTouchEnd={e => e.stopPropagation()}>
                    {renderHistoryContent()}
                  </View>
                </Pressable>
              </View>
            )}
          </>
        ) : (
          <>
            <Modal
              visible={showSectionNav}
              animationType="slide"
              transparent={true}
              onRequestClose={() => setShowSectionNav(false)}>
              <Pressable style={styles.modalOverlay} onPress={() => setShowSectionNav(false)}>
                <View onStartShouldSetResponder={() => true} onTouchEnd={e => e.stopPropagation()}>
                  {renderSectionNavContent()}
                </View>
              </Pressable>
            </Modal>
            <Modal
              visible={showHistory}
              animationType="slide"
              transparent={true}
              onRequestClose={() => setShowHistory(false)}>
              <Pressable style={styles.modalOverlay} onPress={() => setShowHistory(false)}>
                <View onStartShouldSetResponder={() => true} onTouchEnd={e => e.stopPropagation()}>
                  {renderHistoryContent()}
                </View>
              </Pressable>
            </Modal>
          </>
        )}

        {/* Section Title Header */}
        <TouchableOpacity
          style={styles.sectionHeader}
          onPress={() => setShowSectionNav(true)}
          activeOpacity={0.7}
          accessibilityRole="header"
          accessibilityLabel={`${t('questionnaire.sectionNumber', { current: currentSectionIndex + 1, total: questionnaire.sections.length })} ${currentSection.titleKey ? t(currentSection.titleKey) : currentSection.title}`}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionHeaderText}>
              <AppText style={styles.sectionTitle}>
                {currentSection.titleKey ? t(currentSection.titleKey, { defaultValue: currentSection.title ?? currentSection.titleKey ?? '' }) : currentSection.title}
              </AppText>
              <AppText style={styles.sectionNumber}>
                {t('questionnaire.sectionNumber', {
                  current: currentSectionIndex + 1,
                  total: questionnaire.sections.length,
                })}
              </AppText>
            </View>
            <View style={styles.headerButtons}>
              <TouchableOpacity
                style={styles.iconButton}
                onPress={() => setShowHistory(true)}
                accessibilityRole="button"
                accessibilityLabel={t('questionnaire.history', { defaultValue: 'Verlauf' })}>
                <AppText style={styles.sectionMenuIcon}>↺</AppText>
              </TouchableOpacity>
              <View style={styles.sectionMenuButton} accessibilityElementsHidden={true}>
                <AppText style={styles.sectionMenuIcon}>☰</AppText>
              </View>
            </View>
          </View>
        </TouchableOpacity>

        {/* Main Scrollable Content */}
        <View style={styles.scrollContainer}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled">
            {currentQuestion && (
              <View style={styles.questionContainer}>
                <AppText style={styles.questionCounter}>
                  {t('questionnaire.questionCounter', {
                    current: currentQuestionIndex + 1,
                    total: visibleQuestions.length
                  })}
                </AppText>
                <QuestionCard
                  key={currentQuestion.id}
                  question={currentQuestion}
                  value={answers.get(currentQuestion.id)}
                  onValueChange={value => handleAnswerChange(currentQuestion.id, value)}
                  error={validationErrors[currentQuestion.id]}
                />
              </View>
            )}

            {/* Linked Items Inline */}
            <LinkedItemsBox
              visibleQuestions={[currentQuestion].filter((q): q is Question => !!q)}
              questionnaire={questionnaire}
              onNavigateToQuestion={handleNavigateToQuestion}
            />
          </ScrollView>
        </View>

        {/* Sticky Footer */}
        <View style={styles.footerContainer}>
          {/* Progress Bar (Moved to footer) */}
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${safeProgress}%` }]} />
            </View>
            <AppText style={styles.progressText}>
              {t('questionnaire.progress', { percent: Math.round(safeProgress) })}
            </AppText>
            <View style={styles.saveStatusBox}>
              <AppText
                style={[styles.saveStatusText, saveStatusError ? styles.saveStatusError : undefined]}>
                {pendingSaves > 0
                  ? t('common.loading', { defaultValue: 'Saving...' })
                  : saveStatusError
                    ? saveStatusError
                    : lastSavedAt
                      ? `${t('common.success', { defaultValue: 'Saved' })} ${lastSavedAt.toLocaleTimeString()}`
                      : t('common.save', { defaultValue: 'Save' })}
              </AppText>
            </View>
          </View>

          {/* Navigation Buttons */}
          <View style={styles.navigationContainer}>
            <AppButton
              title={t('common.back')}
              variant="secondary"
              onPress={handleBack}
              disabled={currentSectionIndex === 0 && isFirstQuestion}
              style={styles.navButton}
            />
            <AppButton
              title={isLastSection && isLastQuestion ? t('questionnaire.complete') : t('common.next')}
              variant="primary"
              onPress={handleNext}
              style={styles.navButton}
            />
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  innerContainer: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: 16,
    color: colors.textMuted,
  },
  errorText: {
    fontSize: 16,
    color: colors.danger,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  retryButton: {
    marginTop: spacing.sm,
  },
  // Modal styles for Section Navigation
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    maxHeight: '80%',
    paddingBottom: spacing.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  modalCloseButton: {
    padding: spacing.sm,
  },
  modalCloseText: {
    fontSize: 20,
    color: colors.textMuted,
  },
  sectionList: {
    padding: spacing.md,
  },
  sectionItem: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionItemActive: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  sectionItemContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  sectionItemNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary,
    color: colors.textInverse,
    textAlign: 'center',
    lineHeight: 28,
    fontSize: 14,
    fontWeight: '700',
    marginRight: spacing.sm,
  },
  sectionItemText: {
    flex: 1,
  },
  sectionItemTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  sectionItemTitleActive: {
    color: colors.primaryDark,
  },
  sectionItemMeta: {
    fontSize: 12,
    color: colors.textMuted,
  },
  sectionItemProgress: {
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    overflow: 'hidden',
  },
  sectionItemProgressFill: {
    height: '100%',
    backgroundColor: colors.success,
  },
  progressContainer: {
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  progressBar: {
    height: 8,
    backgroundColor: colors.border,
    borderRadius: radius.sm,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
  },
  progressText: {
    marginTop: spacing.sm,
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
  },
  saveStatusBox: {
    marginTop: spacing.sm,
    alignItems: 'center',
  },
  saveStatusText: {
    fontSize: 12,
    color: colors.textMuted,
  },
  saveStatusError: {
    color: colors.danger,
  },
  progressActions: {
    marginTop: spacing.md,
    alignItems: 'center',
  },
  sectionsButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  sectionHeader: {
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionHeaderText: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
  },
  sectionNumber: {
    marginTop: spacing.xs,
    fontSize: 14,
    color: colors.textMuted,
  },
  sectionMenuButton: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceAlt,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionMenuIcon: {
    fontSize: 20,
    color: colors.textSecondary,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
  },
  navButton: {
    flex: 1,
  },
  footerContainer: {
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  navigationContainer: {
    flexDirection: 'row',
    padding: spacing.md,
    gap: spacing.sm,
  },
  questionContainer: {
    flex: 1,
    minHeight: 200,
  },
  questionCounter: {
    fontSize: 14,
    color: colors.textMuted,
    marginBottom: spacing.md,
    textAlign: 'right',
    fontWeight: '500',
  },
  headerButtons: {
    flexDirection: 'row',
  },
  iconButton: {
    padding: spacing.sm,
    marginRight: spacing.sm,
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceAlt,
    justifyContent: 'center',
    alignItems: 'center',
  },
  historyItem: {
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    backgroundColor: colors.surface,
  },
  historyLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  historyValue: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: '500',
  },
  emptyText: {
    padding: spacing.lg,
    textAlign: 'center',
    color: colors.textMuted,
    fontStyle: 'italic',
  }
});
