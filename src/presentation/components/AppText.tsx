import React from 'react';
import { StyleSheet, Text, TextProps } from 'react-native';
import { colors } from '../theme/tokens';

export type AppTextVariant = 'title' | 'subtitle' | 'body' | 'caption' | 'label';

export const getTextVariantStyle = (variant: AppTextVariant): { fontSize: number; fontWeight?: '600' | '700' } => {
  switch (variant) {
    case 'title':
      return { fontSize: 24, fontWeight: '700' };
    case 'subtitle':
      return { fontSize: 14, fontWeight: '600' };
    case 'label':
      return { fontSize: 16, fontWeight: '600' };
    case 'caption':
      return { fontSize: 12 };
    default:
      return { fontSize: 16 };
  }
};

type Props = TextProps & {
  variant?: AppTextVariant;
};

export const AppText: React.FC<Props> = ({ variant = 'body', style, ...props }) => {
  const variantStyle = getTextVariantStyle(variant);
  return <Text style={[styles.base, variantStyle, style]} {...props} />;
};

const styles = StyleSheet.create({
  base: {
    color: colors.textPrimary,
  },
});
