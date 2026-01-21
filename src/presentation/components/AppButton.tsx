import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, TouchableOpacityProps } from 'react-native';
import { colors, radius, spacing } from '../theme/tokens';

export type ButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'danger' | 'ghost';

export const getButtonColors = (variant: ButtonVariant, disabled?: boolean) => {
  if (disabled) {
    return { backgroundColor: colors.divider, borderColor: colors.divider, textColor: colors.mutedText };
  }

  switch (variant) {
    case 'secondary':
      return { backgroundColor: colors.surface, borderColor: colors.border, textColor: colors.primary };
    case 'tertiary':
      return { backgroundColor: colors.surface, borderColor: colors.border, textColor: colors.text };
    case 'danger':
      return { backgroundColor: colors.dangerSurface, borderColor: colors.dangerBorder, textColor: colors.dangerText };
    case 'ghost':
      return { backgroundColor: 'transparent', borderColor: 'transparent', textColor: colors.primary };
    default:
      return { backgroundColor: colors.primary, borderColor: colors.primary, textColor: colors.onPrimary };
  }
};

type Props = TouchableOpacityProps & {
  /** @deprecated Use title instead */
  label?: string;
  title?: string;
  variant?: ButtonVariant;
  loading?: boolean;
};

export const AppButton: React.FC<Props> = ({ label, title, variant = 'primary', disabled, loading, style, ...props }) => {
  const colorsForVariant = getButtonColors(variant, disabled || loading);
  const displayText = title ?? label ?? '';

  return (
    <TouchableOpacity
      {...props}
      accessibilityRole="button"
      disabled={disabled || loading}
      style={[
        styles.base,
        { backgroundColor: colorsForVariant.backgroundColor, borderColor: colorsForVariant.borderColor },
        style,
        (disabled || loading) ? styles.disabled : undefined,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={colorsForVariant.textColor} />
      ) : (
        <Text style={[styles.text, { color: colorsForVariant.textColor }]}>{displayText}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    padding: spacing.lg,
    borderRadius: radius.md,
    alignItems: 'center',
    borderWidth: 1,
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
  },
  disabled: {
    opacity: 0.7,
  },
});
