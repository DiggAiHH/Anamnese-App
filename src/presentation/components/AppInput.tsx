import React from 'react';
import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';
import { colors, radius, spacing } from '../theme/tokens';

export const getInputBorderColor = (hasError: boolean): string => {
  return hasError ? colors.dangerBorder : colors.border;
};

type Props = TextInputProps & {
  label: string;
  required?: boolean;
  error?: string;
};

export const AppInput: React.FC<Props> = ({ label, required, error, style, ...props }) => {
  const borderColor = getInputBorderColor(Boolean(error));

  return (
    <View style={styles.container}>
      <Text style={styles.label}>
        {label}
        {required ? <Text style={styles.required}> *</Text> : null}
      </Text>
      <TextInput
        {...props}
        style={[styles.input, { borderColor }, style]}
        placeholderTextColor={colors.textSecondary}
      />
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.xl,
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
  errorText: {
    color: colors.dangerText,
    fontSize: 12,
    marginTop: spacing.xs,
  },
});
