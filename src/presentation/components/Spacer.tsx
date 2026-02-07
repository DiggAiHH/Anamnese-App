import React from 'react';
import { View } from 'react-native';
import { spacing } from '../theme/tokens';

type SpacerSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl' | 'xxxl';

type Props = {
  /** Predefined size from spacing tokens */
  size?: SpacerSize;
  /** Custom height in pixels (overrides size) */
  height?: number;
  /** Horizontal spacer instead of vertical */
  horizontal?: boolean;
};

/**
 * Consistent spacing component using design tokens.
 * Default is vertical spacer with md (12px) spacing.
 */
export const Spacer: React.FC<Props> = ({ size = 'md', height, horizontal = false }) => {
  const dimension = height ?? spacing[size];

  if (horizontal) {
    return <View style={{ width: dimension }} />;
  }

  return <View style={{ height: dimension }} />;
};
