/**
 * AnswerItem - Single answered question display with jump-to-question action
 *
 * Renders a compact row showing the question label and the user's answer.
 * Tapping the row triggers navigation back to that question for editing.
 *
 * Used inside OutputBox to display the running list of answers.
 *
 * @security No PII logged. Displays answer values already present in store.
 * @compliance DSGVO Art. 25 - Displays only data the user has already entered.
 */

import React from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import { AppText } from './AppText';
import { colors, spacing } from '../theme/tokens';

export interface AnswerItemProps {
  /** The question ID */
  questionId: string;
  /** Resolved question label text */
  label: string;
  /** Formatted answer value */
  value: string;
  /** Callback when user taps to jump to this question */
  onPress: (questionId: string) => void;
  /** Test ID */
  testID?: string;
}

/**
 * Compact answer row with label + value.
 * Tapping navigates to the original question.
 */
export const AnswerItem = ({
  questionId,
  label,
  value,
  onPress,
  testID,
}: AnswerItemProps): React.JSX.Element => {
  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => onPress(questionId)}
      accessibilityRole="button"
      accessibilityLabel={`${label}: ${value}`}
      accessibilityHint="Zur Frage springen"
      testID={testID ?? `answer-item-${questionId}`}
    >
      <AppText style={styles.label} numberOfLines={1}>
        {label}
      </AppText>
      <AppText style={styles.value} numberOfLines={1}>
        {value}
      </AppText>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    backgroundColor: colors.surface,
    minHeight: 44, // WCAG 2.2 AA target size
  },
  label: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    marginRight: spacing.sm,
  },
  value: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: colors.primary,
    textAlign: 'right',
  },
});
