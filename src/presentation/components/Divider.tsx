import React from 'react';
import { StyleSheet, View } from 'react-native';
import { colors, spacing } from '../theme/tokens';

type Props = {
  /** Vertical margin around the divider */
  spacing?: 'none' | 'sm' | 'md' | 'lg';
  /** Lighter appearance */
  light?: boolean;
};

const spacingMap = {
  none: 0,
  sm: spacing.sm,
  md: spacing.md,
  lg: spacing.lg,
};

/**
 * Horizontal divider line for visual separation.
 */
export const Divider: React.FC<Props> = ({ spacing: spacingProp = 'md', light = false }) => {
  const margin = spacingMap[spacingProp];

  return <View style={[styles.divider, { marginVertical: margin }, light && styles.light]} />;
};

const styles = StyleSheet.create({
  divider: {
    height: 1,
    backgroundColor: colors.border,
    width: '100%',
  },
  light: {
    backgroundColor: colors.divider,
  },
});
