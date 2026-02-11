/**
 * SummaryScreen - comprehensive summary + output box + export
 * ISO/WCAG: Token-based design system
 */

import React, { useMemo } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Platform, Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { StackScreenProps } from '@react-navigation/stack';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { useQuestionnaireStore, selectProgress } from '../state/useQuestionnaireStore';
import { usePatientContext } from '../../application/PatientContext';
import { DocumentType } from '../../domain/entities/DocumentRequest';
import { colors, spacing, radius } from '../theme/tokens';
import { Card } from '../components/Card';
import { AppButton } from '../components/AppButton';
import { AppText } from '../components/AppText';
import { ScreenContainer } from '../components/ScreenContainer';
import { DeleteAllDataUseCase } from '@application/use-cases/DeleteAllDataUseCase';

type Props = StackScreenProps<RootStackParamList, 'Summary'>;

export const SummaryScreen = ({ navigation, route }: Props): React.JSX.Element => {
  const { t } = useTranslation();
  const { questionnaireId } = route.params;
  const { reset, questionnaire, answers, patient } = useQuestionnaireStore();
  const { pendingDocumentRequest } = usePatientContext();
  const progress = selectProgress(useQuestionnaireStore.getState());
  const safeProgress = Number.isFinite(progress) ? progress : 0;

  // Get label for pending document request type
  const getPendingRequestLabel = (): string => {
    if (!pendingDocumentRequest) return '';
    switch (pendingDocumentRequest.documentType) {
      case DocumentType.REZEPT:
        return t('documentRequest.prescription', { defaultValue: 'Rezept' });
      case DocumentType.UEBERWEISUNG:
        return t('documentRequest.referral', { defaultValue: 'Überweisung' });
      case DocumentType.AU_BESCHEINIGUNG:
        return t('documentRequest.sickNote', { defaultValue: 'Krankschreibung' });
      default:
        return t('documentRequest.title', { defaultValue: 'Anfrage' });
    }
  };

  // Handle continuing to RequestSummary with pending request
  const handleContinueToRequest = (): void => {
    if (pendingDocumentRequest) {
      navigation.navigate('RequestSummary', { request: pendingDocumentRequest });
    }
  };

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

    questionnaire.sections.forEach(section => {
      const sectionQuestions: (typeof summary)[0]['questions'] = [];

      section.questions.forEach(question => {
        const answerValue = answers.get(question.id);
        if (answerValue !== undefined && answerValue !== null && answerValue !== '') {
          let displayAnswer = '';

          if (typeof answerValue === 'boolean') {
            displayAnswer = answerValue
              ? t('common.yes', { defaultValue: 'Ja' })
              : t('common.no', { defaultValue: 'Nein' });
          } else if (Array.isArray(answerValue)) {
            displayAnswer = answerValue.join(', ');
          } else {
            displayAnswer = String(answerValue);
          }

          sectionQuestions.push({
            questionText: question.labelKey
              ? t(question.labelKey!, { defaultValue: question.text ?? question.labelKey ?? '' })
              : (question.text ?? ''),
            answer: displayAnswer,
            questionId: question.id,
          });
        }
      });

      if (sectionQuestions.length > 0) {
        summary.push({
          sectionTitle: section.titleKey
            ? t(section.titleKey!, { defaultValue: section.title ?? section.titleKey ?? '' })
            : (section.title ?? ''),
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

      // Address
      if (pd.address) {
        text += `${pd.address.street} ${pd.address.houseNumber}\n`;
        text += `${pd.address.zip} ${pd.address.city}, ${pd.address.country}\n`;
      }
      if (pd.phone) text += `Tel: ${pd.phone}\n`;
      if (pd.email) text += `Email: ${pd.email}\n`;
      text += '\n---\n\n';
    }

    // Answers by section
    answerSummary.forEach(section => {
      const titleLength = Math.max(0, section.sectionTitle?.length ?? 0);
      text += `${section.sectionTitle}\n${'='.repeat(titleLength)}\n\n`;
      section.questions.forEach(q => {
        text += `${q.questionText}\n→ ${q.answer}\n\n`;
      });
    });

    return text;
  }, [answerSummary, patient, t]);

  const handleCopyToClipboard = async (): Promise<void> => {
    try {
      const runtimeNavigator = (
        globalThis as {
          navigator?: { clipboard?: { writeText?: (text: string) => Promise<void> } };
        }
      ).navigator;
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

  const answeredCount = answerSummary.reduce((acc, section) => acc + section.questions.length, 0);
  const safeAnsweredCount = Number.isFinite(answeredCount) ? answeredCount : 0;

  if (!questionnaire) {
    return (
      <ScreenContainer testID="summary-screen" accessibilityLabel="Summary">
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        testID="summary-screen"
        accessibilityRole="scrollbar"
        accessibilityLabel={t('summary.title')}>
        <AppText style={styles.title} accessibilityRole="header">
          {t('summary.title')}
        </AppText>
        <AppText style={styles.noAnswersText}>
          {t('summary.noAnswers', { defaultValue: 'Keine Antworten vorhanden' })}
        </AppText>
        <AppButton
          variant="secondary"
          title={t('common.continue', { defaultValue: 'Continue' })}
          onPress={() => navigation.goBack()}
        />
      </ScrollView>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer testID="summary-screen" accessibilityLabel="Summary">
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      testID="summary-screen"
      accessibilityRole="scrollbar"
      accessibilityLabel={t('summary.title')}>
      <AppText style={styles.title} accessibilityRole="header">
        {t('summary.title')}
      </AppText>
      <AppText style={styles.subtitle}>{t('summary.subtitle', { id: questionnaireId })}</AppText>

      {/* Progress Card */}
      <Card style={styles.progressCard}>
        <AppText style={styles.cardTitle} accessibilityRole="header">
          {t('summary.statusTitle')}
        </AppText>
        <AppText style={styles.cardText}>
          {t('summary.progress', { percent: Math.round(safeProgress) })}
        </AppText>
        <AppText style={styles.answeredText}>
          {t('summary.answeredQuestions', {
            count: safeAnsweredCount,
            defaultValue: '{{count}} Fragen beantwortet',
          })}
        </AppText>
      </Card>

      {/* Pending Document Request Card - shown when patient came from document request flow */}
      {pendingDocumentRequest && (
        <Card style={styles.pendingRequestCard}>
          <AppText style={styles.pendingRequestTitle} accessibilityRole="header">
            📋 {t('summary.pendingRequest', { defaultValue: 'Ihre Anfrage' })}
          </AppText>
          <AppText style={styles.pendingRequestText}>
            {t('summary.pendingRequestInfo', {
              type: getPendingRequestLabel(),
              defaultValue: 'Sie haben eine {{type}}-Anfrage gestartet. Jetzt können Sie diese mit Ihren Anamnese-Daten absenden.',
            })}
          </AppText>
          <AppButton
            variant="primary"
            title={t('summary.continueToRequest', {
              type: getPendingRequestLabel(),
              defaultValue: '{{type}} jetzt absenden',
            })}
            onPress={handleContinueToRequest}
            testID="btn-continue-request"
            style={styles.pendingRequestButton}
          />
        </Card>
      )}

      {/* Output Box - Answer Summary */}
      <View style={styles.outputBox}>
        <View style={styles.outputHeader}>
          <AppText style={styles.outputTitle}>
            {t('summary.outputBoxTitle', { defaultValue: 'Ihre Antworten' })}
          </AppText>
          <TouchableOpacity
            style={styles.copyButton}
            onPress={handleCopyToClipboard}
            testID="btn-copy-summary"
            accessibilityRole="button">
            <AppText style={styles.copyButtonText}>
              {t('summary.copyButton', { defaultValue: '📋 Kopieren' })}
            </AppText>
          </TouchableOpacity>
        </View>

        {/* Patient Info Section */}
        {patient && (
          <View style={styles.patientSection}>
            <AppText style={styles.sectionTitle}>
              {t('summary.patientData', { defaultValue: 'Patientendaten' })}
            </AppText>
            <View style={styles.patientRow}>
              <AppText style={styles.patientLabel}>{t('patientInfo.firstName')}:</AppText>
              <AppText style={styles.patientValue}>{patient.encryptedData.firstName}</AppText>
            </View>
            <View style={styles.patientRow}>
              <AppText style={styles.patientLabel}>{t('patientInfo.lastName')}:</AppText>
              <AppText style={styles.patientValue}>{patient.encryptedData.lastName}</AppText>
            </View>
            {patient.encryptedData.birthDate && (
              <View style={styles.patientRow}>
                <AppText style={styles.patientLabel}>{t('patientInfo.birthDate')}:</AppText>
                <AppText style={styles.patientValue}>{patient.encryptedData.birthDate}</AppText>
              </View>
            )}
            {patient.encryptedData.gender && (
              <View style={styles.patientRow}>
                <AppText style={styles.patientLabel}>{t('patientInfo.gender')}:</AppText>
                <AppText style={styles.patientValue}>{patient.encryptedData.gender}</AppText>
              </View>
            )}
            {patient.encryptedData.address && (
              <>
                <View style={styles.patientRow}>
                  <AppText style={styles.patientLabel}>{t('patientInfo.address')}:</AppText>
                  <AppText style={styles.patientValue}>
                    {patient.encryptedData.address.street} {patient.encryptedData.address.houseNumber}{'\n'}
                    {patient.encryptedData.address.zip} {patient.encryptedData.address.city} ({patient.encryptedData.address.country})
                  </AppText>
                </View>
              </>
            )}
            {patient.encryptedData.phone && (
              <View style={styles.patientRow}>
                <AppText style={styles.patientLabel}>{t('patientInfo.phone')}:</AppText>
                <AppText style={styles.patientValue}>{patient.encryptedData.phone}</AppText>
              </View>
            )}
            {patient.encryptedData.email && (
              <View style={styles.patientRow}>
                <AppText style={styles.patientLabel}>{t('patientInfo.email')}:</AppText>
                <AppText style={styles.patientValue}>{patient.encryptedData.email}</AppText>
              </View>
            )}
          </View>
        )}

        {/* Answers by Section */}
        {answerSummary.map((section, sectionIdx) => (
          <View key={sectionIdx} style={styles.answerSection}>
            <AppText style={styles.sectionTitle}>{section.sectionTitle}</AppText>
            {section.questions.map((q, qIdx) => (
              <View key={qIdx} style={styles.answerItem}>
                <AppText style={styles.questionText}>{q.questionText}</AppText>
                <AppText style={styles.answerText}>→ {q.answer}</AppText>
              </View>
            ))}
          </View>
        ))}

        {answerSummary.length === 0 && (
          <AppText style={styles.noAnswersText}>
            {t('summary.noAnswers', { defaultValue: 'Keine Antworten vorhanden' })}
          </AppText>
        )}
      </View>

      <AppText style={styles.exportHint}>{t('summary.exportHint')}</AppText>

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

      {/* NUCLEAR OPTION */}
      <TouchableOpacity
        style={styles.nuclearButton}
        onPress={() => {
          Alert.alert(
            t('common.warning', { defaultValue: 'WARNUNG' }),
            t('summary.nuclearWarning', { defaultValue: 'Möchten Sie wirklich ALLE Daten unwiderruflich löschen? Dies kann nicht rückgängig gemacht werden.' }),
            [
              { text: t('common.cancel'), style: 'cancel' },
              {
                text: t('common.delete', { defaultValue: 'Löschen' }),
                style: 'destructive',
                onPress: async () => {
                  try {
                    // GDPR Art. 17: Delete ALL persistent data (SQLite + AsyncStorage)
                    await new DeleteAllDataUseCase().execute();
                  } catch {
                    // Best-effort: even if DB deletion fails, clear in-memory state
                  }
                  reset();
                  navigation.popToTop();
                }
              }
            ]
          );
        }}
      >
        <AppText style={styles.nuclearButtonText}>⚠️ {t('summary.nuclearOption', { defaultValue: 'Daten vollständig vernichten (Nuclear Option)' })}</AppText>
      </TouchableOpacity>
    </ScrollView>
    </ScreenContainer>
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
    color: colors.text,
    marginBottom: spacing.sm,
  },
  subtitle: {
    color: colors.textMuted,
    marginBottom: spacing.md,
  },
  progressCard: {
    marginBottom: spacing.lg,
  },
  pendingRequestCard: {
    marginBottom: spacing.lg,
    backgroundColor: colors.warningSurface ?? '#FFF3E0',
    borderColor: colors.warning ?? '#FF9800',
    borderWidth: 2,
  },
  pendingRequestTitle: {
    fontWeight: '700',
    fontSize: 18,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  pendingRequestText: {
    color: colors.textSecondary,
    marginBottom: spacing.md,
    lineHeight: 22,
  },
  pendingRequestButton: {
    marginTop: spacing.sm,
  },
  cardTitle: {
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  cardText: {
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  answeredText: {
    color: colors.successText,
    fontWeight: '500',
  },
  // High Contrast
  textHighContrast: { color: '#ffffff' },
  textHighContrastInverse: { color: '#000000' },
  bgHighContrast: { backgroundColor: '#000000' },
  surfaceHighContrast: { backgroundColor: '#ffffff' },
  borderHighContrast: { borderColor: '#000000' },

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
    color: colors.textSecondary,
    width: 120,
  },
  patientValue: {
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
  nuclearButton: {
    marginTop: spacing.xl,
    backgroundColor: '#fee2e2',
    borderWidth: 2,
    borderColor: '#ef4444',
    padding: spacing.md,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  nuclearButtonText: {
    color: '#b91c1c',
    fontWeight: 'bold',
    fontSize: 14,
  }
});
