import React from 'react';
import { Pressable, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { colors, spacing } from '../theme/tokens';
import { AppText } from './AppText';

type RadioOption<T> = {
  value: T;
  label: string;
  disabled?: boolean;
};

type Props<T> = {
  /** Array of radio options */
  options: RadioOption<T>[];
  /** Currently selected value */
  value: T | null;
  /** Callback when selection changes */
  onChange: (value: T) => void;
  /** Label for the entire group */
  label?: string;
  /** Horizontal layout */
  horizontal?: boolean;
  /** Disabled entire group */
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
};

/**
 * Radio button group for single-select options.
 */
export function RadioGroup<T extends string | number>({
  options,
  value,
  onChange,
  label,
  horizontal = false,
  disabled = false,
  style,
}: Props<T>): React.ReactElement {
  return (
    <View style={style} accessibilityRole="radiogroup" accessibilityLabel={label}>
      {label && (
        <AppText variant="label" style={styles.groupLabel}>
          {label}
        </AppText>
      )}
      <View style={[styles.optionsContainer, horizontal && styles.horizontal]}>
        {options.map(option => {
          const isSelected = value === option.value;
          const isDisabled = disabled || option.disabled;

          return (
            <Pressable
              key={String(option.value)}
              onPress={() => !isDisabled && onChange(option.value)}
              disabled={isDisabled}
              accessibilityRole="radio"
              accessibilityState={{ checked: isSelected, disabled: isDisabled }}
              accessibilityLabel={option.label}
              style={styles.optionContainer}>
              <View
                style={[
                  styles.radio,
                  isSelected && styles.radioSelected,
                  isDisabled && styles.radioDisabled,
                ]}>
                {isSelected && <View style={styles.radioDot} />}
              </View>
              <AppText
                variant="body"
                color={isDisabled ? 'muted' : 'default'}
                style={styles.optionLabel}>
                {option.label}
              </AppText>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  groupLabel: {
    marginBottom: spacing.sm,
  },
  optionsContainer: {
    gap: spacing.sm,
  },
  horizontal: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.lg,
  },
  optionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  radio: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 12,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: {
    borderColor: colors.primary,
  },
  radioDisabled: {
    backgroundColor: colors.surfaceAlt,
    borderColor: colors.divider,
    opacity: 0.6,
  },
  radioDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.primary,
  },
  optionLabel: {
    marginLeft: spacing.sm,
  },
});
