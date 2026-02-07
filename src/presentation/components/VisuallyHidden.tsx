import React from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText } from './AppText';

type Props = {
  children: React.ReactNode;
};

/**
 * Renders content that is visually hidden but accessible to screen readers.
 * Use for providing additional context that sighted users don't need.
 */
export const VisuallyHidden: React.FC<Props> = ({ children }) => {
  return (
    <View style={styles.container} accessibilityRole="text" importantForAccessibility="yes">
      {typeof children === 'string' ? <AppText>{children}</AppText> : children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    width: 1,
    height: 1,
    padding: 0,
    margin: -1,
    overflow: 'hidden',
    // React Native doesn't support clip, so we use opacity as fallback
    opacity: 0,
  },
});
