/**
 * ConsentTooltip - Expandable info section for consent items
 *
 * Shows an info icon (ℹ️) that expands to reveal:
 * - WHY the consent is needed
 * - What happens WITHOUT this consent
 *
 * Used in GDPRConsentScreen for each consent row.
 *
 * @security No PII. Static i18n-driven content only.
 * @compliance DSGVO Art. 25 - Transparency: Users must understand data processing purpose.
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { AppText } from './AppText';
import { colors, spacing, radius } from '../theme/tokens';

// Enable LayoutAnimation on Android
if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export interface ConsentTooltipProps {
  /** i18n-resolved text: why this consent is needed */
  whyText: string;
  /** i18n-resolved text: what happens without this consent */
  withoutText: string;
  /** Accessibility label for the info button */
  accessibilityLabel?: string;
  /** Test ID prefix */
  testID?: string;
}

/**
 * Expandable info tooltip for consent items.
 * Tapping the ℹ️ icon toggles an info box with "why" and "without" texts.
 */
export const ConsentTooltip = ({
  whyText,
  withoutText,
  accessibilityLabel,
  testID,
}: ConsentTooltipProps): React.JSX.Element => {
  const [expanded, setExpanded] = useState(false);

  const toggle = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(prev => !prev);
  }, []);

  return (
    <View style={styles.container}>
      <TouchableOpacity
        onPress={toggle}
        style={styles.infoButton}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ?? 'Mehr Informationen'}
        accessibilityState={{ expanded }}
        testID={testID ? `${testID}-toggle` : 'consent-tooltip-toggle'}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <AppText style={styles.infoIcon}>{expanded ? '✕' : 'ℹ️'}</AppText>
      </TouchableOpacity>

      {expanded && (
        <View
          style={styles.infoBox}
          accessibilityRole="text"
          testID={testID ? `${testID}-box` : 'consent-tooltip-box'}
        >
          <View style={styles.infoRow}>
            <AppText style={styles.infoLabel}>{'✓ '}</AppText>
            <AppText style={styles.infoText}>{whyText}</AppText>
          </View>
          <View style={styles.infoRow}>
            <AppText style={styles.infoLabel}>{'✗ '}</AppText>
            <AppText style={styles.withoutText}>{withoutText}</AppText>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginLeft: spacing.xs,
  },
  infoButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.infoSurface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.infoBorder,
  },
  infoIcon: {
    fontSize: 14,
    lineHeight: 18,
  },
  infoBox: {
    marginTop: spacing.sm,
    padding: spacing.md,
    backgroundColor: colors.infoSurface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.infoBorder,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: spacing.xs,
  },
  infoLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.infoText,
    width: 18,
  },
  infoText: {
    fontSize: 13,
    color: colors.infoText,
    flex: 1,
    lineHeight: 18,
  },
  withoutText: {
    fontSize: 13,
    color: colors.warningText ?? colors.textSecondary,
    flex: 1,
    lineHeight: 18,
    fontStyle: 'italic',
  },
});
