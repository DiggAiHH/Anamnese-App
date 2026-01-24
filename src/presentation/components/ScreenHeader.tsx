import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { colors, spacing } from '../theme/tokens';
import { AppText } from './AppText';

type Props = {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  rightAction?: React.ReactNode;
};

/**
 * Consistent screen header with optional back button and right action.
 * Use for all screens to maintain visual hierarchy.
 */
export const ScreenHeader: React.FC<Props> = ({ title, subtitle, onBack, rightAction }) => {
  return (
    <View style={styles.container}>
      <View style={styles.leftSection}>
        {onBack && (
          <Pressable
            onPress={onBack}
            style={styles.backButton}
            accessibilityRole="button"
            accessibilityLabel="Go back">
            <AppText style={styles.backIcon}>←</AppText>
          </Pressable>
        )}
        <View style={styles.titleContainer}>
          <AppText variant="h3" accessibilityRole="header">
            {title}
          </AppText>
          {subtitle && (
            <AppText variant="small" color="muted">
              {subtitle}
            </AppText>
          )}
        </View>
      </View>
      {rightAction && <View style={styles.rightSection}>{rightAction}</View>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    minHeight: 56,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backButton: {
    padding: spacing.sm,
    marginRight: spacing.sm,
    borderRadius: 8,
  },
  backIcon: {
    fontSize: 20,
  },
  titleContainer: {
    flex: 1,
  },
  rightSection: {
    marginLeft: spacing.md,
  },
});
