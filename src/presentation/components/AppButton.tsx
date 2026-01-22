import React from 'react';
import { ActivityIndicator, Pressable, PressableProps, StyleProp, StyleSheet, Text, ViewStyle } from 'react-native';
import { colors, radius, spacing } from '../theme/tokens';

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'tertiary'
  | 'danger'
  | 'ghost'
  | 'success'
  | 'info'
  | 'warning'
  | 'accent';

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
    case 'success':
      return { backgroundColor: colors.successSurface, borderColor: colors.successBorder, textColor: colors.successText };
    case 'info':
      return { backgroundColor: colors.infoSurface, borderColor: colors.infoBorder, textColor: colors.infoText };
    case 'warning':
      return { backgroundColor: colors.warningSurface, borderColor: colors.warningBorder, textColor: colors.warningText };
    case 'accent':
      return { backgroundColor: colors.accentSurface, borderColor: colors.accentBorder, textColor: colors.accentText };
    case 'ghost':
      return { backgroundColor: 'transparent', borderColor: 'transparent', textColor: colors.primary };
    default:
      return { backgroundColor: colors.primary, borderColor: colors.primary, textColor: colors.onPrimary };
  }
};

type Props = Omit<PressableProps, 'style'> & {
  /** @deprecated Use title instead */
  label?: string;
  title?: string;
  variant?: ButtonVariant;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
};

export const AppButton: React.FC<Props> = ({ label, title, variant = 'primary', disabled, loading, style, ...props }) => {
  const colorsForVariant = getButtonColors(variant, disabled || loading);
  const displayText = title ?? label ?? '';

  return (
    <Pressable
      {...props}
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.base,
        { backgroundColor: colorsForVariant.backgroundColor, borderColor: colorsForVariant.borderColor },
        (disabled || loading) ? styles.disabled : undefined,
        pressed && !(disabled || loading) ? styles.pressed : undefined,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={colorsForVariant.textColor} />
      ) : (
        <Text style={[styles.text, { color: colorsForVariant.textColor }]}>{displayText}</Text>
      )}
    </Pressable>
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
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
});
