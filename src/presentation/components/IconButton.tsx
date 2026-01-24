import React from 'react';
import { Pressable, PressableProps, StyleProp, StyleSheet, ViewStyle } from 'react-native';
import { colors } from '../theme/tokens';

type Props = Omit<PressableProps, 'style'> & {
  /** Icon element to render */
  icon: React.ReactNode;
  /** Size of the button */
  size?: 'sm' | 'md' | 'lg';
  /** Variant for different contexts */
  variant?: 'default' | 'ghost' | 'danger';
  style?: StyleProp<ViewStyle>;
};

const sizeMap = {
  sm: 32,
  md: 40,
  lg: 48,
};

/**
 * Compact icon-only button for toolbar/header actions.
 */
export const IconButton: React.FC<Props> = ({
  icon,
  size = 'md',
  variant = 'default',
  disabled,
  style,
  ...props
}) => {
  const dimension = sizeMap[size];

  return (
    <Pressable
      {...props}
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled ?? false }}
      disabled={disabled}
      style={({ pressed }) => [
        styles.base,
        {
          width: dimension,
          height: dimension,
          borderRadius: dimension / 2,
        },
        variant === 'ghost' && styles.ghost,
        variant === 'danger' && styles.danger,
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
        style,
      ]}>
      {icon}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  ghost: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
  },
  danger: {
    backgroundColor: colors.dangerSurface,
    borderColor: colors.dangerBorder,
  },
  disabled: {
    opacity: 0.5,
  },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.95 }],
  },
});
