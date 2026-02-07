import React, { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { colors, radius, spacing } from '../theme/tokens';
import { AppText } from './AppText';

type SelectOption<T> = {
  value: T;
  label: string;
  disabled?: boolean;
};

type Props<T> = {
  /** Array of select options */
  options: SelectOption<T>[];
  /** Currently selected value */
  value: T | null;
  /** Callback when selection changes */
  onChange: (value: T) => void;
  /** Label for the select */
  label?: string;
  /** Placeholder text when no value selected */
  placeholder?: string;
  /** Disabled state */
  disabled?: boolean;
  /** Error message */
  error?: string;
  style?: StyleProp<ViewStyle>;
};

/**
 * Accessible dropdown/select component.
 */
export function Select<T extends string | number>({
  options,
  value,
  onChange,
  label,
  placeholder = 'Select an option',
  disabled = false,
  error,
  style,
}: Props<T>): React.ReactElement {
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption = options.find(opt => opt.value === value);
  const hasError = Boolean(error);

  const handleSelect = (option: SelectOption<T>): void => {
    if (!option.disabled) {
      onChange(option.value);
      setIsOpen(false);
    }
  };

  return (
    <View style={style}>
      {label && (
        <AppText variant="label" style={styles.label}>
          {label}
        </AppText>
      )}
      <Pressable
        onPress={() => !disabled && setIsOpen(true)}
        disabled={disabled}
        accessibilityRole="combobox"
        accessibilityState={{ disabled, expanded: isOpen }}
        accessibilityLabel={label || placeholder}
        accessibilityValue={{ text: selectedOption?.label || placeholder }}
        style={[
          styles.trigger,
          disabled && styles.triggerDisabled,
          hasError && styles.triggerError,
        ]}>
        <AppText color={selectedOption ? 'default' : 'muted'} style={styles.triggerText}>
          {selectedOption?.label || placeholder}
        </AppText>
        <AppText color="muted" style={styles.chevron}>
          ▼
        </AppText>
      </Pressable>
      {hasError && (
        <AppText variant="caption" color="error" style={styles.error}>
          {error}
        </AppText>
      )}

      <Modal
        visible={isOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsOpen(false)}>
        <Pressable style={styles.overlay} onPress={() => setIsOpen(false)}>
          <View style={styles.dropdown}>
            <ScrollView style={styles.scrollView}>
              {options.map(option => (
                <Pressable
                  key={String(option.value)}
                  onPress={() => handleSelect(option)}
                  disabled={option.disabled}
                  accessibilityRole="menuitem"
                  accessibilityState={{
                    selected: option.value === value,
                    disabled: option.disabled,
                  }}
                  style={[
                    styles.option,
                    option.value === value && styles.optionSelected,
                    option.disabled && styles.optionDisabled,
                  ]}>
                  <AppText
                    color={
                      option.disabled ? 'muted' : option.value === value ? 'primary' : 'default'
                    }>
                    {option.label}
                  </AppText>
                  {option.value === value && <AppText color="primary">✓</AppText>}
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    marginBottom: spacing.sm,
  },
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    minHeight: 48,
  },
  triggerDisabled: {
    backgroundColor: colors.surfaceAlt,
    opacity: 0.7,
  },
  triggerError: {
    borderColor: colors.dangerBorder,
  },
  triggerText: {
    flex: 1,
  },
  chevron: {
    marginLeft: spacing.sm,
    fontSize: 10,
  },
  error: {
    marginTop: spacing.xs,
  },
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    padding: spacing.xl,
  },
  dropdown: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    maxHeight: 300,
    overflow: 'hidden',
  },
  scrollView: {
    padding: spacing.sm,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderRadius: radius.sm,
  },
  optionSelected: {
    backgroundColor: colors.primaryLight,
  },
  optionDisabled: {
    opacity: 0.5,
  },
});
