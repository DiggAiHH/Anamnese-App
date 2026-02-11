/**
 * ReferralRequestScreen - Überweisung (Referral) Request Form
 *
 * Collects referral details:
 * - Specialty (required)
 * - Reason (optional)
 * - Preferred doctor (optional)
 * - Additional notes (optional)
 *
 * @security Data is encrypted before mailto generation.
 * @gdpr No PII logged. Data minimization applies.
 */

import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import type { StackScreenProps } from '@react-navigation/stack';
import { usePatientContext } from '../../application/PatientContext';
import { useTheme } from '../theme/ThemeContext';
import { AppText } from '../components/AppText';
import { AppInput } from '../components/AppInput';
import { AppButton } from '../components/AppButton';
import { ScreenContainer } from '../components/ScreenContainer';
import {
  DocumentType,
  DocumentRequestPriority,
  createDocumentRequest,
  type IReferralRequest,
} from '../../domain/entities/DocumentRequest';
import { colors, spacing, radius } from '../theme/tokens';
import type { RootStackParamList } from '../navigation/RootNavigator';

type Props = StackScreenProps<RootStackParamList, 'ReferralRequest'>;

const SPECIALTIES = [
  { key: 'kardiologie', label: 'Kardiologie' },
  { key: 'orthopaedie', label: 'Orthopädie' },
  { key: 'neurologie', label: 'Neurologie' },
  { key: 'dermatologie', label: 'Dermatologie' },
  { key: 'augenheilkunde', label: 'Augenheilkunde' },
  { key: 'hno', label: 'HNO (Hals-Nasen-Ohren)' },
  { key: 'urologie', label: 'Urologie' },
  { key: 'gynaekologie', label: 'Gynäkologie' },
  { key: 'gastroenterologie', label: 'Gastroenterologie' },
  { key: 'pneumologie', label: 'Pneumologie' },
  { key: 'psychiatrie', label: 'Psychiatrie' },
  { key: 'radiologie', label: 'Radiologie' },
  { key: 'physiotherapie', label: 'Physiotherapie' },
  { key: 'sonstige', label: 'Sonstige' },
];

export const ReferralRequestScreen = ({ navigation }: Props): React.JSX.Element => {
  const { t } = useTranslation();
  const { skipFullAnamnesis, setPendingDocumentRequest } = usePatientContext();
  const { isHighContrast } = useTheme();

  const [selectedSpecialty, setSelectedSpecialty] = useState<string | null>(null);
  const [reason, setReason] = useState('');
  const [preferredDoctor, setPreferredDoctor] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSpecialtyPicker, setShowSpecialtyPicker] = useState(false);

  const handleSubmit = async (): Promise<void> => {
    if (!selectedSpecialty) {
      Alert.alert(
        t('common.error', { defaultValue: 'Fehler' }),
        t('referral.errorSpecialtyRequired', {
          defaultValue: 'Bitte wählen Sie eine Fachrichtung aus.',
        }),
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const specialtyLabel =
        SPECIALTIES.find(s => s.key === selectedSpecialty)?.label || selectedSpecialty;

      const baseRequest = createDocumentRequest(
        DocumentType.UEBERWEISUNG,
        `Überweisung: ${specialtyLabel}`,
        DocumentRequestPriority.NORMAL,
      );

      const referralRequest: IReferralRequest = {
        ...baseRequest,
        documentType: DocumentType.UEBERWEISUNG,
        referralSpecialty: specialtyLabel,
        referralReason: reason.trim() || undefined,
        preferredDoctor: preferredDoctor.trim() || undefined,
        additionalNotes: notes.trim() || undefined,
      };

      if (skipFullAnamnesis) {
        navigation.navigate('RequestSummary', { request: referralRequest });
      } else {
        // New patient: Store request in context and continue with anamnesis
        setPendingDocumentRequest(referralRequest);
        navigation.navigate('PatientInfo');
      }
    } catch (error) {
      Alert.alert(
        t('common.error', { defaultValue: 'Fehler' }),
        t('referral.errorSubmit', { defaultValue: 'Anfrage konnte nicht erstellt werden.' }),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderSpecialtyPicker = (): React.JSX.Element | null => {
    if (!showSpecialtyPicker) return null;

    return (
      <View style={[styles.pickerOverlay, isHighContrast && styles.pickerOverlayHighContrast]}>
        <ScrollView style={styles.pickerScroll}>
          {SPECIALTIES.map(specialty => (
            <TouchableOpacity
              key={specialty.key}
              style={[
                styles.pickerItem,
                selectedSpecialty === specialty.key && styles.pickerItemSelected,
                isHighContrast && styles.pickerItemHighContrast,
              ]}
              onPress={() => {
                setSelectedSpecialty(specialty.key);
                setShowSpecialtyPicker(false);
              }}
              accessibilityRole="button"
              accessibilityLabel={specialty.label}>
              <AppText
                style={[
                  styles.pickerItemText,
                  selectedSpecialty === specialty.key && styles.pickerItemTextSelected,
                  isHighContrast && styles.textHighContrast,
                ]}>
                {specialty.label}
              </AppText>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };

  const selectedSpecialtyLabel = selectedSpecialty
    ? SPECIALTIES.find(s => s.key === selectedSpecialty)?.label
    : null;

  return (
    <ScreenContainer testID="referral-request-screen" accessibilityLabel="Referral Request">
    <KeyboardAvoidingView
      style={styles.keyboardView}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={[styles.container, isHighContrast && styles.containerHighContrast]}>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={styles.headerSection}>
            <AppText variant="h2" style={[styles.title, isHighContrast && styles.textHighContrast]}>
              {t('referral.title', { defaultValue: 'Überweisung anfordern' })}
            </AppText>
            <AppText style={[styles.subtitle, isHighContrast && styles.textHighContrast]}>
              {t('referral.subtitle', {
                defaultValue: 'Bitte wählen Sie die gewünschte Fachrichtung.',
              })}
            </AppText>
          </View>

          <View style={styles.formSection}>
            <View style={styles.inputGroup}>
              <AppText style={[styles.label, isHighContrast && styles.textHighContrast]}>
                {t('referral.specialty', { defaultValue: 'Fachrichtung' })} *
              </AppText>
              <TouchableOpacity
                style={[styles.selectButton, isHighContrast && styles.selectButtonHighContrast]}
                onPress={() => setShowSpecialtyPicker(!showSpecialtyPicker)}
                accessibilityRole="button"
                accessibilityLabel={t('referral.selectSpecialty', {
                  defaultValue: 'Fachrichtung auswählen',
                })}
                testID="btn-select-specialty">
                <AppText
                  style={[
                    styles.selectButtonText,
                    !selectedSpecialtyLabel && styles.selectButtonPlaceholder,
                    isHighContrast && styles.textHighContrast,
                  ]}>
                  {selectedSpecialtyLabel ||
                    t('referral.selectSpecialtyPlaceholder', {
                      defaultValue: 'Fachrichtung auswählen...',
                    })}
                </AppText>
              </TouchableOpacity>
              {renderSpecialtyPicker()}
            </View>

            <AppInput
              label={t('referral.reason', { defaultValue: 'Grund der Überweisung (optional)' })}
              value={reason}
              onChangeText={setReason}
              placeholder={t('referral.reasonPlaceholder', {
                defaultValue: 'z.B. Rückenschmerzen seit 2 Wochen',
              })}
              multiline
              numberOfLines={2}
              testID="input-reason"
            />

            <AppInput
              label={t('referral.preferredDoctor', { defaultValue: 'Wunscharzt (optional)' })}
              value={preferredDoctor}
              onChangeText={setPreferredDoctor}
              placeholder={t('referral.preferredDoctorPlaceholder', {
                defaultValue: 'z.B. Dr. Müller, Kardiologie Berlin',
              })}
              testID="input-preferred-doctor"
            />

            <AppInput
              label={t('referral.notes', { defaultValue: 'Anmerkungen (optional)' })}
              value={notes}
              onChangeText={setNotes}
              placeholder={t('referral.notesPlaceholder', {
                defaultValue: 'Weitere Informationen...',
              })}
              multiline
              numberOfLines={3}
              testID="input-notes"
            />
          </View>

          <View style={styles.infoBox}>
            <AppText style={styles.infoText}>
              {t('referral.infoText', {
                defaultValue:
                  'Die Überweisung wird nach Prüfung erstellt. Sie können sie in der Praxis abholen oder wir senden sie Ihnen digital zu.',
              })}
            </AppText>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <AppButton
            title={
              skipFullAnamnesis
                ? t('referral.submit', { defaultValue: 'Anfrage absenden' })
                : t('referral.continue', { defaultValue: 'Weiter zur Anamnese' })
            }
            onPress={handleSubmit}
            disabled={isSubmitting || !selectedSpecialty}
            testID="btn-submit-referral"
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
  inputGroup: {
    gap: spacing.xs,
    zIndex: 1,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  selectButton: {
    backgroundColor: colors.surface || '#F5F5F5',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  selectButtonHighContrast: {
    backgroundColor: '#1a1a1a',
    borderColor: '#ffffff',
  },
  selectButtonText: {
    fontSize: 16,
    color: colors.text,
  },
  selectButtonPlaceholder: {
    color: colors.textMuted,
  },
  pickerOverlay: {
    backgroundColor: colors.background,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: spacing.xs,
    maxHeight: 200,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    zIndex: 1000,
  },
  pickerOverlayHighContrast: {
    backgroundColor: '#1a1a1a',
    borderColor: '#ffffff',
  },
  pickerScroll: {
    flex: 1,
  },
  pickerItem: {
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  pickerItemHighContrast: {
    borderBottomColor: '#333333',
  },
  pickerItemSelected: {
    backgroundColor: colors.primary + '20',
  },
  pickerItemText: {
    fontSize: 16,
    color: colors.text,
  },
  pickerItemTextSelected: {
    fontWeight: '600',
    color: colors.primary,
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
  footer: {
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },
});
