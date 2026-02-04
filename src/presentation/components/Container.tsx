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
 * 
 * FIXED: Removed hardcoded paddingTop that caused 2cm touch offset on Windows
 */
export const Container: React.FC<Props> = ({
  children,
  scroll = false,
  padding = layout.screenPadding,
  style,
}) => {
  const containerStyle = [styles.base, { padding }, style];

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
});
