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
import { View, StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
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
} from '../../domain/entities/DocumentRequest';
import { colors, spacing, radius } from '../theme/tokens';
import type { RootStackParamList } from '../navigation/RootNavigator';

type Props = StackScreenProps<RootStackParamList, 'PrescriptionRequest'>;

export const PrescriptionRequestScreen = ({ navigation }: Props): React.JSX.Element => {
  const { t } = useTranslation();
  const { skipFullAnamnesis } = usePatientContext();
  const { isHighContrast } = useTheme();

  const [medicationName, setMedicationName] = useState('');
  const [dosage, setDosage] = useState('');
  const [quantity, setQuantity] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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
        medicationQuantity: quantity ? parseInt(quantity, 10) : undefined,
        additionalNotes: notes.trim() || undefined,
      };

      // If returning patient, go to mailto/summary
      // If new patient, continue to anamnesis
      if (skipFullAnamnesis) {
        // TODO: Navigate to RequestSummary screen for mailto generation
        navigation.navigate('RequestSummary', { request: prescriptionRequest });
      } else {
        // New patient: Store request and continue with anamnesis
        // TODO: Store request in context/store
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
    <KeyboardAvoidingView
      style={styles.keyboardView}
      behavior={Platform.OS === 'ios' ? 'padding' : Platform.OS === 'windows' ? 'height' : undefined}>
      <View style={[styles.container, isHighContrast && styles.containerHighContrast]}>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
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

            <AppInput
              label={t('prescription.dosage', { defaultValue: 'Dosierung (optional)' })}
              value={dosage}
              onChangeText={setDosage}
              placeholder={t('prescription.dosagePlaceholder', {
                defaultValue: 'z.B. 3x täglich',
              })}
              testID="input-dosage"
            />

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
