/**
 * ScreenContainer — SafeAreaView wrapper for all screens.
 *
 * Provides consistent safe area insets, background color,
 * and optional KeyboardAvoidingView behavior.
 *
 * @example
 * ```tsx
 * <ScreenContainer testID="home-screen">
 *   <ScrollView>...</ScrollView>
 * </ScreenContainer>
 * ```
 */

import React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../theme/tokens';

interface ScreenContainerProps {
  children: React.ReactNode;
  /** Test ID for E2E tests */
  testID?: string;
  /** Accessibility label for screen readers */
  accessibilityLabel?: string;
  /** Whether to wrap in KeyboardAvoidingView (default: false) */
  withKeyboardAvoidance?: boolean;
  /** Additional style overrides */
  style?: ViewStyle;
  /** Background color override (default: colors.background) */
  backgroundColor?: string;
  /** SafeAreaView edges to apply (default: all) */
  edges?: ('top' | 'bottom' | 'left' | 'right')[];
}

export const ScreenContainer: React.FC<ScreenContainerProps> = ({
  children,
  testID,
  accessibilityLabel,
  withKeyboardAvoidance = false,
  style,
  backgroundColor,
  edges,
}) => {
  const containerStyle = [
    styles.container,
    backgroundColor ? { backgroundColor } : undefined,
    style,
  ];

  const content = (
    <SafeAreaView
      style={containerStyle}
      testID={testID}
      accessibilityLabel={accessibilityLabel}
      edges={edges}
    >
      {children}
    </SafeAreaView>
  );

  if (withKeyboardAvoidance) {
    return (
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {content}
      </KeyboardAvoidingView>
    );
  }

  return content;
};

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
});
