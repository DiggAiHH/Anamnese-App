/**
 * FastTrackScreen - Quick prescription/referral request
 * Bypasses full anamnesis for simple requests
 *
 * @security Minimal PII collected (name, DOB, request type only).
 *           PII is encrypted with AES-256-GCM before persistence (GDPR Art. 25).
 */

import React, { useState, useMemo } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { StackScreenProps } from '@react-navigation/stack';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { colors, spacing } from '../theme/tokens';
import { AppText } from '../components/AppText';
import { AppInput } from '../components/AppInput';
import { AppButton } from '../components/AppButton';
import { Card } from '../components/Card';
import { ScreenContainer } from '../components/ScreenContainer';
import { SaveFastTrackRequestUseCase } from '@application/use-cases/SaveFastTrackRequestUseCase';
import { encryptionService } from '@infrastructure/encryption/encryptionService';
import { useUnsavedChangesGuard } from '../hooks/useUnsavedChangesGuard';

type Props = StackScreenProps<RootStackParamList, 'FastTrack'>;

export const FastTrackScreen = ({ navigation, route }: Props): React.JSX.Element => {
  const { t } = useTranslation();
  const requestType = route.params?.type || 'prescription';

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [requestDetails, setRequestDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isDirty = Boolean(firstName || lastName || birthDate || requestDetails);
  useUnsavedChangesGuard(navigation, isDirty);

  const saveFastTrackUseCase = useMemo(
    () => new SaveFastTrackRequestUseCase(encryptionService),
    [],
  );

  const handleSubmit = async (): Promise<void> => {
    if (!firstName.trim() || !lastName.trim() || !birthDate.trim()) {
      Alert.alert(
        t('common.error'),
        t('fastTrack.errorRequired', 'Bitte füllen Sie alle Pflichtfelder aus.'),
      );
      return;
    }

    setIsSubmitting(true);

    try {
      // Derive a temporary encryption key for this request
      const { key } = await encryptionService.deriveKey(
        `fasttrack_${Date.now()}`,
      );

      const result = await saveFastTrackUseCase.execute(
        {
          firstName,
          lastName,
          birthDate,
          requestType: requestType as 'prescription' | 'referral',
          requestDetails,
        },
        key,
      );

      if (!result.success) {
        throw new Error(result.error ?? 'Unknown error');
      }

      Alert.alert(
        t('common.success'),
        t('fastTrack.successMessage', 'Ihre Anfrage wurde erfolgreich übermittelt.'),
        [{ text: 'OK', onPress: () => navigation.navigate('Home') }],
      );
    } catch {
      Alert.alert(t('common.error'), t('fastTrack.errorSubmit', 'Fehler beim Senden.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid = firstName.trim() && lastName.trim() && birthDate.trim();

  return (
    <ScreenContainer testID="fast-track-screen" accessibilityLabel="Fast Track Request">
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Card style={styles.card}>
        <AppText variant="h2" style={styles.title}>
          {requestType === 'prescription'
            ? t('fastTrack.prescription', 'Rezept bestellen')
            : t('fastTrack.referral', 'Überweisung anfordern')}
        </AppText>
        <AppText variant="body" color="muted" style={styles.subtitle}>
          {t('fastTrack.subtitle', 'Schnellzugang ohne vollständige Anamnese')}
        </AppText>

        <View style={styles.form}>
          <AppInput
            label={t('patientInfo.firstName', 'Vorname') + ' *'}
            value={firstName}
            onChangeText={setFirstName}
            placeholder={t('placeholders.vorname', 'z.B. Max')}
          />

          <AppInput
            label={t('patientInfo.lastName', 'Nachname') + ' *'}
            value={lastName}
            onChangeText={setLastName}
            placeholder={t('placeholders.nachname', 'z.B. Mustermann')}
          />

          <AppInput
            label={t('patientInfo.birthDate', 'Geburtsdatum') + ' *'}
            value={birthDate}
            onChangeText={setBirthDate}
            placeholder="TT.MM.JJJJ"
            keyboardType="numeric"
          />

          <AppInput
            label={
              requestType === 'prescription'
                ? t('fastTrack.medicationLabel', 'Gewünschtes Medikament')
                : t('fastTrack.referralLabel', 'Grund der Überweisung')
            }
            value={requestDetails}
            onChangeText={setRequestDetails}
            placeholder={
              requestType === 'prescription'
                ? t('fastTrack.medicationPlaceholder', 'z.B. Ibuprofen 400mg')
                : t('fastTrack.referralPlaceholder', 'z.B. Kardiologie')
            }
            multiline
            numberOfLines={3}
          />
        </View>

        <AppButton
          title={
            isSubmitting ? t('common.sending', 'Wird gesendet...') : t('buttons.submit', 'Absenden')
          }
          onPress={handleSubmit}
          disabled={!isFormValid || isSubmitting}
          style={styles.submitButton}
        />

        <AppButton
          title={t('common.cancel', 'Abbrechen')}
          onPress={() => navigation.goBack()}
          variant="outline"
          style={styles.cancelButton}
        />
      </Card>
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
    padding: spacing.md,
  },
  card: {
    padding: spacing.lg,
  },
  title: {
    marginBottom: spacing.xs,
  },
  subtitle: {
    marginBottom: spacing.lg,
  },
  form: {
    gap: spacing.md,
  },
  submitButton: {
    marginTop: spacing.xl,
  },
  cancelButton: {
    marginTop: spacing.sm,
  },
});

export default FastTrackScreen;
