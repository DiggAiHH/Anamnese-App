import React from 'react';
import { StyleSheet, View, ViewProps } from 'react-native';
import { colors, spacing } from '../theme/tokens';
import { AppText } from './AppText';

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
      <AppText variant="label" style={styles.title}>
        {title}
      </AppText>
      {description ? (
        <AppText variant="caption" style={styles.description}>
          {description}
        </AppText>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: spacing.xxl,
    alignItems: 'center',
  },
  title: {
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  description: {
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
