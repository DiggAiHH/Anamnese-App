import React from 'react';
import { StyleSheet, View, ViewProps } from 'react-native';
import { colors, radius, spacing } from '../theme/tokens';

export const getCardStyle = () => ({
  backgroundColor: colors.surface,
  borderRadius: radius.md,
  padding: spacing.lg,
  borderWidth: 1,
  borderColor: colors.divider,
});

type Props = ViewProps;

export const Card: React.FC<Props> = ({ style, ...props }) => {
  return <View style={[styles.card, style]} {...props} />;
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.divider,
  },
});
