/**
 * PatientTypeScreen - Patient type selection (new vs returning)
 *
 * Flow branching logic:
 * - New Patient: Full anamnesis + optional document request
 * - Returning Patient: Quick document request only (skip anamnesis)
 *
 * @security No PII stored/logged on this screen.
 */

import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { StackScreenProps } from '@react-navigation/stack';
import { usePatientContext } from '../../application/PatientContext';
import { useTheme } from '../theme/ThemeContext';
import { AppText } from '../components/AppText';
import { ScreenContainer } from '../components/ScreenContainer';
import { colors, spacing, radius } from '../theme/tokens';
import type { RootStackParamList } from '../navigation/RootNavigator';

type Props = StackScreenProps<RootStackParamList, 'PatientType'>;

export const PatientTypeScreen = ({ navigation }: Props): React.JSX.Element => {
  const { t } = useTranslation();
  const { setPatientStatus, setSkipFullAnamnesis } = usePatientContext();
  const { isHighContrast } = useTheme();

  const handleNewPatient = (): void => {
    setPatientStatus('new');
    setSkipFullAnamnesis(false);
    // New patients go through full flow: VisitReason → PatientInfo → Questionnaire
    navigation.navigate('VisitReason');
  };

  const handleReturningPatient = (): void => {
    setPatientStatus('returning');
    setSkipFullAnamnesis(true);
    // Returning patients go to quick document request
    navigation.navigate('DocumentRequest');
  };

  return (
    <ScreenContainer testID="patient-type-screen" accessibilityLabel="Patient Type Selection">
    <View style={[styles.container, isHighContrast && styles.containerHighContrast]}>
      <View style={styles.headerSection}>
        <AppText variant="h1" style={[styles.title, isHighContrast && styles.textHighContrast]}>
          {t('patientType.title', { defaultValue: 'Willkommen!' })}
        </AppText>
        <AppText style={[styles.subtitle, isHighContrast && styles.textHighContrast]}>
          {t('patientType.subtitle', { defaultValue: 'Sind Sie zum ersten Mal bei uns?' })}
        </AppText>
      </View>

      <View style={styles.optionsContainer}>
        <TouchableOpacity
          style={[styles.optionCard, isHighContrast && styles.optionCardHighContrast]}
          onPress={handleNewPatient}
          accessibilityRole="button"
          accessibilityLabel={t('patientType.newPatient', { defaultValue: 'Neuer Patient' })}>
          <View style={[styles.iconCircle, styles.iconNew]}>
            <AppText style={styles.iconEmoji}>👤</AppText>
          </View>
          <AppText style={[styles.optionTitle, isHighContrast && styles.textHighContrastInverse]}>
            {t('patientType.newPatient', { defaultValue: 'Neuer Patient' })}
          </AppText>
          <AppText style={[styles.optionDesc, isHighContrast && styles.textHighContrastInverse]}>
            {t('patientType.newPatientDesc', { defaultValue: 'Erstes Mal in dieser Praxis' })}
          </AppText>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.optionCard, isHighContrast && styles.optionCardHighContrast]}
          onPress={handleReturningPatient}
          accessibilityRole="button"
          accessibilityLabel={t('patientType.returningPatient', {
            defaultValue: 'Bekannter Patient',
          })}>
          <View style={[styles.iconCircle, styles.iconReturning]}>
            <AppText style={styles.iconEmoji}>🔄</AppText>
          </View>
          <AppText style={[styles.optionTitle, isHighContrast && styles.textHighContrastInverse]}>
            {t('patientType.returningPatient', { defaultValue: 'Bekannter Patient' })}
          </AppText>
          <AppText style={[styles.optionDesc, isHighContrast && styles.textHighContrastInverse]}>
            {t('patientType.returningPatientDesc', { defaultValue: 'War schon einmal hier' })}
          </AppText>
        </TouchableOpacity>
      </View>

      <View style={styles.infoBox}>
        <AppText style={[styles.infoText, isHighContrast && styles.textHighContrast]}>
          {t('patientType.infoText', {
            defaultValue:
              'Neue Patienten durchlaufen eine kurze Anamnese. Bekannte Patienten können direkt Rezepte, Überweisungen oder AU anfordern.',
          })}
        </AppText>
      </View>
    </View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.lg,
  },
  containerHighContrast: {
    backgroundColor: '#000000',
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  title: {
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: colors.textMuted,
    textAlign: 'center',
  },
  textHighContrast: {
    color: '#ffffff',
  },
  textHighContrastInverse: {
    color: '#000000',
  },
  optionsContainer: {
    flex: 1,
    gap: spacing.lg,
    justifyContent: 'center',
  },
  optionCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.xl,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.border,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  optionCardHighContrast: {
    backgroundColor: '#FFFF00',
    borderColor: '#000000',
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  iconNew: {
    backgroundColor: colors.primaryLight || '#E3F2FD',
  },
  iconReturning: {
    backgroundColor: colors.successSurface || '#E8F5E9',
  },
  iconEmoji: {
    fontSize: 28,
  },
  optionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  optionDesc: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
  },
  infoBox: {
    backgroundColor: colors.infoSurface || '#E3F2FD',
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.lg,
  },
  infoText: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
});
