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
import { AppButton } from '../components/AppButton';

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
          <AppButton
            title={t('home.startNew')}
            disabled={!selectedMode}
            onPress={() => {
              useQuestionnaireStore.getState().setUserMode(selectedMode);
              navigation.navigate('MasterPassword', { mode: 'setup' });
            }}
            style={styles.primaryButton}
          />

          <AppButton
            title={t('home.saved')}
            variant="secondary"
            onPress={() => {
              navigation.navigate('SavedAnamneses');
            }}
            style={styles.secondaryButton}
          />

          <AppButton
            title={t('home.selectLanguage')}
            variant="tertiary"
            onPress={() => {
              navigation.navigate('SelectLanguage');
            }}
            style={styles.tertiaryButton}
          />
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
});
