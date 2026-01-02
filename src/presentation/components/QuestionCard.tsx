/**
 * QuestionCard Component - Universelle Frage-Komponente
 * 
 * VERBINDUNG:
 * QuestionCard (Component)
 *   → useQuestionnaireStore (State)
 *   → SaveAnswerUseCase (Use Case)
 *   → Answer Repository (Persistence)
 */

import React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { Question } from '@domain/entities/Questionnaire';
import { AnswerValue } from '@domain/entities/Answer';

interface QuestionCardProps {
  question: Question;
  value?: AnswerValue;
  onValueChange: (value: AnswerValue) => void;
  error?: string;
}

/**
 * QuestionCard - rendert verschiedene Fragetypen
 */
export const QuestionCard: React.FC<QuestionCardProps> = ({
  question,
  value,
  onValueChange,
  error,
}) => {
  const renderInput = (): React.ReactNode => {
    switch (question.type) {
      case 'text':
      case 'textarea':
        return renderTextInput();
      
      case 'number':
        return renderNumberInput();
      
      case 'date':
        return renderDateInput();
      
      case 'radio':
        return renderRadioInput();
      
      case 'checkbox':
      case 'multiselect':
        return renderCheckboxInput();
      
      case 'select':
        return renderSelectInput();
      
      default:
        return <Text>Unsupported question type: {question.type}</Text>;
    }
  };

  /**
   * Text Input (text, textarea)
   */
  const renderTextInput = (): React.ReactNode => {
    return (
      <TextInput
        style={[
          styles.textInput,
          question.type === 'textarea' && styles.textareaInput,
          error ? styles.inputError : undefined,
        ]}
        value={(value as string) ?? ''}
        onChangeText={onValueChange}
        placeholder={question.placeholderKey ?? ''}
        multiline={question.type === 'textarea'}
        numberOfLines={question.type === 'textarea' ? 4 : 1}
      />
    );
  };

  /**
   * Number Input
   */
  const renderNumberInput = (): React.ReactNode => {
    return (
      <TextInput
        style={[styles.textInput, error ? styles.inputError : undefined]}
        value={value?.toString() ?? ''}
        onChangeText={(text) => {
          const num = parseFloat(text);
          onValueChange(isNaN(num) ? null : num);
        }}
        keyboardType="numeric"
        placeholder={question.placeholderKey ?? ''}
      />
    );
  };

  /**
   * Date Input (simplified - use react-native-date-picker in production)
   */
  const renderDateInput = (): React.ReactNode => {
    return (
      <TextInput
        style={[styles.textInput, error ? styles.inputError : undefined]}
        value={(value as string) ?? ''}
        onChangeText={onValueChange}
        placeholder="DD.MM.YYYY"
      />
    );
  };

  /**
   * Radio Input (single choice)
   */
  const renderRadioInput = (): React.ReactNode => {
    if (!question.options) return null;

    return (
      <View style={styles.optionsContainer}>
        {question.options.map((option) => (
          <TouchableOpacity
            key={option.value}
            style={styles.radioOption}
            onPress={() => onValueChange(option.value)}>
            <View
              style={[
                styles.radioCircle,
                value === option.value && styles.radioCircleSelected,
              ]}>
              {value === option.value && <View style={styles.radioCircleInner} />}
            </View>
            <Text style={styles.optionLabel}>{option.labelKey}</Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  /**
   * Checkbox Input (multiple choice)
   */
  const renderCheckboxInput = (): React.ReactNode => {
    if (!question.options) return null;

    const selectedValues = (value as string[]) ?? [];

    const toggleOption = (optionValue: string): void => {
      const newValues = selectedValues.includes(optionValue)
        ? selectedValues.filter((v) => v !== optionValue)
        : [...selectedValues, optionValue];
      
      onValueChange(newValues);
    };

    return (
      <View style={styles.optionsContainer}>
        {question.options.map((option) => (
          <TouchableOpacity
            key={option.value}
            style={styles.checkboxOption}
            onPress={() => toggleOption(option.value)}>
            <View
              style={[
                styles.checkbox,
                selectedValues.includes(option.value) && styles.checkboxSelected,
              ]}>
              {selectedValues.includes(option.value) && (
                <Text style={styles.checkmark}>✓</Text>
              )}
            </View>
            <Text style={styles.optionLabel}>{option.labelKey}</Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  /**
   * Select Input (dropdown)
   */
  const renderSelectInput = (): React.ReactNode => {
    if (!question.options) return null;

    return (
      <ScrollView style={styles.selectContainer}>
        {question.options.map((option) => (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.selectOption,
              value === option.value && styles.selectOptionSelected,
            ]}
            onPress={() => onValueChange(option.value)}>
            <Text
              style={[
                styles.selectOptionText,
                value === option.value && styles.selectOptionTextSelected,
              ]}>
              {option.labelKey}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    );
  };

  return (
    <View style={styles.container}>
      {/* Question Label */}
      <Text style={styles.label}>
        {question.labelKey}
        {question.required && <Text style={styles.required}> *</Text>}
      </Text>

      {/* Input */}
      {renderInput()}

      {/* Error Message */}
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  required: {
    color: '#ef4444',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  textareaInput: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  inputError: {
    borderColor: '#ef4444',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 14,
    marginTop: 4,
  },
  optionsContainer: {
    marginTop: 8,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  radioCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  radioCircleSelected: {
    backgroundColor: '#2563eb',
  },
  radioCircleInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#fff',
  },
  checkboxOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  checkboxSelected: {
    backgroundColor: '#2563eb',
  },
  checkmark: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  optionLabel: {
    fontSize: 16,
    color: '#1f2937',
  },
  selectContainer: {
    maxHeight: 200,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  selectOption: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  selectOptionSelected: {
    backgroundColor: '#eff6ff',
  },
  selectOptionText: {
    fontSize: 16,
    color: '#1f2937',
  },
  selectOptionTextSelected: {
    color: '#2563eb',
    fontWeight: '600',
  },
});
