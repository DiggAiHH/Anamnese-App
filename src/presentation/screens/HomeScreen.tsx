/**
 * Home Screen - App Entry Point
 */

import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { DeleteAllDataUseCase } from '../../application/use-cases/DeleteAllDataUseCase';
import { useQuestionnaireStore } from '../state/useQuestionnaireStore';
import { colors, spacing, radius } from '../theme/tokens';
import { AppButton } from '../components/AppButton';
import { Container } from '../components/Container';
import { AppText } from '../components/AppText';

// FIXED: Removed duplicate __DEV__ declaration (global from webpack.config.js)

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

type UserMode = 'doctor' | 'patient' | null;

export const HomeScreen = ({ navigation }: Props): React.JSX.Element => {
  const { t } = useTranslation();
  const [selectedMode, setSelectedMode] = useState<UserMode>(null);

  const handleDeleteAllData = (): void => {
    Alert.alert(
      t('settings.deleteTitle', { defaultValue: 'Delete All Data?' }),
      t('settings.deleteMessage', {
        defaultValue:
          'This will permanently remove all patients, questionnaires, and app settings. This action cannot be undone.',
      }),
      [
        { text: t('common.cancel', { defaultValue: 'Cancel' }), style: 'cancel' },
        {
          text: t('common.delete', { defaultValue: 'Delete' }),
          style: 'destructive',
          onPress: async () => {
            try {
              await new DeleteAllDataUseCase().execute();
              useQuestionnaireStore.getState().reset();
              Alert.alert(
                t('common.success', { defaultValue: 'Success' }),
                t('settings.deleteSuccess', { defaultValue: 'All data has been deleted.' }),
              );
            } catch (error) {
              Alert.alert(
                t('common.error', { defaultValue: 'Error' }),
                t('settings.deleteError', { defaultValue: 'Failed to delete data.' }),
              );
            }
          },
        },
      ],
    );
  };

  return (
    <Container scroll>
      <View style={styles.content}>
        <AppText style={styles.title}>{t('home.title')}</AppText>
        <AppText style={styles.subtitle}>{t('home.subtitle')}</AppText>

        {/* Mode Selection Card */}
        <View style={styles.modeCard}>
          <AppText style={styles.modeTitle}>
            {t('home.modeSelection.title', { defaultValue: 'Wer nutzt die App?' })}
          </AppText>
          <AppText style={styles.modeSubtitle}>
            {t('home.modeSelection.subtitle', { defaultValue: 'Bitte wählen Sie Ihre Rolle' })}
          </AppText>

          <View style={styles.modeButtons}>
            <TouchableOpacity
              style={[styles.modeButton, selectedMode === 'doctor' && styles.modeButtonSelected]}
              onPress={() => setSelectedMode('doctor')}
              testID="btn-mode-doctor">
              <AppText style={styles.modeIcon}>🩺</AppText>
              <AppText
                style={[
                  styles.modeButtonTitle,
                  selectedMode === 'doctor' && styles.modeButtonTitleSelected,
                ]}>
                {t('home.modeSelection.doctor', { defaultValue: 'Arzt/Praxis' })}
              </AppText>
              <AppText style={styles.modeButtonDescription}>
                {t('home.modeSelection.doctorDescription', {
                  defaultValue: 'Tablet dem Patienten übergeben',
                })}
              </AppText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modeButton, selectedMode === 'patient' && styles.modeButtonSelected]}
              onPress={() => setSelectedMode('patient')}
              testID="btn-mode-patient">
              <AppText style={styles.modeIcon}>👤</AppText>
              <AppText
                style={[
                  styles.modeButtonTitle,
                  selectedMode === 'patient' && styles.modeButtonTitleSelected,
                ]}>
                {t('home.modeSelection.patient', { defaultValue: 'Patient' })}
              </AppText>
              <AppText style={styles.modeButtonDescription}>
                {t('home.modeSelection.patientDescription', {
                  defaultValue: 'Selbstständig ausfüllen',
                })}
              </AppText>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.buttonContainer}>
          <AppButton
            title={t('home.startNew')}
            disabled={!selectedMode}
            onPress={() => {
              useQuestionnaireStore.getState().setUserMode(selectedMode);
              navigation.navigate('GDPRConsent');
            }}
            style={styles.primaryButton}
            accessibilityLabel={t('home.startNew')}
            accessibilityHint={t('home.startNewHint', {
              defaultValue: 'Starts a new anamnesis questionnaire',
            })}
          />

          <AppButton
            title={t('home.saved')}
            variant="secondary"
            onPress={() => {
              navigation.navigate('SavedAnamneses');
            }}
            style={styles.secondaryButton}
            accessibilityLabel={t('home.saved')}
            accessibilityHint={t('home.savedHint', {
              defaultValue: 'View previously saved anamnesis records',
            })}
          />

          <AppButton
            title={t('home.selectLanguage')}
            variant="tertiary"
            onPress={() => {
              navigation.navigate('SelectLanguage');
            }}
            style={styles.tertiaryButton}
            accessibilityLabel={t('home.selectLanguage')}
            accessibilityHint={t('home.selectLanguageHint', {
              defaultValue: 'Change the app language',
            })}
          />
        </View>

        {/* Fast Track Section */}
        <View style={styles.fastTrackSection}>
          <AppText style={styles.fastTrackTitle}>
            {t('fastTrack.title', { defaultValue: 'Schnellzugang' })}
          </AppText>
          <AppText style={styles.fastTrackSubtitle}>
            {t('fastTrack.subtitle', { defaultValue: 'Ohne vollständige Anamnese' })}
          </AppText>
          <View style={styles.fastTrackButtons}>
            <AppButton
              title={t('fastTrack.prescription', { defaultValue: 'Rezept bestellen' })}
              onPress={() => navigation.navigate('FastTrack', { type: 'prescription' })}
              variant="outline"
              style={styles.fastTrackButton}
              testID="btn-fast-track-prescription"
            />
            <AppButton
              title={t('fastTrack.referral', { defaultValue: 'Überweisung' })}
              onPress={() => navigation.navigate('FastTrack', { type: 'referral' })}
              variant="outline"
              style={styles.fastTrackButton}
              testID="btn-fast-track-referral"
            />
          </View>
        </View>

        <View style={styles.infoCard}>
          <AppText style={styles.infoTitle}>{t('home.privacyTitle')}</AppText>
          <AppText style={styles.infoText}>
            • {t('home.privacyBullet1')}
            {'\n'}• {t('home.privacyBullet2')}
            {'\n'}• {t('home.privacyBullet3')}
            {'\n'}• {t('home.privacyBullet4')}
          </AppText>
        </View>

        <View style={styles.featuresList}>
          <AppText style={styles.featuresTitle}>{t('home.featuresTitle')}</AppText>
          <AppText style={styles.featureItem}>✓ {t('home.featureLanguages')}</AppText>
          <AppText style={styles.featureItem}>✓ {t('home.featureOffline')}</AppText>
          <AppText style={styles.featureItem}>• {t('home.featureVoice')}</AppText>
          <AppText style={styles.featureItem}>• {t('home.featureOcr')}</AppText>
          <AppText style={styles.featureItem}>✓ {t('home.featureGdt')}</AppText>
        </View>

        <View style={styles.dangerZone}>
          <AppText style={styles.dangerTitle}>
            {t('settings.dangerZone', { defaultValue: 'Data Management' })}
          </AppText>
          <AppButton
            title={t('settings.deleteAllData', { defaultValue: 'Delete All Data (GDPR)' })}
            variant="danger"
            onPress={handleDeleteAllData}
            testID="btn-delete-all-data"
          />
        </View>

        {/* Feedback Section */}
        <View style={styles.feedbackSection}>
          <AppButton
            title={t('feedback.homeButton', { defaultValue: 'Send Feedback' })}
            variant="success"
            onPress={() => navigation.navigate('Feedback')}
            testID="btn-send-feedback"
            accessibilityLabel={t('feedback.title', { defaultValue: 'Send Feedback' })}
          />
        </View>

        {/* Voice Section */}
        <View style={styles.voiceSection}>
          <AppButton
            title={t('voice.homeButton', { defaultValue: 'Voice Assistant (FREE)' })}
            variant="info"
            onPress={() => navigation.navigate('Voice')}
            testID="btn-voice-assistant"
            accessibilityLabel={t('voice.title', { defaultValue: 'Voice Assistant' })}
          />
        </View>

        {/* Calculator Section */}
        <View style={styles.calculatorSection}>
          <AppButton
            title={t('calculator.homeButton', { defaultValue: 'Clinical Calculators' })}
            variant="warning"
            onPress={() => navigation.navigate('Calculator')}
            testID="btn-clinical-calculator"
            accessibilityLabel={t('calculator.title', { defaultValue: 'Clinical Calculators' })}
          />
        </View>

        {/* Data Management Section */}
        <View style={styles.dataManagementSection}>
          <AppButton
            title={t('dataManagement.homeButton', { defaultValue: 'Backup & Restore' })}
            variant="accent"
            onPress={() => navigation.navigate('DataManagement')}
            testID="btn-data-management"
            accessibilityLabel={t('dataManagement.title', { defaultValue: 'Data Management' })}
          />
        </View>

        {/* Analytics Dashboard - accessible via DataManagement for production users */}
        {__DEV__ && (
          <View style={styles.devSection}>
            <AppButton
              title="[DEV] Analytics Dashboard"
              variant="outline"
              onPress={() => navigation.navigate('Dashboard')}
              testID="btn-dev-dashboard"
            />
          </View>
        )}
      </View>
    </Container>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.xl,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  // Mode Selection Styles
  modeCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modeTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  modeSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  modeButtons: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  modeButton: {
    flex: 1,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    padding: spacing.lg,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  modeButtonSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  modeIcon: {
    fontSize: 32,
    marginBottom: spacing.sm,
  },
  modeButtonTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  modeButtonTitleSelected: {
    color: colors.primaryDark,
  },
  modeButtonDescription: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  buttonContainer: {
    marginBottom: spacing.xxl,
  },
  primaryButton: {
    marginBottom: spacing.md,
  },
  secondaryButton: {
    marginBottom: spacing.md,
  },
  tertiaryButton: {
    marginTop: spacing.md,
  },
  infoCard: {
    backgroundColor: colors.infoSurface,
    padding: spacing.lg,
    borderRadius: radius.md,
    marginBottom: spacing.xxl,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.primaryDark,
    marginBottom: spacing.sm,
  },
  infoText: {
    fontSize: 14,
    color: colors.primaryDark,
    lineHeight: 22,
  },
  featuresList: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: radius.md,
  },
  featuresTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  featureItem: {
    fontSize: 14,
    color: colors.mutedText,
    marginBottom: spacing.sm,
  },
  dangerZone: {
    marginTop: spacing.xxl,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    paddingTop: spacing.lg,
  },
  dangerTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.dangerText,
    marginBottom: spacing.md,
    textTransform: 'uppercase',
  },
  feedbackSection: {
    marginTop: spacing.xxl,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    paddingTop: spacing.lg,
  },
  voiceSection: {
    marginTop: spacing.lg,
  },
  calculatorSection: {
    marginTop: spacing.lg,
  },
  dataManagementSection: {
    marginTop: spacing.lg,
  },
  fastTrackSection: {
    marginTop: spacing.xxl,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  fastTrackTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  fastTrackSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  fastTrackButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  fastTrackButton: {
    flex: 1,
  },
  devSection: {
    marginTop: spacing.xl,
    opacity: 0.5,
  },
});

