/**
 * PrescriptionRequestScreen - Rezept (Prescription) Request Form
 *
 * Collects medication details:
 * - Medication name (required)
 * - Dosage (optional)
 * - Quantity (optional)
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
  type IPrescriptionRequest,
  type PrescriptionType,
} from '../../domain/entities/DocumentRequest';
import { colors, spacing, radius } from '../theme/tokens';
import { ScreenContainer } from '../components/ScreenContainer';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { useUnsavedChangesGuard } from '../hooks/useUnsavedChangesGuard';

type Props = StackScreenProps<RootStackParamList, 'PrescriptionRequest'>;

export const PrescriptionRequestScreen = ({ navigation }: Props): React.JSX.Element => {
  const { t } = useTranslation();
  const { skipFullAnamnesis, setPendingDocumentRequest } = usePatientContext();
  const { isHighContrast } = useTheme();

  const [medicationName, setMedicationName] = useState('');
  const [dosage, setDosage] = useState('');
  const [quantity, setQuantity] = useState('');
  const [notes, setNotes] = useState('');
  const [prescriptionType, setPrescriptionType] = useState<PrescriptionType>('follow_up');
  const [isUrgent, setIsUrgent] = useState(false);
  const [packageSize, setPackageSize] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isDirty = Boolean(medicationName || dosage || quantity || notes || packageSize);
  useUnsavedChangesGuard(navigation, isDirty);

  const handleSubmit = async (): Promise<void> => {
    if (!medicationName.trim()) {
      Alert.alert(
        t('common.error', { defaultValue: 'Fehler' }),
        t('prescription.errorMedicationRequired', {
          defaultValue: 'Bitte geben Sie den Medikamentennamen ein.',
        }),
      );
      return;
    }

    setIsSubmitting(true);

    try {
      // Create the prescription request object
      const baseRequest = createDocumentRequest(
        DocumentType.REZEPT,
        `Rezept: ${medicationName}`,
        DocumentRequestPriority.NORMAL,
      );

      const prescriptionRequest: IPrescriptionRequest = {
        ...baseRequest,
        documentType: DocumentType.REZEPT,
        medicationName: medicationName.trim(),
        medicationDosage: dosage.trim() || undefined,
        medicationQuantity: quantity ? (Number.isNaN(parseInt(quantity, 10)) ? undefined : parseInt(quantity, 10)) : undefined,
        prescriptionType,
        isUrgent,
        packageSize: packageSize.trim() || undefined,
        additionalNotes: notes.trim() || undefined,
        priority: isUrgent ? DocumentRequestPriority.URGENT : DocumentRequestPriority.NORMAL,
      };

      // If returning patient, go to mailto/summary
      // If new patient, continue to anamnesis
      if (skipFullAnamnesis) {
        // Returning patient: go directly to summary
        navigation.navigate('RequestSummary', { request: prescriptionRequest });
      } else {
        // New patient: Store request in context and continue with anamnesis
        setPendingDocumentRequest(prescriptionRequest);
        navigation.navigate('PatientInfo');
      }
    } catch (error) {
      Alert.alert(
        t('common.error', { defaultValue: 'Fehler' }),
        t('prescription.errorSubmit', { defaultValue: 'Anfrage konnte nicht erstellt werden.' }),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScreenContainer testID="prescription-request-screen" accessibilityLabel="Prescription Request">
    <KeyboardAvoidingView
      style={styles.keyboardView}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={[styles.container, isHighContrast && styles.containerHighContrast]}>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={styles.headerSection}>
            <AppText variant="h2" style={[styles.title, isHighContrast && styles.textHighContrast]}>
              {t('prescription.title', { defaultValue: 'Rezept anfordern' })}
            </AppText>
            <AppText style={[styles.subtitle, isHighContrast && styles.textHighContrast]}>
              {t('prescription.subtitle', {
                defaultValue: 'Bitte geben Sie die Medikamenteninformationen ein.',
              })}
            </AppText>
          </View>

          <View style={styles.formSection}>
            {/* Prescription Type: Folgerezept vs Neuverordnung */}
            <View style={styles.inputGroup}>
              <AppText style={styles.label}>
                {t('prescription.prescriptionType', { defaultValue: 'Rezeptart' })}
              </AppText>
              <View style={styles.radioGroup}>
                <TouchableOpacity
                  style={[styles.radioButton, prescriptionType === 'follow_up' && styles.radioButtonSelected]}
                  onPress={() => setPrescriptionType('follow_up')}
                  testID="radio-follow-up">
                  <View style={styles.radio}>
                    {prescriptionType === 'follow_up' && <View style={styles.radioSelected} />}
                  </View>
                  <AppText style={styles.radioLabel}>
                    {t('prescription.followUp', { defaultValue: 'Folgerezept' })}
                  </AppText>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.radioButton, prescriptionType === 'new' && styles.radioButtonSelected]}
                  onPress={() => setPrescriptionType('new')}
                  testID="radio-new-prescription">
                  <View style={styles.radio}>
                    {prescriptionType === 'new' && <View style={styles.radioSelected} />}
                  </View>
                  <AppText style={styles.radioLabel}>
                    {t('prescription.newPrescription', { defaultValue: 'Neuverordnung' })}
                  </AppText>
                </TouchableOpacity>
              </View>
            </View>

            <AppInput
              label={t('prescription.medicationName', { defaultValue: 'Medikament' })}
              required
              value={medicationName}
              onChangeText={setMedicationName}
              placeholder={t('prescription.medicationPlaceholder', {
                defaultValue: 'z.B. Ibuprofen 400mg',
              })}
              testID="input-medication-name"
            />

            <View style={styles.inputGroup}>
              <AppInput
                label={t('prescription.dosage', { defaultValue: 'Dosierung (optional)' })}
                value={dosage}
                onChangeText={setDosage}
                placeholder={t('prescription.dosagePlaceholder', {
                  defaultValue: 'z.B. 1-0-1 oder 3x täglich',
                })}
                testID="input-dosage"
              />
              <AppText style={styles.hintText}>
                {t('prescription.dosageHint', {
                  defaultValue: 'Format: Morgens-Mittags-Abends (z.B. 1-0-1)',
                })}
              </AppText>
            </View>

            <AppInput
              label={t('prescription.quantity', { defaultValue: 'Menge (optional)' })}
              value={quantity}
              onChangeText={setQuantity}
              placeholder={t('prescription.quantityPlaceholder', {
                defaultValue: 'z.B. 2 Packungen',
              })}
              keyboardType="numeric"
              testID="input-quantity"
            />

            <AppInput
              label={t('prescription.packageSize', { defaultValue: 'Packungsgröße (optional)' })}
              value={packageSize}
              onChangeText={setPackageSize}
              placeholder={t('prescription.packageSizePlaceholder', {
                defaultValue: 'z.B. N1, N2, N3',
              })}
              testID="input-package-size"
            />

            {/* Urgency Checkbox */}
            <TouchableOpacity
              style={styles.checkboxRow}
              onPress={() => setIsUrgent(!isUrgent)}
              testID="checkbox-urgent">
              <View style={[styles.checkbox, isUrgent && styles.checkboxChecked]} />
              <AppText style={styles.checkboxLabel}>
                {t('prescription.urgentLabel', { defaultValue: '⚡ Eilt (dringend benötigt)' })}
              </AppText>
            </TouchableOpacity>

            <AppInput
              label={t('prescription.notes', { defaultValue: 'Anmerkungen (optional)' })}
              value={notes}
              onChangeText={setNotes}
              placeholder={t('prescription.notesPlaceholder', {
                defaultValue: 'Weitere Informationen...',
              })}
              multiline
              numberOfLines={3}
              testID="input-notes"
            />
          </View>

          <View style={styles.infoBox}>
            <AppText style={styles.infoText}>
              {t('prescription.infoText', {
                defaultValue:
                  'Ihre Anfrage wird verschlüsselt an die Praxis übermittelt. Sie erhalten eine Benachrichtigung, sobald das Rezept abholbereit ist.',
              })}
            </AppText>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <AppButton
            title={
              skipFullAnamnesis
                ? t('prescription.submit', { defaultValue: 'Anfrage absenden' })
                : t('prescription.continue', { defaultValue: 'Weiter zur Anamnese' })
            }
            onPress={handleSubmit}
            disabled={isSubmitting || !medicationName.trim()}
            testID="btn-submit-prescription"
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
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  hintText: {
    fontSize: 12,
    color: colors.textMuted,
    fontStyle: 'italic',
    marginTop: 2,
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
    minWidth: 130,
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
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: colors.primary,
    borderRadius: 4,
    marginRight: spacing.md,
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
  },
  checkboxLabel: {
    color: colors.text,
    fontSize: 15,
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
