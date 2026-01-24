import React from 'react';
import { Pressable, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { colors, radius, spacing } from '../theme/tokens';
import { AppText } from './AppText';

type Props = {
  /** Whether the checkbox is checked */
  checked: boolean;
  /** Callback when checkbox is toggled */
  onToggle: (checked: boolean) => void;
  /** Label text */
  label: string;
  /** Disabled state */
  disabled?: boolean;
  /** Error state */
  error?: boolean;
  style?: StyleProp<ViewStyle>;
};

/**
 * Accessible checkbox with label.
 */
export const Checkbox: React.FC<Props> = ({
  checked,
  onToggle,
  label,
  disabled = false,
  error = false,
  style,
}) => {
  const handlePress = (): void => {
    if (!disabled) {
      onToggle(!checked);
    }
  };

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled}
      accessibilityRole="checkbox"
      accessibilityState={{ checked, disabled }}
      accessibilityLabel={label}
      style={[styles.container, style]}>
      <View
        style={[
          styles.checkbox,
          checked && styles.checked,
          disabled && styles.disabled,
          error && styles.error,
        ]}>
        {checked && <AppText style={styles.checkmark}>✓</AppText>}
      </View>
      <AppText variant="body" color={disabled ? 'muted' : 'default'} style={styles.label}>
        {label}
      </AppText>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  disabled: {
    backgroundColor: colors.surfaceAlt,
    borderColor: colors.divider,
    opacity: 0.6,
  },
  error: {
    borderColor: colors.dangerBorder,
  },
  checkmark: {
    color: colors.onPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  label: {
    marginLeft: spacing.sm,
    flex: 1,
  },
});
