/**
 * OutputBox - Collapsible answer summary panel for the questionnaire flow
 *
 * Shows a running list of all answered questions. Each answer is clickable
 * to jump back to the original question for editing.
 *
 * Features:
 * - Collapsible header with answer count badge
 * - LayoutAnimation for smooth expand/collapse
 * - Scrollable list of AnswerItem components
 * - Empty state when no answers yet
 * - i18n support via outputBox.* keys
 *
 * @security No PII logged. Displays only user-entered data from store.
 * @compliance DSGVO Art. 25 - Transparency: user sees their own data.
 */

import React, { useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { AppText } from './AppText';
import { AnswerItem } from './AnswerItem';
import { colors, spacing, radius } from '../theme/tokens';
import type { AnswerValue } from '@domain/entities/Answer';

// Enable LayoutAnimation on Android
if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

/** Resolved answer item for display */
export interface ResolvedAnswer {
  questionId: string;
  label: string;
  value: string;
  sectionIndex: number;
}

export interface OutputBoxProps {
  /** Pre-resolved answer items to display */
  items: ResolvedAnswer[];
  /** Whether the box is currently expanded */
  expanded: boolean;
  /** Toggle expand/collapse state */
  onToggle: () => void;
  /** Navigate to a specific question */
  onNavigateToQuestion: (questionId: string, sectionIndex: number) => void;
  /** Maximum height of the scrollable list */
  maxHeight?: number;
  /** Test ID */
  testID?: string;
}

/**
 * Collapsible answer summary panel.
 * Header shows count badge; body shows scrollable AnswerItem list.
 */
export const OutputBox = ({
  items,
  expanded,
  onToggle,
  onNavigateToQuestion,
  maxHeight = 200,
  testID,
}: OutputBoxProps): React.JSX.Element => {
  const { t } = useTranslation();

  const handleToggle = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    onToggle();
  }, [onToggle]);

  const handleItemPress = useCallback(
    (questionId: string) => {
      const item = items.find(i => i.questionId === questionId);
      if (item) {
        onNavigateToQuestion(questionId, item.sectionIndex);
      }
    },
    [items, onNavigateToQuestion],
  );

  return (
    <View
      style={styles.container}
      testID={testID ?? 'output-box'}
      accessibilityRole="summary"
    >
      {/* Header */}
      <TouchableOpacity
        style={styles.header}
        onPress={handleToggle}
        accessibilityRole="button"
        accessibilityLabel={t('outputBox.title', { defaultValue: 'Ihre Antworten' })}
        accessibilityState={{ expanded }}
        testID={testID ? `${testID}-header` : 'output-box-header'}
      >
        <AppText style={styles.headerTitle}>
          {t('outputBox.title', { defaultValue: 'Ihre Antworten' })}
        </AppText>
        <View style={styles.headerRight}>
          {items.length > 0 && (
            <View style={styles.badge}>
              <AppText style={styles.badgeText}>{items.length}</AppText>
            </View>
          )}
          <AppText style={styles.chevron}>{expanded ? '▲' : '▼'}</AppText>
        </View>
      </TouchableOpacity>

      {/* Body */}
      {expanded && (
        <View
          style={[styles.body, { maxHeight }]}
          testID={testID ? `${testID}-body` : 'output-box-body'}
        >
          {items.length === 0 ? (
            <AppText style={styles.emptyText}>
              {t('outputBox.empty', { defaultValue: 'Noch keine Antworten' })}
            </AppText>
          ) : (
            <ScrollView
              nestedScrollEnabled
              keyboardShouldPersistTaps="handled"
            >
              {items.map(item => (
                <AnswerItem
                  key={item.questionId}
                  questionId={item.questionId}
                  label={item.label}
                  value={item.value}
                  onPress={handleItemPress}
                />
              ))}
            </ScrollView>
          )}
        </View>
      )}
    </View>
  );
};

/**
 * Helper: Resolve raw answers from the questionnaire store into display items.
 *
 * This function takes the questionnaire sections, the answers map, and
 * i18n translation function to produce a flat list of ResolvedAnswer objects.
 *
 * Extracted from QuestionnaireScreen.renderHistoryContent() for reuse.
 */
export function resolveAnswerItems(
  sections: ReadonlyArray<{
    questions: ReadonlyArray<{
      id: string;
      text?: string;
      options?: ReadonlyArray<{ value: string | number; label?: string }>;
    }>;
  }>,
  answers: Map<string, AnswerValue>,
): ResolvedAnswer[] {
  const result: ResolvedAnswer[] = [];

  sections.forEach((sec, sIdx) => {
    sec.questions.forEach(q => {
      const val = answers.get(q.id);
      if (val !== undefined && val !== null && val !== '') {
        let displayVal = String(val);

        if (q.options) {
          if (Array.isArray(val)) {
            displayVal = val
              .map(
                v =>
                  q.options?.find(o => String(o.value) === String(v))?.label ??
                  String(v),
              )
              .join(', ');
          } else {
            const opt = q.options.find(o => String(o.value) === String(val));
            if (opt) displayVal = opt.label ?? String(opt.value);
          }
        }

        result.push({
          questionId: q.id,
          label: q.text ?? q.id,
          value: displayVal,
          sectionIndex: sIdx,
        });
      }
    });
  });

  return result;
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surfaceAlt,
    minHeight: 44,
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  badge: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    marginRight: spacing.xs,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.onPrimary,
  },
  chevron: {
    fontSize: 12,
    color: colors.textMuted,
  },
  body: {
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  emptyText: {
    padding: spacing.lg,
    textAlign: 'center',
    color: colors.textMuted,
    fontStyle: 'italic',
    fontSize: 13,
  },
});
