/**
 * SummaryScreen - comprehensive summary + output box + export
 * ISO/WCAG: Token-based design system
 */

import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { useQuestionnaireStore, selectProgress } from '../state/useQuestionnaireStore';
import { colors, spacing, radius } from '../theme/tokens';
import { Card } from '../components/Card';
import { AppButton } from '../components/AppButton';

type Props = NativeStackScreenProps<RootStackParamList, 'Summary'>;

export const SummaryScreen = ({ navigation, route }: Props): React.JSX.Element => {
  const { t } = useTranslation();
  const { questionnaireId } = route.params;
  const { reset, questionnaire, answers, patient } = useQuestionnaireStore();
  const progress = selectProgress(useQuestionnaireStore.getState());
  const safeProgress = Number.isFinite(progress) ? progress : 0;
  
  // Build structured summary of all answers
  const answerSummary = useMemo(() => {
    if (!questionnaire) return [];
    
    const summary: Array<{
      sectionTitle: string;
      questions: Array<{
        questionText: string;
        answer: string;
        questionId: string;
      }>;
    }> = [];
    
    questionnaire.sections.forEach((section) => {
      const sectionQuestions: typeof summary[0]['questions'] = [];
      
      section.questions.forEach((question) => {
        const answerValue = answers.get(question.id);
        if (answerValue !== undefined && answerValue !== null && answerValue !== '') {
          let displayAnswer = '';
          
          if (typeof answerValue === 'boolean') {
            displayAnswer = answerValue ? t('common.yes', { defaultValue: 'Ja' }) : t('common.no', { defaultValue: 'Nein' });
          } else if (Array.isArray(answerValue)) {
            displayAnswer = answerValue.join(', ');
          } else {
            displayAnswer = String(answerValue);
          }
          
          sectionQuestions.push({
            questionText: t(question.labelKey, { defaultValue: question.labelKey }),
            answer: displayAnswer,
            questionId: question.id,
          });
        }
      });
      
      if (sectionQuestions.length > 0) {
        summary.push({
          sectionTitle: t(section.titleKey, { defaultValue: section.titleKey }),
          questions: sectionQuestions,
        });
      }
    });
    
    return summary;
  }, [questionnaire, answers, t]);
  
  // Build plain text for clipboard
  const plainTextSummary = useMemo(() => {
    let text = '';
    
    // Patient info
    if (patient) {
      const pd = patient.encryptedData;
      text += `${t('summary.patientData', { defaultValue: 'Patientendaten' })}:\n`;
      text += `${t('patientInfo.firstName')}: ${pd.firstName}\n`;
      text += `${t('patientInfo.lastName')}: ${pd.lastName}\n`;
      if (pd.birthDate) {
        text += `${t('patientInfo.birthDate')}: ${pd.birthDate}\n`;
      }
      if (pd.gender) {
        text += `${t('patientInfo.gender')}: ${pd.gender}\n`;
      }
      text += '\n---\n\n';
    }
    
    // Answers by section
    answerSummary.forEach((section) => {
      const titleLength = Math.max(0, section.sectionTitle?.length ?? 0);
      text += `${section.sectionTitle}\n${'='.repeat(titleLength)}\n\n`;
      section.questions.forEach((q) => {
        text += `${q.questionText}\n→ ${q.answer}\n\n`;
      });
    });
    
    return text;
  }, [answerSummary, patient, t]);
  
  const handleCopyToClipboard = async (): Promise<void> => {
    try {
      const runtimeNavigator = (globalThis as { navigator?: { clipboard?: { writeText?: (text: string) => Promise<void> } } })
        .navigator;
      if (Platform.OS === 'web' && runtimeNavigator?.clipboard?.writeText) {
        await runtimeNavigator.clipboard.writeText(plainTextSummary);
        return;
      }

      type ClipboardModule = { setString?: (text: string) => void };
      // Lazy require to avoid web/runtime module issues.
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const mod = require('@react-native-clipboard/clipboard') as ClipboardModule & {
        default?: ClipboardModule;
      };
      const clipboard = (mod?.default ?? mod) as ClipboardModule;
      clipboard?.setString?.(plainTextSummary);
    } catch {
      // Ignore clipboard failures; summary is still visible.
    }
  };

  const answeredCount = answerSummary.reduce(
    (acc, section) => acc + section.questions.length,
    0
  );
  const safeAnsweredCount = Number.isFinite(answeredCount) ? answeredCount : 0;

  if (!questionnaire) {
    return (
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        testID="summary-screen"
        accessibilityRole="scrollbar"
        accessibilityLabel={t('summary.title')}>
        <Text style={styles.title} accessibilityRole="header">
          {t('summary.title')}
        </Text>
        <Text style={styles.noAnswersText}>
          {t('summary.noAnswers', { defaultValue: 'Keine Antworten vorhanden' })}
        </Text>
        <AppButton
          variant="secondary"
          title={t('common.continue', { defaultValue: 'Continue' })}
          onPress={() => navigation.goBack()}
        />
      </ScrollView>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      testID="summary-screen"
      accessibilityRole="scrollbar"
      accessibilityLabel={t('summary.title')}>
      <Text style={styles.title} accessibilityRole="header">
        {t('summary.title')}
      </Text>
      <Text style={styles.subtitle}>
        {t('summary.subtitle', { id: questionnaireId })}
      </Text>

      {/* Progress Card */}
      <Card style={styles.progressCard}>
        <Text style={styles.cardTitle} accessibilityRole="header">
          {t('summary.statusTitle')}
        </Text>
        <Text style={styles.cardText}>
          {t('summary.progress', { percent: Math.round(safeProgress) })}
        </Text>
        <Text style={styles.answeredText}>
          {t('summary.answeredQuestions', { count: safeAnsweredCount, defaultValue: '{{count}} Fragen beantwortet' })}
        </Text>
      </Card>

      {/* Output Box - Answer Summary */}
      <View style={styles.outputBox}>
        <View style={styles.outputHeader}>
          <Text style={styles.outputTitle}>
            {t('summary.outputBoxTitle', { defaultValue: 'Ihre Antworten' })}
          </Text>
          <TouchableOpacity
            style={styles.copyButton}
            onPress={handleCopyToClipboard}
            testID="btn-copy-summary"
            accessibilityRole="button">
            <Text style={styles.copyButtonText}>
              {t('summary.copyButton', { defaultValue: '📋 Kopieren' })}
            </Text>
          </TouchableOpacity>
        </View>
        
        {/* Patient Info Section */}
        {patient && (
          <View style={styles.patientSection}>
            <Text style={styles.sectionTitle}>
              {t('summary.patientData', { defaultValue: 'Patientendaten' })}
            </Text>
            <View style={styles.patientRow}>
              <Text style={styles.patientLabel}>{t('patientInfo.firstName')}:</Text>
              <Text style={styles.patientValue}>{patient.encryptedData.firstName}</Text>
            </View>
            <View style={styles.patientRow}>
              <Text style={styles.patientLabel}>{t('patientInfo.lastName')}:</Text>
              <Text style={styles.patientValue}>{patient.encryptedData.lastName}</Text>
            </View>
            {patient.encryptedData.birthDate && (
              <View style={styles.patientRow}>
                <Text style={styles.patientLabel}>{t('patientInfo.birthDate')}:</Text>
                <Text style={styles.patientValue}>{patient.encryptedData.birthDate}</Text>
              </View>
            )}
            {patient.encryptedData.gender && (
              <View style={styles.patientRow}>
                <Text style={styles.patientLabel}>{t('patientInfo.gender')}:</Text>
                <Text style={styles.patientValue}>{patient.encryptedData.gender}</Text>
              </View>
            )}
          </View>
        )}
        
        {/* Answers by Section */}
        {answerSummary.map((section, sectionIdx) => (
          <View key={sectionIdx} style={styles.answerSection}>
            <Text style={styles.sectionTitle}>{section.sectionTitle}</Text>
            {section.questions.map((q, qIdx) => (
              <View key={qIdx} style={styles.answerItem}>
                <Text style={styles.questionText}>{q.questionText}</Text>
                <Text style={styles.answerText}>→ {q.answer}</Text>
              </View>
            ))}
          </View>
        ))}
        
        {answerSummary.length === 0 && (
          <Text style={styles.noAnswersText}>
            {t('summary.noAnswers', { defaultValue: 'Keine Antworten vorhanden' })}
          </Text>
        )}
      </View>

      <Text style={styles.exportHint}>{t('summary.exportHint')}</Text>

      <AppButton
        variant="secondary"
        title={t('summary.calculatorsButton', { defaultValue: 'Rechner öffnen' })}
        onPress={() => navigation.navigate('Calculator')}
        testID="btn-calculator"
        style={styles.primaryButtonSpacing}
      />

      <AppButton
        variant="primary"
        title={t('summary.exportButton')}
        onPress={() => navigation.navigate('Export', { questionnaireId })}
        testID="btn-export"
        style={styles.primaryButtonSpacing}
      />

      <AppButton
        variant="secondary"
        title={t('summary.newButton')}
        onPress={() => {
          reset();
          navigation.popToTop();
        }}
        testID="btn-new"
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: 13,
    color: colors.textMuted,
    marginBottom: spacing.md,
  },
  progressCard: {
    marginBottom: spacing.lg,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  cardText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  answeredText: {
    fontSize: 14,
    color: colors.successText,
    fontWeight: '500',
  },
  // Output Box Styles
  outputBox: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  outputHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  outputTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  copyButton: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
  },
  copyButtonText: {
    fontSize: 14,
    color: colors.primaryDark,
    fontWeight: '500',
  },
  patientSection: {
    marginBottom: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    backgroundColor: colors.surfaceAlt,
    padding: spacing.sm,
    borderRadius: radius.sm,
  },
  patientRow: {
    flexDirection: 'row',
    marginBottom: spacing.xs,
  },
  patientLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    width: 120,
  },
  patientValue: {
    fontSize: 14,
    color: colors.textPrimary,
    fontWeight: '500',
    flex: 1,
  },
  answerSection: {
    marginBottom: spacing.md,
  },
  answerItem: {
    paddingVertical: spacing.sm,
    paddingLeft: spacing.sm,
    borderLeftWidth: 2,
    borderLeftColor: colors.primary,
    marginBottom: spacing.sm,
  },
  questionText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  answerText: {
    fontSize: 15,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  noAnswersText: {
    fontSize: 14,
    color: colors.textMuted,
    fontStyle: 'italic',
    textAlign: 'center',
    padding: spacing.lg,
  },
  exportHint: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  primaryButtonSpacing: {
    marginBottom: spacing.sm,
  },
});
