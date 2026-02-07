/**
 * QuestionCard Component - Universelle Frage-Komponente
 *
 * REFACTORED (2026-01-30):
 * - Uses extracted components from @presentation/components/inputs
 * - Significantly reduced complexity
 * - Maintained existing functionality and styling structure
 */

import React, { memo } from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { AppText } from './AppText';
import { useTranslation } from 'react-i18next';
import { Question } from '@domain/entities/Questionnaire';
import { AnswerValue } from '@domain/entities/Answer';
import {
  TextInputField,
  DatePickerInput,
  ChoiceInput,
  ChoiceOption,
} from '@presentation/components/inputs';

import { colors, spacing, radius } from '../theme/tokens';

interface QuestionCardProps {
  question: Question;
  value?: AnswerValue;
  onValueChange: (value: AnswerValue) => void;
  error?: string;
}

/**
 * QuestionCard - Encapsulates question rendering logic
 */
export const QuestionCard: React.FC<QuestionCardProps> = memo(
  ({ question, value, onValueChange, error }) => {
    const { t } = useTranslation();
    useTheme();

    // Helper to translate keys safely
    // Helper to translate keys safely
    const tDefault = t as unknown as (key: string, defaultValue: string) => string;

    const trKey = (key: string | undefined): string => {
      if (key) return tDefault(key, question.text ?? key ?? '');
      return question.text ?? '';
    };

    const trOptionalKey = (key: string | undefined, defaultVal: string = ''): string => {
      if (key) return tDefault(key, defaultVal);
      return question.placeholder ?? defaultVal;
    };

    /**
     * Map question options to ChoiceOption format with translated labels
     */
    const getChoiceOptions = (): ChoiceOption[] => {
      if (!question.options) return [];
      return question.options.map(opt => ({
        value: opt.value,
        label: opt.labelKey ? tDefault(opt.labelKey, opt.label ?? String(opt.value)) : (opt.label ?? String(opt.value)),
      }));
    };

    const renderInput = (): React.ReactNode => {
      switch (question.type) {
        case 'text':
        case 'textarea':
          return (
            <TextInputField
              value={(value as string) ?? ''}
              onValueChange={onValueChange}
              placeholder={trOptionalKey(question.placeholderKey)}
              multiline={question.type === 'textarea'}
              numberOfLines={4}
              showVoiceInput={true}
              hasError={!!error}
              questionId={question.id}
              testID={`input-${question.id}`}
            />
          );

        case 'number':
          return (
            <TextInputField
              value={value?.toString() ?? ''}
              onValueChange={text => {
                const num = parseFloat(text);
                onValueChange(isNaN(num) ? null : num);
              }}
              placeholder={trOptionalKey(question.placeholderKey)}
              hasError={!!error}
              testID={`input-${question.id}`}
            />
          );

        case 'date':
          return (
            <DatePickerInput
              value={value as string}
              onValueChange={onValueChange}
              placeholder={trOptionalKey(
                question.placeholderKey,
                t('patientInfo.birthDatePlaceholder'),
              )}
              hasError={!!error}
            />
          );

        case 'radio':
          return (
            <ChoiceInput
              type="radio"
              options={getChoiceOptions()}
              value={value as string | number}
              onValueChange={v => onValueChange(v as AnswerValue)}
              hasError={!!error}
            />
          );

        case 'checkbox':
          if (question.options && question.options.length > 1) {
            // Multi-checkbox
            return (
              <ChoiceInput
                type="multiCheckbox"
                options={getChoiceOptions()}
                value={value as number | string[]}
                onValueChange={v => onValueChange(v as AnswerValue)}
                hasError={!!error}
              />
            );
          } else {
            // Single checkbox (boolean)
            return (
              <ChoiceInput
                type="checkbox"
                options={[{ value: 'true', label: trKey(question.labelKey) }]}
                value={value as boolean}
                onValueChange={v => onValueChange(v as AnswerValue)}
                hasError={!!error}
              />
            );
          }

        case 'select':
          return (
            <ChoiceInput
              type="select"
              options={getChoiceOptions()}
              value={value as string | number}
              onValueChange={v => onValueChange(v as AnswerValue)}
              hasError={!!error}
            />
          );

        case 'multiselect':
          return (
            <ChoiceInput
              type="multiCheckbox"
              options={getChoiceOptions()}
              value={value as number | string[]}
              onValueChange={v => onValueChange(v as AnswerValue)}
              hasError={!!error}
            />
          );

        default:
          return (
            <AppText style={styles.errorText}>
              {tDefault(
                'questionnaire.unsupportedQuestionType',
                `Unsupported question type: ${question.type}`,
              )}
            </AppText>
          );
      }
    };

    return (
      <View style={styles.container}>
        {/* Question Label (except for single checkboxes which handle it internally) */}
        {!(question.type === 'checkbox' && (!question.options || question.options.length <= 1)) && (
          <AppText style={styles.label}>
            {trKey(question.labelKey)}
            {question.required && <AppText style={styles.required}> *</AppText>}
          </AppText>
        )}

        {/* Input Component */}
        {renderInput()}

        {/* Error Message */}
        {error && <AppText style={styles.errorText}>{error}</AppText>}
      </View>
    );
  },
);

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.xl,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  label: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  required: {
    color: colors.danger,
  },
  errorText: {
    color: colors.danger,
    fontSize: 14,
    marginTop: spacing.sm,
  },
  textHighContrast: {
    color: '#ffffff',
  },
});
