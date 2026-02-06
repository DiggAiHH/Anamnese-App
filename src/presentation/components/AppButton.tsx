import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  PressableProps,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import { AppText } from './AppText';
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
  | 'accent'
  | 'outline';

export type ButtonSize = 'sm' | 'md' | 'lg';

export const getButtonColors = (variant: ButtonVariant, disabled?: boolean) => {
  if (disabled) {
    return {
      backgroundColor: colors.divider,
      borderColor: colors.divider,
      textColor: colors.mutedText,
    };
  }

  switch (variant) {
    case 'secondary':
      return {
        backgroundColor: colors.surface,
        borderColor: colors.border,
        textColor: colors.primary,
      };
    case 'tertiary':
      return {
        backgroundColor: colors.surface,
        borderColor: colors.border,
        textColor: colors.text,
      };
    case 'danger':
      return {
        backgroundColor: colors.dangerSurface,
        borderColor: colors.dangerBorder,
        textColor: colors.dangerText,
      };
    case 'success':
      return {
        backgroundColor: colors.successSurface,
        borderColor: colors.successBorder,
        textColor: colors.successText,
      };
    case 'info':
      return {
        backgroundColor: colors.infoSurface,
        borderColor: colors.infoBorder,
        textColor: colors.infoText,
      };
    case 'warning':
      return {
        backgroundColor: colors.warningSurface,
        borderColor: colors.warningBorder,
        textColor: colors.warningText,
      };
    case 'accent':
      return {
        backgroundColor: colors.accentSurface,
        borderColor: colors.accentBorder,
        textColor: colors.accentText,
      };
    case 'ghost':
      return {
        backgroundColor: 'transparent',
        borderColor: 'transparent',
        textColor: colors.primary,
      };
    case 'outline':
      return {
        backgroundColor: 'transparent',
        borderColor: colors.primary,
        textColor: colors.primary,
      };
    default:
      return {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
        textColor: colors.onPrimary,
      };
  }
};

const sizeStyles = {
  sm: { paddingVertical: spacing.sm, paddingHorizontal: spacing.md, fontSize: 14 },
  md: { paddingVertical: spacing.md, paddingHorizontal: spacing.lg, fontSize: 16 },
  lg: { paddingVertical: spacing.lg, paddingHorizontal: spacing.xl, fontSize: 18 },
};

type Props = Omit<PressableProps, 'style'> & {
  /** @deprecated Use title instead */
  label?: string;
  title?: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  /** Icon element to show on the left */
  iconLeft?: React.ReactNode;
  /** Icon element to show on the right */
  iconRight?: React.ReactNode;
  /** Full width button */
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
};

import { useTheme } from '../theme/ThemeContext';

export const AppButton: React.FC<Props> = ({
  label,
  title,
  variant = 'primary',
  size = 'md',
  disabled,
  loading,
  iconLeft,
  iconRight,
  fullWidth,
  style,
  ...props
}) => {
  const { fontScale, isHighContrast } = useTheme();
  const colorsForVariant = getButtonColors(variant, disabled || loading);
  const displayText = title ?? label ?? '';
  const sizeStyle = sizeStyles[size];

  // Adjust colors for high contrast mode
  let backgroundColor = colorsForVariant.backgroundColor;
  let borderColor = colorsForVariant.borderColor;
  let textColor = colorsForVariant.textColor;

  if (isHighContrast) {
    backgroundColor = '#ffffff';
    borderColor = '#000000';
    textColor = '#000000';
  }

  return (
    <Pressable
      {...props}
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: backgroundColor,
          borderColor: borderColor,
          paddingVertical: sizeStyle.paddingVertical * fontScale, // Also scale padding to accommodate larger text
          paddingHorizontal: sizeStyle.paddingHorizontal * fontScale,
        },
        fullWidth && styles.fullWidth,
        (disabled || loading) && styles.disabled,
        pressed && !(disabled || loading) && styles.pressed,
        style,
      ]}>
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <View style={styles.content}>
          {iconLeft && <View style={styles.iconLeft}>{iconLeft}</View>}
          <AppText
            style={[
              styles.text,
              { color: textColor, fontSize: sizeStyle.fontSize * fontScale },
            ]}>
            {displayText}
          </AppText>
          {iconRight && <View style={styles.iconRight}>{iconRight}</View>}
        </View>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  text: {
    fontWeight: '600',
  },
  iconLeft: {
    marginRight: spacing.sm,
  },
  iconRight: {
    marginLeft: spacing.sm,
  },
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: 0.7,
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
});
