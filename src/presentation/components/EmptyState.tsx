import React from 'react';
import { StyleSheet, Text, View, ViewProps } from 'react-native';
import { colors, spacing } from '../theme/tokens';

export const getEmptyStatePadding = () => ({
  padding: spacing.xxl,
});

type Props = ViewProps & {
  title: string;
  description?: string;
};

export const EmptyState: React.FC<Props> = ({ title, description, style, ...props }) => {
  return (
    <View style={[styles.container, style]} {...props}>
      <Text style={styles.title}>{title}</Text>
      {description ? <Text style={styles.description}>{description}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: spacing.xxl,
    alignItems: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  description: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
