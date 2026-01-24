import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';
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
  const [isFocused, setIsFocused] = useState(false);
  const borderColor = getInputBorderColor(Boolean(error), isFocused);
  const hasError = Boolean(error);

  return (
    <View style={styles.container}>
      <Text style={styles.label} nativeID={`${label}-label`}>
        {label}
        {required ? <Text style={styles.required}> *</Text> : null}
      </Text>
      <TextInput
        {...props}
        editable={!disabled}
        accessibilityLabelledBy={`${label}-label`}
        accessibilityState={{ disabled }}
        style={[
          styles.input,
          { borderColor },
          isFocused && styles.focused,
          disabled && styles.disabled,
          style,
        ]}
        placeholderTextColor={colors.textMuted}
        onFocus={e => {
          setIsFocused(true);
          onFocus?.(e);
        }}
        onBlur={e => {
          setIsFocused(false);
          onBlur?.(e);
        }}
      />
      {hasError && <Text style={styles.errorText}>{error}</Text>}
      {!hasError && helperText && <Text style={styles.helperText}>{helperText}</Text>}
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
