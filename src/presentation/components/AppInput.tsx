import React, { useState } from 'react';
import { StyleSheet, TextInput, TextInputProps, View } from 'react-native';
import { colors, focus, radius, spacing } from '../theme/tokens';

export const getInputBorderColor = (hasError: boolean, isFocused: boolean): string => {
  if (hasError) return colors.dangerBorder;
  if (isFocused) return focus.color;
  return colors.border;
};

type Props = TextInputProps & {
  label: string;
  required?: boolean;
  error?: string;
  /** Helper text shown below input */
  helperText?: string;
  /** Disable the input */
  disabled?: boolean;
};

import { useTheme } from '../theme/ThemeContext';
import { AppText } from './AppText';

export const AppInput: React.FC<Props> = ({
  label,
  required,
  error,
  helperText,
  disabled,
  style,
  onFocus,
  onBlur,
  ...props
}) => {
  const { fontScale, isHighContrast } = useTheme();
  const [isFocused, setIsFocused] = useState(false);
  const borderColor = getInputBorderColor(Boolean(error), isFocused);
  const hasError = Boolean(error);

  // High Contrast adjustments
  let inputBackgroundColor = colors.surface;
  let labelColor = colors.textPrimary;
  let contrastBorderColor = borderColor;

  if (isHighContrast) {
    inputBackgroundColor = '#ffffff';
    labelColor = '#000000';
    contrastBorderColor = '#000000';
  }

  return (
    <View style={styles.container}>
      <AppText
        style={[styles.label, { color: labelColor }]}
        nativeID={`${label}-label`}
      >
        {label}
        {required ? <AppText style={styles.required}> *</AppText> : null}
      </AppText>
      <TextInput
        {...props}
        editable={!disabled}
        accessibilityLabelledBy={`${label}-label`}
        accessibilityState={{ disabled }}
        style={[
          styles.input,
          {
            borderColor: contrastBorderColor,
            backgroundColor: inputBackgroundColor,
            fontSize: 16 * fontScale,
          },
          isFocused && styles.focused,
          disabled && styles.disabled,
          style,
        ]}
        placeholderTextColor={isHighContrast ? '#666666' : colors.textMuted}
        onFocus={e => {
          setIsFocused(true);
          onFocus?.(e);
        }}
        onBlur={e => {
          setIsFocused(false);
          onBlur?.(e);
        }}
      />
      {hasError && (
        <AppText variant="small" style={styles.errorText}>
          {error}
        </AppText>
      )}
      {!hasError && helperText && (
        <AppText variant="small" style={styles.helperText}>
          {helperText}
        </AppText>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  required: {
    color: colors.dangerText,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
    fontSize: 16,
    color: colors.textPrimary,
  },
  focused: {
    borderWidth: focus.width,
  },
  disabled: {
    backgroundColor: colors.surfaceAlt,
    opacity: 0.7,
  },
  errorText: {
    color: colors.dangerText,
    fontSize: 12,
    marginTop: spacing.xs,
  },
  helperText: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: spacing.xs,
  },
});
