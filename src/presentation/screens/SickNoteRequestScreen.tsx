/**
 * SickNoteRequestScreen - AU-Bescheinigung (Sick Note) Request Form
 *
 * Collects sick note details:
 * - Start date (required)
 * - End date (optional, defaults to TBD)
 * - Reason (optional)
 * - Additional notes (optional)
 *
 * @security Data is encrypted before mailto generation.
 * @gdpr No PII logged. Data minimization applies.
 */

import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { StackScreenProps } from '@react-navigation/stack';
import { usePatientContext } from '../../application/PatientContext';
import { useTheme } from '../theme/ThemeContext';
import { AppText } from '../components/AppText';
import { AppInput } from '../components/AppInput';
import { AppButton } from '../components/AppButton';
import {
  DocumentType,
  DocumentRequestPriority,
  createDocumentRequest,
  type ISickNoteRequest,
  type SickNoteSubType,
} from '../../domain/entities/DocumentRequest';
import { colors, spacing, radius } from '../theme/tokens';
import { ScreenContainer } from '../components/ScreenContainer';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { useUnsavedChangesGuard } from '../hooks/useUnsavedChangesGuard';

type Props = StackScreenProps<RootStackParamList, 'SickNoteRequest'>;

export const SickNoteRequestScreen = ({ navigation }: Props): React.JSX.Element => {
  const { t } = useTranslation();
  const { skipFullAnamnesis, setPendingDocumentRequest } = usePatientContext();
  const { isHighContrast } = useTheme();

  const today = new Date();
  const [startDate, setStartDate] = useState(formatDate(today));
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [documentSubType, setDocumentSubType] = useState<SickNoteSubType>('standard');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isDirty = Boolean(reason || notes || endDate);
  useUnsavedChangesGuard(navigation, isDirty);

  function formatDate(date: Date): string {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
  }

  function parseDate(dateStr: string): Date | null {
    // Parse DD.MM.YYYY format
    const parts = dateStr.split('.');
    if (parts.length !== 3) return null;

    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const year = parseInt(parts[2], 10);

    if (isNaN(day) || isNaN(month) || isNaN(year)) return null;

    const date = new Date(year, month, day);
    if (isNaN(date.getTime())) return null;

    return date;
  }

  const handleSubmit = async (): Promise<void> => {
    const parsedStartDate = parseDate(startDate);

    if (!parsedStartDate) {
      Alert.alert(
        t('common.error', { defaultValue: 'Fehler' }),
        t('sickNote.errorStartDateRequired', {
          defaultValue: 'Bitte geben Sie ein gültiges Startdatum ein (TT.MM.JJJJ).',
        }),
      );
      return;
    }

    // Date range limits: start date max 30 days in past, max 14 days in future
    const maxPastDate = new Date(today);
    maxPastDate.setDate(maxPastDate.getDate() - 30);
    const maxFutureDate = new Date(today);
    maxFutureDate.setDate(maxFutureDate.getDate() + 14);

    if (parsedStartDate < maxPastDate) {
      Alert.alert(
        t('common.error', { defaultValue: 'Fehler' }),
        t('sickNote.errorStartDateTooOld', {
          defaultValue: 'Das Startdatum darf nicht mehr als 30 Tage in der Vergangenheit liegen.',
        }),
      );
      return;
    }

    if (parsedStartDate > maxFutureDate) {
      Alert.alert(
        t('common.error', { defaultValue: 'Fehler' }),
        t('sickNote.errorStartDateTooFar', {
          defaultValue: 'Das Startdatum darf nicht mehr als 14 Tage in der Zukunft liegen.',
        }),
      );
      return;
    }

    if (endDate) {
      const parsedEndDate = parseDate(endDate);
      if (!parsedEndDate) {
        Alert.alert(
          t('common.error', { defaultValue: 'Fehler' }),
          t('sickNote.errorEndDateInvalid', {
            defaultValue: 'Das Enddatum ist ungültig (TT.MM.JJJJ).',
          }),
        );
        return;
      }

      if (parsedEndDate < parsedStartDate) {
        Alert.alert(
          t('common.error', { defaultValue: 'Fehler' }),
          t('sickNote.errorEndBeforeStart', {
            defaultValue: 'Das Enddatum darf nicht vor dem Startdatum liegen.',
          }),
        );
        return;
      }

      // Max duration: 6 weeks (42 days)
      const maxDurationMs = 42 * 24 * 60 * 60 * 1000;
      if (parsedEndDate.getTime() - parsedStartDate.getTime() > maxDurationMs) {
        Alert.alert(
          t('common.error', { defaultValue: 'Fehler' }),
          t('sickNote.errorDurationTooLong', {
            defaultValue: 'Die Krankschreibung darf maximal 6 Wochen (42 Tage) betragen.',
          }),
        );
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const baseRequest = createDocumentRequest(
        DocumentType.AU_BESCHEINIGUNG,
        `AU-Bescheinigung ab ${startDate}`,
        DocumentRequestPriority.NORMAL,
      );

      const sickNoteRequest: ISickNoteRequest = {
        ...baseRequest,
        documentType: DocumentType.AU_BESCHEINIGUNG,
        auStartDate: startDate,
        auEndDate: endDate || undefined,
        auReason: reason.trim() || undefined,
        documentSubType,
        additionalNotes: notes.trim() || undefined,
      };

      if (skipFullAnamnesis) {
        navigation.navigate('RequestSummary', { request: sickNoteRequest });
      } else {
        // New patient: Store request in context and continue with anamnesis
        setPendingDocumentRequest(sickNoteRequest);
        navigation.navigate('PatientInfo');
      }
    } catch (error) {
      Alert.alert(
        t('common.error', { defaultValue: 'Fehler' }),
        t('sickNote.errorSubmit', { defaultValue: 'Anfrage konnte nicht erstellt werden.' }),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScreenContainer testID="sick-note-screen" accessibilityLabel="Sick Note Request">
    <KeyboardAvoidingView
      style={styles.keyboardView}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={[styles.container, isHighContrast && styles.containerHighContrast]}>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={styles.headerSection}>
            <AppText variant="h2" style={[styles.title, isHighContrast && styles.textHighContrast]}>
              {t('sickNote.title', { defaultValue: 'AU-Bescheinigung anfordern' })}
            </AppText>
            <AppText style={[styles.subtitle, isHighContrast && styles.textHighContrast]}>
              {t('sickNote.subtitle', {
                defaultValue: 'Bitte geben Sie den Zeitraum der Arbeitsunfähigkeit an.',
              })}
            </AppText>
          </View>

          <View style={styles.formSection}>
            {/* Document Sub-Type selector */}
            <View style={styles.inputGroup}>
              <AppText style={styles.label}>
                {t('sickNote.documentSubType', { defaultValue: 'Art des Dokuments' })}
              </AppText>
              <View style={styles.radioGroup}>
                <TouchableOpacity
                  style={[styles.radioButton, documentSubType === 'standard' && styles.radioButtonSelected]}
                  onPress={() => setDocumentSubType('standard')}
                  testID="radio-standard">
                  <View style={styles.radio}>
                    {documentSubType === 'standard' && <View style={styles.radioSelected} />}
                  </View>
                  <AppText style={styles.radioLabel}>
                    {t('sickNote.subTypeStandard', { defaultValue: 'AU-Bescheinigung' })}
                  </AppText>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.radioButton, documentSubType === 'attest' && styles.radioButtonSelected]}
                  onPress={() => setDocumentSubType('attest')}
                  testID="radio-attest">
                  <View style={styles.radio}>
                    {documentSubType === 'attest' && <View style={styles.radioSelected} />}
                  </View>
                  <AppText style={styles.radioLabel}>
                    {t('sickNote.subTypeAttest', { defaultValue: 'Attest' })}
                  </AppText>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.radioButton, documentSubType === 'befundbericht' && styles.radioButtonSelected]}
                  onPress={() => setDocumentSubType('befundbericht')}
                  testID="radio-befundbericht">
                  <View style={styles.radio}>
                    {documentSubType === 'befundbericht' && <View style={styles.radioSelected} />}
                  </View>
                  <AppText style={styles.radioLabel}>
                    {t('sickNote.subTypeBefund', { defaultValue: 'Befundbericht' })}
                  </AppText>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.dateRow}>
              <View style={styles.dateInput}>
                <AppInput
                  label={t('sickNote.startDate', { defaultValue: 'Beginn' })}
                  required
                  value={startDate}
                  onChangeText={setStartDate}
                  placeholder={t('common.datePlaceholder', { defaultValue: 'TT.MM.JJJJ' })}
                  keyboardType="numeric"
                  testID="input-start-date"
                />
              </View>

              <View style={styles.dateInput}>
                <AppInput
                  label={t('sickNote.endDate', { defaultValue: 'Ende (optional)' })}
                  value={endDate}
                  onChangeText={setEndDate}
                  placeholder={t('common.datePlaceholder', { defaultValue: 'TT.MM.JJJJ' })}
                  keyboardType="numeric"
                  testID="input-end-date"
                />
              </View>
            </View>

            <AppInput
              label={t('sickNote.reason', { defaultValue: 'Grund (optional)' })}
              value={reason}
              onChangeText={setReason}
              placeholder={t('sickNote.reasonPlaceholder', {
                defaultValue: 'z.B. Erkältung, Rückenschmerzen',
              })}
              testID="input-reason"
            />

            <AppInput
              label={t('sickNote.notes', { defaultValue: 'Anmerkungen (optional)' })}
              value={notes}
              onChangeText={setNotes}
              placeholder={t('sickNote.notesPlaceholder', {
                defaultValue: 'Weitere Informationen...',
              })}
              multiline
              numberOfLines={3}
              testID="input-notes"
            />
          </View>

          <View style={styles.infoBox}>
            <AppText style={styles.infoText}>
              {t('sickNote.infoText', {
                defaultValue:
                  'Die AU-Bescheinigung wird nach ärztlicher Prüfung ausgestellt. Bei längerer Krankheit ist ein Arztbesuch erforderlich.',
              })}
            </AppText>
          </View>

          <View style={styles.warningBox}>
            <AppText style={styles.warningTitle}>
              {t('sickNote.warningTitle', { defaultValue: '⚠️ Wichtiger Hinweis' })}
            </AppText>
            <AppText style={styles.warningText}>
              {t('sickNote.warningText', {
                defaultValue:
                  'Eine Arbeitsunfähigkeitsbescheinigung kann nur nach Rücksprache mit einem Arzt ausgestellt werden. Diese Anfrage dient der Terminvereinbarung.',
              })}
            </AppText>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <AppButton
            title={
              skipFullAnamnesis
                ? t('sickNote.submit', { defaultValue: 'Anfrage absenden' })
                : t('sickNote.continue', { defaultValue: 'Weiter zur Anamnese' })
            }
            onPress={handleSubmit}
            disabled={isSubmitting || !startDate}
            testID="btn-submit-sicknote"
          />
        </View>
      </View>
    </KeyboardAvoidingView>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  containerHighContrast: {
    backgroundColor: '#000000',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  headerSection: {
    marginBottom: spacing.xl,
  },
  title: {
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textMuted,
  },
  textHighContrast: {
    color: '#ffffff',
  },
  formSection: {
    gap: spacing.lg,
  },
  radioGroup: {
    flexDirection: 'row',
    gap: spacing.md,
    flexWrap: 'wrap',
  },
  radioButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    minWidth: 120,
  },
  radioButtonSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.infoSurface || '#E3F2FD',
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  radioSelected: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  radioLabel: {
    color: colors.text,
  },
  dateRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  inputGroup: {
    gap: spacing.xs,
  },
  dateInput: {
    flex: 1,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  infoBox: {
    backgroundColor: colors.infoSurface || '#E3F2FD',
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.xl,
  },
  infoText: {
    fontSize: 14,
    color: colors.textMuted,
    lineHeight: 20,
  },
  warningBox: {
    backgroundColor: '#FFF3E0',
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  warningTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#E65100',
    marginBottom: spacing.xs,
  },
  warningText: {
    fontSize: 14,
    color: '#BF360C',
    lineHeight: 20,
  },
  footer: {
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },
});
