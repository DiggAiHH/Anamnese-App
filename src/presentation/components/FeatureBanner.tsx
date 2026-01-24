import React from 'react';
import { StyleSheet, View, ViewProps } from 'react-native';
import { colors, radius, spacing } from '../theme/tokens';
import { AppText } from './AppText';

export type BannerVariant = 'info' | 'warning' | 'error';

export const getBannerColors = (variant: BannerVariant) => {
  switch (variant) {
    case 'warning':
      return {
        backgroundColor: colors.warningSurface,
        borderColor: colors.warningBorder,
        textColor: colors.warningText,
      };
    case 'error':
      return {
        backgroundColor: colors.dangerSurface,
        borderColor: colors.dangerBorder,
        textColor: colors.dangerText,
      };
    default:
      return {
        backgroundColor: colors.infoSurface,
        borderColor: colors.infoBorder,
        textColor: colors.infoText,
      };
  }
};

type Props = ViewProps & {
  title: string;
  message?: string;
  variant?: BannerVariant;
};

export const FeatureBanner: React.FC<Props> = ({
  title,
  message,
  variant = 'warning',
  style,
  ...props
}) => {
  const bannerColors = getBannerColors(variant);

  return (
    <View
      {...props}
      accessibilityRole="alert"
      style={[
        styles.container,
        { backgroundColor: bannerColors.backgroundColor, borderColor: bannerColors.borderColor },
        style,
      ]}>
      <AppText variant="label" style={[styles.title, { color: bannerColors.textColor }]}>
        {title}
      </AppText>
      {message ? (
        <AppText variant="caption" style={[styles.message, { color: bannerColors.textColor }]}>
          {message}
        </AppText>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  title: {
    marginBottom: spacing.xs,
  },
  message: {
    lineHeight: 18,
  },
});
