/**
 * QuestionnaireScreen - Hauptbildschirm für Fragebogen
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

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { QuestionCard } from '../components/QuestionCard';
import { useQuestionnaireStore, selectCurrentSection, selectVisibleQuestions, selectProgress } from '../state/useQuestionnaireStore';
import { AnswerValue } from '@domain/entities/Answer';

// Use Cases
import { LoadQuestionnaireUseCase } from '@application/use-cases/LoadQuestionnaireUseCase';
import { SaveAnswerUseCase } from '@application/use-cases/SaveAnswerUseCase';

// Repositories (DI - Dependency Injection)
import { SQLiteQuestionnaireRepository } from '@infrastructure/persistence/SQLiteQuestionnaireRepository';
import { SQLiteAnswerRepository } from '@infrastructure/persistence/SQLiteAnswerRepository';
import { SQLitePatientRepository } from '@infrastructure/persistence/SQLitePatientRepository';
import { encryptionService } from '@infrastructure/encryption/NativeEncryptionService';

type Props = NativeStackScreenProps<RootStackParamList, 'Questionnaire'>;

export const QuestionnaireScreen = ({ route, navigation }: Props): React.JSX.Element => {
  const { questionnaireId } = route.params;
  
  // Zustand Store
  const {
    patient,
    questionnaire,
    answers,
    currentSectionIndex,
    encryptionKey,
    isLoading,
    error,
    setQuestionnaire,
    setAnswers,
    setAnswer,
    setLoading,
    setError,
    nextSection,
    previousSection,
  } = useQuestionnaireStore();

  // Selectors
  const currentSection = selectCurrentSection(useQuestionnaireStore.getState());
  const visibleQuestions = selectVisibleQuestions(useQuestionnaireStore.getState());
  const progress = selectProgress(useQuestionnaireStore.getState());

  // Local State
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Use Cases (Dependency Injection)
  const loadQuestionnaireUseCase = new LoadQuestionnaireUseCase(
    new SQLiteQuestionnaireRepository(),
    new SQLiteAnswerRepository(),
    new SQLitePatientRepository(),
  );

  const saveAnswerUseCase = new SaveAnswerUseCase(
    new SQLiteAnswerRepository(),
    encryptionService,
  );

  /**
   * Load Questionnaire on Mount
   */
  useEffect(() => {
    loadQuestionnaire();
  }, []);

  /**
   * Load Questionnaire + Answers
   */
  const loadQuestionnaire = async (): Promise<void> => {
    if (!patient || !encryptionKey) {
      setError('Patient or encryption key missing');
      return;
    }

    setLoading(true);

    const result = await loadQuestionnaireUseCase.execute({
      patientId: patient.id,
      questionnaireId,
      encryptionKey,
    });

    if (result.success && result.questionnaire && result.answers) {
      setQuestionnaire(result.questionnaire);
      setAnswers(result.answers);
    } else {
      setError(result.error ?? 'Failed to load questionnaire');
      Alert.alert('Error', result.error ?? 'Failed to load questionnaire');
    }

    setLoading(false);
  };

  /**
   * Handle Answer Change
   */
  const handleAnswerChange = async (questionId: string, value: AnswerValue): Promise<void> => {
    if (!questionnaire || !encryptionKey) return;

    // Update Store (optimistic update)
    setAnswer(questionId, value);

    // Clear validation error
    setValidationErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[questionId];
      return newErrors;
    });

    // Find question
    const question = questionnaire.findQuestion(questionId);
    if (!question) return;

    // Save to DB (async)
    const result = await saveAnswerUseCase.execute({
      questionnaireId: questionnaire.id,
      question,
      value,
      encryptionKey,
      sourceType: 'manual',
    });

    if (!result.success) {
      if (result.validationErrors) {
        // Show validation errors
        setValidationErrors((prev) => ({
          ...prev,
          [questionId]: result.validationErrors![0],
        }));
      } else {
        Alert.alert('Error', result.error ?? 'Failed to save answer');
      }
    }
  };

  /**
   * Handle Next Section
   */
  const handleNext = (): void => {
    // Validate required questions
    if (!currentSection || !questionnaire) return;

    const requiredQuestions = visibleQuestions.filter((q) => q.required);
    const missingAnswers = requiredQuestions.filter((q) => !answers.has(q.id));

    if (missingAnswers.length > 0) {
      // Show validation errors
      const errors: Record<string, string> = {};
      missingAnswers.forEach((q) => {
        errors[q.id] = 'This field is required';
      });
      setValidationErrors(errors);
      
      Alert.alert(
        'Missing Required Fields',
        `Please answer all required questions (${missingAnswers.length} missing)`,
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
  const handlePrevious = (): void => {
    if (currentSectionIndex === 0) {
      navigation.goBack();
    } else {
      previousSection();
    }
  };

  /**
   * Render Loading State
   */
  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Loading questionnaire...</Text>
      </View>
    );
  }

  /**
   * Render Error State
   */
  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadQuestionnaire}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  /**
   * Render Empty State
   */
  if (!currentSection || !questionnaire) {
    return (
      <View style={styles.centerContainer}>
        <Text>No questionnaire loaded</Text>
      </View>
    );
  }

  /**
   * Main Render
   */
  return (
    <View style={styles.container}>
      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>
        <Text style={styles.progressText}>{Math.round(progress)}% Complete</Text>
      </View>

      {/* Section Title */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{currentSection.titleKey}</Text>
        <Text style={styles.sectionNumber}>
          Section {currentSectionIndex + 1} of {questionnaire.sections.length}
        </Text>
      </View>

      {/* Questions */}
      <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContent}>
        {visibleQuestions.map((question) => (
          <QuestionCard
            key={question.id}
            question={question}
            value={answers.get(question.id)}
            onValueChange={(value) => handleAnswerChange(question.id, value)}
            error={validationErrors[question.id]}
          />
        ))}
      </ScrollView>

      {/* Navigation Buttons */}
      <View style={styles.navigationContainer}>
        <TouchableOpacity
          style={[styles.navButton, styles.prevButton]}
          onPress={handlePrevious}>
          <Text style={styles.navButtonText}>← Previous</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navButton, styles.nextButton]}
          onPress={handleNext}>
          <Text style={styles.navButtonText}>
            {currentSectionIndex === questionnaire.sections.length - 1
              ? 'Complete →'
              : 'Next →'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
  },
  errorText: {
    fontSize: 16,
    color: '#ef4444',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  progressContainer: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#2563eb',
  },
  progressText: {
    marginTop: 8,
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  sectionHeader: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  sectionNumber: {
    marginTop: 4,
    fontSize: 14,
    color: '#6b7280',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  navigationContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    gap: 12,
  },
  navButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  prevButton: {
    backgroundColor: '#f3f4f6',
  },
  nextButton: {
    backgroundColor: '#2563eb',
  },
  navButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
});
