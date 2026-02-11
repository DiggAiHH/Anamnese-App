/**
 * FieldExplanation - Static inline hint for form fields
 *
 * Renders a small info box below a form field explaining:
 * - Why the field is collected (optional or required)
 * - What happens if left empty
 *
 * Used in PatientInfoScreen for email, phone, and other optional fields.
 *
 * @security No PII. Static i18n-driven content only.
 * @compliance DSGVO Art. 25 - Transparency: purpose of data collection made clear.
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { AppText } from './AppText';
import { colors, spacing, radius } from '../theme/tokens';

export interface FieldExplanationProps {
  /** i18n-resolved hint text */
  hint: string;
  /** Optional: consequence text when field is left empty */
  consequence?: string;
  /** Visual variant: 'info' (blue) or 'warning' (yellow) */
  variant?: 'info' | 'warning';
  /** Test ID */
  testID?: string;
}

/**
 * Static inline field explanation.
 * Renders below a form field with a colored left border.
 */
export const FieldExplanation = ({
  hint,
  consequence,
  variant = 'info',
  testID,
}: FieldExplanationProps): React.JSX.Element => {
  const isWarning = variant === 'warning';

  return (
    <View
      style={[
        styles.container,
        isWarning ? styles.containerWarning : styles.containerInfo,
      ]}
      accessibilityRole="text"
      testID={testID ?? 'field-explanation'}
    >
      <AppText
        style={[styles.hint, isWarning ? styles.hintWarning : styles.hintInfo]}
      >
        {hint}
      </AppText>
      {consequence ? (
        <AppText
          style={[
            styles.consequence,
            isWarning ? styles.consequenceWarning : styles.consequenceInfo,
          ]}
        >
          {consequence}
        </AppText>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: spacing.xs,
    marginBottom: spacing.sm,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.sm,
    borderLeftWidth: 3,
  },
  containerInfo: {
    backgroundColor: colors.infoSurface,
    borderLeftColor: colors.primary,
  },
  containerWarning: {
    backgroundColor: colors.warningSurface,
    borderLeftColor: colors.warning,
  },
  hint: {
    fontSize: 12,
    lineHeight: 16,
  },
  hintInfo: {
    color: colors.infoText,
  },
  hintWarning: {
    color: colors.warningText,
  },
  consequence: {
    fontSize: 11,
    lineHeight: 15,
    fontStyle: 'italic',
    marginTop: 2,
  },
  consequenceInfo: {
    color: colors.infoText,
    opacity: 0.8,
  },
  consequenceWarning: {
    color: colors.warningText,
    opacity: 0.8,
  },
});
