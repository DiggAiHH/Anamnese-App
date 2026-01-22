import React from 'react';
import { StyleSheet, View, ViewProps } from 'react-native';
import { spacing } from '../theme/tokens';

export const getSectionSpacing = () => ({
  marginBottom: spacing.xxl,
});

type Props = ViewProps;

export const Section: React.FC<Props> = ({ style, ...props }) => {
  return <View style={[styles.section, style]} {...props} />;
};

const styles = StyleSheet.create({
  section: {
    marginBottom: spacing.xxl,
  },
});
