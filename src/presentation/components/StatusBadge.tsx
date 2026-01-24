import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { colors, radius, spacing } from '../theme/tokens';
import { AppText } from './AppText';

type StatusVariant = 'info' | 'success' | 'warning' | 'error' | 'neutral';

type Props = {
  /** Status text to display */
  label: string;
  /** Status variant for color styling */
  variant?: StatusVariant;
  /** Optional icon element */
  icon?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
};

const variantColors: Record<StatusVariant, { bg: string; border: string; text: string }> = {
  info: { bg: colors.infoSurface, border: colors.infoBorder, text: colors.infoText },
  success: { bg: colors.successSurface, border: colors.successBorder, text: colors.successText },
  warning: { bg: colors.warningSurface, border: colors.warningBorder, text: colors.warningText },
  error: { bg: colors.dangerSurface, border: colors.dangerBorder, text: colors.dangerText },
  neutral: { bg: colors.surfaceAlt, border: colors.border, text: colors.textSecondary },
};

/**
 * Inline status badge for displaying state indicators (saved, error, etc.).
 */
export const StatusBadge: React.FC<Props> = ({ label, variant = 'neutral', icon, style }) => {
  const colorScheme = variantColors[variant];

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: colorScheme.bg,
          borderColor: colorScheme.border,
        },
        style,
      ]}
      accessibilityRole="text"
      accessibilityLabel={label}>
      {icon && <View style={styles.icon}>{icon}</View>}
      <AppText variant="caption" style={{ color: colorScheme.text }}>
        {label}
      </AppText>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.sm,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  icon: {
    marginRight: spacing.xs,
  },
});
