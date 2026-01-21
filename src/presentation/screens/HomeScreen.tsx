/**
 * Home Screen - App Entry Point
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { DeleteAllDataUseCase } from '../../domain/usecases/DeleteAllDataUseCase';
import { useQuestionnaireStore } from '../state/useQuestionnaireStore';
import { colors, spacing, radius } from '../theme/tokens';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

type UserMode = 'doctor' | 'patient' | null;

export const HomeScreen = ({ navigation }: Props): React.JSX.Element => {
  const { t } = useTranslation();
  const [selectedMode, setSelectedMode] = useState<UserMode>(null);

  const handleDeleteAllData = () => {
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
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>{t('home.title')}</Text>
        <Text style={styles.subtitle}>
          {t('home.subtitle')}
        </Text>

        {/* Mode Selection Card */}
        <View style={styles.modeCard}>
          <Text style={styles.modeTitle}>
            {t('home.modeSelection.title', { defaultValue: 'Wer nutzt die App?' })}
          </Text>
          <Text style={styles.modeSubtitle}>
            {t('home.modeSelection.subtitle', { defaultValue: 'Bitte wählen Sie Ihre Rolle' })}
          </Text>
          
          <View style={styles.modeButtons}>
            <TouchableOpacity
              style={[
                styles.modeButton,
                selectedMode === 'doctor' && styles.modeButtonSelected,
              ]}
              onPress={() => setSelectedMode('doctor')}
              testID="btn-mode-doctor">
              <Text style={styles.modeIcon}>🩺</Text>
              <Text style={[
                styles.modeButtonTitle,
                selectedMode === 'doctor' && styles.modeButtonTitleSelected,
              ]}>
                {t('home.modeSelection.doctor', { defaultValue: 'Arzt/Praxis' })}
              </Text>
              <Text style={styles.modeButtonDescription}>
                {t('home.modeSelection.doctorDescription', { defaultValue: 'Tablet dem Patienten übergeben' })}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.modeButton,
                selectedMode === 'patient' && styles.modeButtonSelected,
              ]}
              onPress={() => setSelectedMode('patient')}
              testID="btn-mode-patient">
              <Text style={styles.modeIcon}>👤</Text>
              <Text style={[
                styles.modeButtonTitle,
                selectedMode === 'patient' && styles.modeButtonTitleSelected,
              ]}>
                {t('home.modeSelection.patient', { defaultValue: 'Patient' })}
              </Text>
              <Text style={styles.modeButtonDescription}>
                {t('home.modeSelection.patientDescription', { defaultValue: 'Selbstständig ausfüllen' })}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[
              styles.primaryButton,
              !selectedMode && styles.primaryButtonDisabled,
            ]}
            disabled={!selectedMode}
            onPress={() => {
              // Store the mode for use in later screens
              useQuestionnaireStore.getState().setUserMode(selectedMode);
              navigation.navigate('MasterPassword', { mode: 'setup' });
            }}>
            <Text style={styles.primaryButtonText}>{t('home.startNew')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => {
              navigation.navigate('SavedAnamneses');
            }}>
            <Text style={styles.secondaryButtonText}>
              {t('home.saved')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.tertiaryButton}
            onPress={() => {
              navigation.navigate('SelectLanguage');
            }}>
            <Text style={styles.tertiaryButtonText}>{t('home.selectLanguage')}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>{t('home.privacyTitle')}</Text>
          <Text style={styles.infoText}>
            • {t('home.privacyBullet1')}{'\n'}
            • {t('home.privacyBullet2')}{'\n'}
            • {t('home.privacyBullet3')}{'\n'}
            • {t('home.privacyBullet4')}
          </Text>
        </View>

        <View style={styles.featuresList}>
          <Text style={styles.featuresTitle}>{t('home.featuresTitle')}</Text>
          <Text style={styles.featureItem}>✓ {t('home.featureLanguages')}</Text>
          <Text style={styles.featureItem}>✓ {t('home.featureOffline')}</Text>
          <Text style={styles.featureItem}>• {t('home.featureVoice')}</Text>
          <Text style={styles.featureItem}>• {t('home.featureOcr')}</Text>
          <Text style={styles.featureItem}>✓ {t('home.featureGdt')}</Text>
        </View>

        <View style={styles.dangerZone}>
          <Text style={styles.dangerTitle}>
            {t('settings.dangerZone', { defaultValue: 'Data Management' })}
          </Text>
          <TouchableOpacity
            style={styles.dangerButton}
            onPress={handleDeleteAllData}
            testID="btn-delete-all-data">
            <Text style={styles.dangerButtonText}>
              {t('settings.deleteAllData', { defaultValue: 'Delete All Data (GDPR)' })}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Feedback Section */}
        <View style={styles.feedbackSection}>
          <TouchableOpacity
            style={styles.feedbackButton}
            onPress={() => navigation.navigate('Feedback')}
            testID="btn-send-feedback"
            accessibilityRole="button"
            accessibilityLabel={t('feedback.title', { defaultValue: 'Send Feedback' })}>
            <Text style={styles.feedbackButtonText}>
              {t('feedback.homeButton', { defaultValue: '💬 Send Feedback' })}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Voice Section */}
        <View style={styles.voiceSection}>
          <TouchableOpacity
            style={styles.voiceButton}
            onPress={() => navigation.navigate('Voice')}
            testID="btn-voice-assistant"
            accessibilityRole="button"
            accessibilityLabel={t('voice.title', { defaultValue: 'Voice Assistant' })}>
            <Text style={styles.voiceButtonText}>
              {t('voice.homeButton', { defaultValue: '🎤 Voice Assistant (FREE)' })}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Calculator Section */}
        <View style={styles.calculatorSection}>
          <TouchableOpacity
            style={styles.calculatorButton}
            onPress={() => navigation.navigate('Calculator')}
            testID="btn-clinical-calculator"
            accessibilityRole="button"
            accessibilityLabel={t('calculator.title', { defaultValue: 'Clinical Calculators' })}>
            <Text style={styles.calculatorButtonText}>
              {t('calculator.homeButton', { defaultValue: '🧮 Clinical Calculators' })}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Data Management Section */}
        <View style={styles.dataManagementSection}>
          <TouchableOpacity
            style={styles.dataManagementButton}
            onPress={() => navigation.navigate('DataManagement')}
            testID="btn-data-management"
            accessibilityRole="button"
            accessibilityLabel={t('dataManagement.title', { defaultValue: 'Data Management' })}>
            <Text style={styles.dataManagementButtonText}>
              {t('dataManagement.homeButton', { defaultValue: '💾 Backup & Restore' })}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
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
    backgroundColor: colors.primary,
    padding: spacing.lg,
    borderRadius: radius.md,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  primaryButtonDisabled: {
    backgroundColor: colors.borderLight,
  },
  primaryButtonText: {
    color: colors.onPrimary,
    fontSize: 18,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: radius.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  secondaryButtonText: {
    color: colors.primary,
    fontSize: 18,
    fontWeight: '600',
  },
  tertiaryButton: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radius.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: spacing.md,
  },
  tertiaryButtonText: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '600',
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
  dangerButton: {
    backgroundColor: colors.dangerSurface,
    padding: spacing.lg,
    borderRadius: radius.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.dangerBorder,
  },
  dangerButtonText: {
    color: colors.dangerText,
    fontSize: 16,
    fontWeight: '600',
  },
  feedbackSection: {
    marginTop: spacing.xxl,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    paddingTop: spacing.lg,
  },
  feedbackButton: {
    backgroundColor: colors.successSurface,
    padding: spacing.lg,
    borderRadius: radius.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.successBorder,
  },
  feedbackButtonText: {
    color: colors.successText,
    fontSize: 16,
    fontWeight: '600',
  },
  voiceSection: {
    marginTop: spacing.lg,
  },
  voiceButton: {
    backgroundColor: colors.infoSurface,
    padding: spacing.lg,
    borderRadius: radius.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.infoBorder,
  },
  voiceButtonText: {
    color: colors.infoText,
    fontSize: 16,
    fontWeight: '600',
  },
  calculatorSection: {
    marginTop: spacing.lg,
  },
  calculatorButton: {
    backgroundColor: colors.warningSurface,
    padding: spacing.lg,
    borderRadius: radius.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.warningBorder,
  },
  calculatorButtonText: {
    color: colors.warningText,
    fontSize: 16,
    fontWeight: '600',
  },
  dataManagementSection: {
    marginTop: spacing.lg,
  },
  dataManagementButton: {
    backgroundColor: colors.accentSurface,
    padding: spacing.lg,
    borderRadius: radius.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.accentBorder,
  },
  dataManagementButtonText: {
    color: colors.accentText,
    fontSize: 16,
    fontWeight: '600',
  },
});
