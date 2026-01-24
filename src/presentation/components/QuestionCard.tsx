/**
 * QuestionCard Component - Universelle Frage-Komponente
 *
 * VERBINDUNG:
 * QuestionCard (Component)
 *   → useQuestionnaireStore (State)
 *   → SaveAnswerUseCase (Use Case)
 *   → Answer Repository (Persistence)
 *
 * FEATURES:
 * - Multiple input types (text, number, date, radio, checkbox, select)
 * - Voice input for text fields (using VoskSpeechService)
 * - Validation error display
 * - Memoized for FlatList/ScrollView performance
 */

import React, { useState, memo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Question } from '@domain/entities/Questionnaire';
import { AnswerValue } from '@domain/entities/Answer';
import {
  decodeMultiChoiceBitset,
  encodeMultiChoiceBitset,
} from '@domain/value-objects/CompartmentAnswerEncoding';
import { SystemSpeechService } from '@infrastructure/speech/SystemSpeechService';

interface QuestionCardProps {
  question: Question;
  value?: AnswerValue;
  onValueChange: (value: AnswerValue) => void;
  error?: string;
}

/**
 * QuestionCard - rendert verschiedene Fragetypen
 * Wrapped with React.memo for FlatList performance optimization
 */
export const QuestionCard: React.FC<QuestionCardProps> = memo(
  ({ question, value, onValueChange, error }) => {
    const { t } = useTranslation();

    // Voice input state
    const [isListening, setIsListening] = useState(false);
    const [voiceError, setVoiceError] = useState<string | null>(null);

    const tDefault = t as unknown as (key: string, defaultValue: string) => string;

    const trKey = (key: string | undefined, fallback: string = ''): string => {
      if (!key) return fallback;
      return tDefault(key, key);
    };

    const trOptionalKey = (key: string | undefined, fallback: string = ''): string => {
      if (!key) return fallback;
      return tDefault(key, fallback);
    };

    const isWindows = Platform.OS === 'windows';
    const [showDatePicker, setShowDatePicker] = React.useState(false);
    const [openDateDropdown, setOpenDateDropdown] = React.useState<'day' | 'month' | 'year' | null>(
      null,
    );
    const [draftDay, setDraftDay] = React.useState<number | null>(null);
    const [draftMonth, setDraftMonth] = React.useState<number | null>(null);
    const [draftYear, setDraftYear] = React.useState<number | null>(null);

    const closeDateDropdowns = (): void => setOpenDateDropdown(null);

    const daysInMonth = (year: number, month: number): number => {
      return new Date(year, month, 0).getDate();
    };

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

    const toIsoDate = (year: number, month: number, day: number): string => {
      const y = String(year).padStart(4, '0');
      const m = String(month).padStart(2, '0');
      const d = String(day).padStart(2, '0');
      return `${y}-${m}-${d}`;
    };

    const isSelected = (
      current: AnswerValue | undefined,
      optionValue: string | number,
    ): boolean => {
      if (current === null || current === undefined) return false;
      return String(current) === String(optionValue);
    };

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
          return question.options ? renderCheckboxInput() : renderSingleCheckbox();

        case 'multiselect':
          return renderCheckboxInput();

        case 'select':
          return renderSelectInput();

        default:
          return (
            <Text>
              {tDefault(
                'questionnaire.unsupportedQuestionType',
                `Unsupported question type: ${question.type}`,
              )}
            </Text>
          );
      }
    };

    /**
     * Text Input (text, textarea)
     */
    const renderTextInput = (): React.ReactNode => {
      const supportsVoice = question.type === 'text' || question.type === 'textarea';

      /**
       * Start voice recognition for text input
       */
      const handleVoiceInput = async (): Promise<void> => {
        if (isListening) {
          // Stop listening
          await SystemSpeechService.stopListening();
          setIsListening(false);
          return;
        }

        setVoiceError(null);
        setIsListening(true);

        try {
          // Start listening
          const available = await SystemSpeechService.isAvailable();
          if (!available) {
            setVoiceError(t('voice.notAvailable'));
            setIsListening(false);
            return;
          }

          await SystemSpeechService.startListening({
            onResult: (text: string) => {
              // Append transcribed text to existing value
              const currentValue = (value as string) ?? '';
              const newValue = currentValue ? `${currentValue} ${text}` : text;
              onValueChange(newValue);
            },
            onError: (err: string) => {
              setVoiceError(err);
              setIsListening(false);
            },
            onEnd: () => {
              setIsListening(false);
            },
          });
        } catch (err) {
          setVoiceError(err instanceof Error ? err.message : t('voice.error'));
          setIsListening(false);
        }
      };

      return (
        <View style={styles.textInputContainer}>
          <TextInput
            style={[
              styles.textInput,
              question.type === 'textarea' && styles.textareaInput,
              supportsVoice && styles.textInputWithMic,
              error ? styles.inputError : undefined,
            ]}
            value={(value as string) ?? ''}
            onChangeText={onValueChange}
            placeholder={trOptionalKey(question.placeholderKey, '')}
            multiline={question.type === 'textarea'}
            numberOfLines={question.type === 'textarea' ? 4 : 1}
          />
          {supportsVoice && (
            <TouchableOpacity
              style={[styles.micButton, isListening && styles.micButtonActive]}
              onPress={handleVoiceInput}
              testID={`mic-button-${question.id}`}>
              {isListening ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.micIcon}>🎤</Text>
              )}
            </TouchableOpacity>
          )}
          {voiceError && <Text style={styles.voiceErrorText}>{voiceError}</Text>}
        </View>
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
          onChangeText={text => {
            const num = parseFloat(text);
            onValueChange(isNaN(num) ? null : num);
          }}
          keyboardType="numeric"
          placeholder={trOptionalKey(question.placeholderKey, '')}
        />
      );
    };

    /**
     * Date Input (simplified - use react-native-date-picker in production)
     */
    const renderDateInput = (): React.ReactNode => {
      if (isWindows) {
        const currentIso = typeof value === 'string' ? value : '';
        const parsed = currentIso ? parseIsoDateParts(currentIso) : null;
        const displayDate = parsed
          ? new Date(parsed.year, parsed.month - 1, parsed.day).toLocaleDateString()
          : '';

        const today = new Date();
        const yearMin = 1900;
        const yearMax = today.getFullYear();
        const years = Array.from({ length: yearMax - yearMin + 1 }, (_, i) => yearMax - i);

        const openPicker = (): void => {
          if (showDatePicker) {
            setShowDatePicker(false);
            closeDateDropdowns();
            return;
          }

          const base = parsed ?? {
            year: today.getFullYear(),
            month: today.getMonth() + 1,
            day: today.getDate(),
          };
          setDraftYear(base.year);
          setDraftMonth(base.month);
          setDraftDay(base.day);
          setShowDatePicker(true);
        };

        const selectedYear = draftYear ?? parsed?.year ?? today.getFullYear();
        const selectedMonth = draftMonth ?? parsed?.month ?? today.getMonth() + 1;
        const maxDay = daysInMonth(selectedYear, selectedMonth);
        const selectedDay = Math.min(draftDay ?? parsed?.day ?? today.getDate(), maxDay);

        const setPart = (part: { year?: number; month?: number; day?: number }): void => {
          const nextYear = part.year ?? selectedYear;
          const nextMonth = part.month ?? selectedMonth;
          const nextMaxDay = daysInMonth(nextYear, nextMonth);
          const nextDayRaw = part.day ?? selectedDay;
          const nextDay = Math.min(nextDayRaw, nextMaxDay);

          setDraftYear(nextYear);
          setDraftMonth(nextMonth);
          setDraftDay(nextDay);

          onValueChange(toIsoDate(nextYear, nextMonth, nextDay));
        };

        const renderDropdown = (
          kind: 'day' | 'month' | 'year',
          selected: number,
          options: number[],
          onSelect: (v: number) => void,
        ) => (
          <View style={styles.dateDropdownCell}>
            <TouchableOpacity
              style={[styles.dateDropdownButton, error ? styles.inputError : undefined]}
              onPress={() => setOpenDateDropdown(cur => (cur === kind ? null : kind))}>
              <Text style={styles.dateDropdownText}>{String(selected)}</Text>
            </TouchableOpacity>

            {openDateDropdown === kind && (
              <View style={styles.dateDropdownMenu}>
                <ScrollView style={styles.dateDropdownScroll} keyboardShouldPersistTaps="handled">
                  {options.map(opt => (
                    <TouchableOpacity
                      key={opt}
                      style={styles.dateDropdownOption}
                      onPress={() => {
                        onSelect(opt);
                        closeDateDropdowns();
                      }}>
                      <Text style={styles.dateDropdownOptionText}>{String(opt)}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>
        );

        const dayOptions = Array.from({ length: maxDay }, (_, i) => i + 1);

        return (
          <View>
            <TouchableOpacity
              style={[
                styles.textInput,
                styles.dateDisplayInput,
                error ? styles.inputError : undefined,
              ]}
              onPress={openPicker}>
              <Text style={displayDate ? styles.dateText : styles.datePlaceholder}>
                {displayDate ||
                  trOptionalKey(question.placeholderKey, t('patientInfo.birthDatePlaceholder'))}
              </Text>
            </TouchableOpacity>

            {showDatePicker && (
              <View style={styles.datePickerRow}>
                {renderDropdown('day', selectedDay, dayOptions, v => setPart({ day: v }))}
                {renderDropdown(
                  'month',
                  selectedMonth,
                  Array.from({ length: 12 }, (_, i) => i + 1),
                  v => setPart({ month: v }),
                )}
                {renderDropdown('year', selectedYear, years, v => setPart({ year: v }))}
              </View>
            )}
          </View>
        );
      }

      return (
        <TextInput
          style={[styles.textInput, error ? styles.inputError : undefined]}
          value={(value as string) ?? ''}
          onChangeText={onValueChange}
          placeholder={trOptionalKey(
            question.placeholderKey,
            t('patientInfo.birthDatePlaceholder'),
          )}
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
          {question.options.map(option => (
            <TouchableOpacity
              key={option.value}
              style={styles.radioOption}
              onPress={() => onValueChange(option.value)}>
              <View
                style={[
                  styles.radioCircle,
                  isSelected(value, option.value) && styles.radioCircleSelected,
                ]}>
                {isSelected(value, option.value) && <View style={styles.radioCircleInner} />}
              </View>
              <Text style={styles.optionLabel}>{trKey(option.labelKey)}</Text>
            </TouchableOpacity>
          ))}
        </View>
      );
    };

    /**
     * Checkbox Input (single)
     */
    const renderSingleCheckbox = (): React.ReactNode => {
      const checked = value === true;

      return (
        <TouchableOpacity
          style={styles.checkboxOption}
          onPress={() => onValueChange(!checked)}
          accessibilityRole="checkbox"
          accessibilityState={{ checked }}>
          <View style={[styles.checkbox, checked && styles.checkboxSelected]}>
            {checked && <Text style={styles.checkmark}>✓</Text>}
          </View>
          <Text style={styles.optionLabel}>
            {trKey(question.labelKey)}
            {question.required && <Text style={styles.required}> *</Text>}
          </Text>
        </TouchableOpacity>
      );
    };

    /**
     * Checkbox Input (multiple choice)
     */
    const renderCheckboxInput = (): React.ReactNode => {
      if (!question.options) return null;

      // New model: integer bitset; legacy: string[]
      const currentBitset = typeof value === 'number' && Number.isInteger(value) ? value : 0;
      const legacySelectedValues = Array.isArray(value) ? (value as string[]) : [];

      const getBitPos = (v: string | number): number | null => {
        if (typeof v === 'number' && Number.isInteger(v)) return v;
        const parsed = Number.parseInt(String(v), 10);
        return Number.isFinite(parsed) ? parsed : null;
      };

      const isOptionChecked = (optionValue: string | number): boolean => {
        const bitPos = getBitPos(optionValue);
        if (bitPos !== null) {
          const selected = decodeMultiChoiceBitset(currentBitset);
          return selected.includes(bitPos);
        }
        return legacySelectedValues.includes(String(optionValue));
      };

      const toggleOption = (optionValue: string | number): void => {
        const bitPos = getBitPos(optionValue);
        if (bitPos !== null) {
          const selected = decodeMultiChoiceBitset(currentBitset);
          const nextSelected = selected.includes(bitPos)
            ? selected.filter(p => p !== bitPos)
            : [...selected, bitPos].sort((a, b) => a - b);

          onValueChange(encodeMultiChoiceBitset(nextSelected));
          return;
        }

        const key = String(optionValue);
        const newValues = legacySelectedValues.includes(key)
          ? legacySelectedValues.filter(v => v !== key)
          : [...legacySelectedValues, key];
        onValueChange(newValues);
      };

      return (
        <View style={styles.optionsContainer}>
          {question.options.map(option => (
            <TouchableOpacity
              key={option.value}
              style={styles.checkboxOption}
              onPress={() => toggleOption(option.value)}>
              <View
                style={[styles.checkbox, isOptionChecked(option.value) && styles.checkboxSelected]}>
                {isOptionChecked(option.value) && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <Text style={styles.optionLabel}>{trKey(option.labelKey)}</Text>
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
          {question.options.map(option => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.selectOption,
                isSelected(value, option.value) && styles.selectOptionSelected,
              ]}
              onPress={() => onValueChange(option.value)}>
              <Text
                style={[
                  styles.selectOptionText,
                  isSelected(value, option.value) && styles.selectOptionTextSelected,
                ]}>
                {trKey(option.labelKey)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      );
    };

    return (
      <View style={styles.container}>
        {/* Question Label */}
        {!(question.type === 'checkbox' && !question.options) && (
          <Text style={styles.label}>
            {trKey(question.labelKey)}
            {question.required && <Text style={styles.required}> *</Text>}
          </Text>
        )}

        {/* Input */}
        {renderInput()}

        {/* Error Message */}
        {error && <Text style={styles.errorText}>{error}</Text>}
      </View>
    );
  },
);

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
  dateDisplayInput: {
    justifyContent: 'center',
  },
  dateText: {
    fontSize: 16,
    color: '#1f2937',
  },
  datePlaceholder: {
    fontSize: 16,
    color: '#6b7280',
  },
  datePickerRow: {
    flexDirection: 'row',
    marginTop: 8,
  },
  dateDropdownCell: {
    flex: 1,
  },
  dateDropdownButton: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#fff',
  },
  dateDropdownText: {
    fontSize: 16,
    color: '#1f2937',
  },
  dateDropdownMenu: {
    marginTop: 6,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    backgroundColor: '#fff',
    maxHeight: 200,
  },
  dateDropdownScroll: {
    maxHeight: 200,
  },
  dateDropdownOption: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  dateDropdownOptionText: {
    fontSize: 16,
    color: '#1f2937',
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
  // Voice input styles
  textInputContainer: {
    position: 'relative',
  },
  textInputWithMic: {
    paddingRight: 50,
  },
  micButton: {
    position: 'absolute',
    right: 8,
    top: 8,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#2563eb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  micButtonActive: {
    backgroundColor: '#dc2626',
  },
  micIcon: {
    fontSize: 18,
  },
  voiceErrorText: {
    color: '#ef4444',
    fontSize: 12,
    marginTop: 4,
  },
});
