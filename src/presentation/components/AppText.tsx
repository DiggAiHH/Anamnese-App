import React from 'react';
import { StyleSheet, Text, TextProps } from 'react-native';
import { colors, typography } from '../theme/tokens';

export type AppTextVariant =
  | 'h1'
  | 'h2'
  | 'h3'
  | 'title'
  | 'subtitle'
  | 'body'
  | 'caption'
  | 'label'
  | 'small';
export type AppTextColor = 'default' | 'muted' | 'error' | 'success' | 'primary' | 'inverse';

export const getTextVariantStyle = (
  variant: AppTextVariant,
): { fontSize: number; lineHeight?: number; fontWeight?: '600' | '700' } => {
  const variantStyles = typography[variant] || typography.body;
  return {
    fontSize: variantStyles.fontSize,
    lineHeight: variantStyles.lineHeight,
    fontWeight:
      'fontWeight' in variantStyles ? (variantStyles.fontWeight as '600' | '700') : undefined,
  };
};

export const getTextColor = (color: AppTextColor): string => {
  switch (color) {
    case 'muted':
      return colors.textMuted;
    case 'error':
      return colors.dangerText;
    case 'success':
      return colors.successText;
    case 'primary':
      return colors.primary;
    case 'inverse':
      return colors.textInverse;
    default:
      return colors.textPrimary;
  }
};

type Props = TextProps & {
  variant?: AppTextVariant;
  color?: AppTextColor;
};

import { useTheme } from '../theme/ThemeContext';

export const AppText: React.FC<Props> = ({
  variant = 'body',
  color = 'default',
  style,
  ...props
}) => {
  const { fontScale, isHighContrast } = useTheme();
  const variantStyle = getTextVariantStyle(variant);

  // High Contrast: Default to white on black, unless inverse is requested
  let textColor = getTextColor(color);
  if (isHighContrast) {
    textColor = color === 'inverse' ? '#000000' : '#ffffff';
  }

  // Scale font size
  const scaledFontSize = variantStyle.fontSize * fontScale;

  return <Text style={[styles.base, variantStyle, { fontSize: scaledFontSize || 16, color: textColor }, style]} {...props} />;
};

const styles = StyleSheet.create({
  base: {
    color: colors.textPrimary,
  },
});
