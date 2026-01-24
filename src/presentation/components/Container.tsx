import React from 'react';
import { ScrollView, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { colors, layout } from '../theme/tokens';

type Props = {
  children: React.ReactNode;
  /** Use ScrollView instead of View */
  scroll?: boolean;
  /** Apply safe area padding */
  safe?: boolean;
  /** Custom padding override */
  padding?: number;
  style?: StyleProp<ViewStyle>;
};

/**
 * Standard container with consistent padding for screen layouts.
 * Use scroll=true for scrollable content.
 */
export const Container: React.FC<Props> = ({
  children,
  scroll = false,
  safe = false,
  padding = layout.screenPadding,
  style,
}) => {
  const containerStyle = [styles.base, { padding }, safe && styles.safeArea, style];

  if (scroll) {
    return (
      <ScrollView
        style={styles.base}
        contentContainerStyle={[{ padding }, style]}
        showsVerticalScrollIndicator={false}>
        {children}
      </ScrollView>
    );
  }

  return <View style={containerStyle}>{children}</View>;
};

const styles = StyleSheet.create({
  base: {
    flex: 1,
    backgroundColor: colors.background,
  },
  safeArea: {
    paddingTop: 44, // iOS safe area approximate
    paddingBottom: 34,
  },
});
