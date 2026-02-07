import React, { useEffect, useRef } from 'react';
import { Animated, DimensionValue, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { colors, radius, spacing } from '../theme/tokens';

type Props = {
  /** Width of the skeleton */
  width?: DimensionValue;
  /** Height of the skeleton */
  height?: number;
  /** Border radius */
  borderRadius?: number;
  /** Circle shape */
  circle?: boolean;
  style?: StyleProp<ViewStyle>;
};

/**
 * Animated loading skeleton placeholder for content.
 */
export const LoadingSkeleton: React.FC<Props> = ({
  width = '100%',
  height = 20,
  borderRadius = radius.sm,
  circle = false,
  style,
}) => {
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [animatedValue]);

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  const dimension = circle ? height : undefined;

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          width: circle ? dimension : width,
          height,
          borderRadius: circle ? height / 2 : borderRadius,
          opacity,
        },
        style,
      ]}
      accessibilityLabel="Loading"
      accessibilityRole="progressbar"
    />
  );
};

/**
 * Pre-composed skeleton variants for common use cases.
 */
export const SkeletonText: React.FC<{ lines?: number }> = ({ lines = 3 }) => (
  <View style={styles.textContainer}>
    {Array.from({ length: lines }).map((_, i) => (
      <LoadingSkeleton
        key={i}
        width={i === lines - 1 ? '60%' : '100%'}
        height={16}
        style={styles.textLine}
      />
    ))}
  </View>
);

export const SkeletonCard: React.FC = () => (
  <View style={styles.card}>
    <LoadingSkeleton circle height={48} />
    <View style={styles.cardContent}>
      <LoadingSkeleton width="70%" height={18} />
      <LoadingSkeleton width="40%" height={14} style={{ marginTop: spacing.sm }} />
    </View>
  </View>
);

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: colors.border,
  },
  textContainer: {
    gap: spacing.sm,
  },
  textLine: {
    marginBottom: spacing.xs,
  },
  card: {
    flexDirection: 'row',
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    gap: spacing.md,
  },
  cardContent: {
    flex: 1,
    justifyContent: 'center',
  },
});
