/**
 * Data Management Screen - Backup & Restore
 * ISO/WCAG: Token-based design system
 */

import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { AppText } from '../components/AppText';
import { useTranslation } from 'react-i18next';
import { BackupUseCase } from '../../application/use-cases/BackupUseCase';
import { RestoreUseCase, RestoreStrategy } from '../../application/use-cases/RestoreUseCase';
import { requireRNFS } from '../../shared/rnfsSafe';
import { colors, spacing, radius } from '../theme/tokens';
import { FeatureBanner } from '../components/FeatureBanner';
import { reportUserError } from '../../shared/userFacingError';
import { AppButton } from '../components/AppButton';
import { ScreenContainer } from '../components/ScreenContainer';
import { useQuestionnaireStore } from '../state/useQuestionnaireStore';
import { RootNavigationProp } from '../navigation/RootNavigator';
import {
  supportsDocumentPicker,
  supportsRNFS,
  supportsShare,
} from '../../shared/platformCapabilities';

type DocumentPickerModule = typeof import('react-native-document-picker');
type ShareModule = {
  open: (options: { url: string; type: string; title: string }) => Promise<void>;
};

const getDocumentPicker = (): DocumentPickerModule | null => {
  if (!supportsDocumentPicker) return null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    return require('react-native-document-picker') as DocumentPickerModule;
  } catch {
    return null;
  }
};

const getShareModule = (): ShareModule | null => {
  if (!supportsShare) return null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const mod = require('react-native-share') as { default?: ShareModule };
    return mod?.default ?? (mod as ShareModule);
  } catch {
    return null;
  }
};

// Navigation Props type (kept for future use)
// type Props = NativeStackScreenProps<RootStackParamList, 'DataManagement'>;

export const DataManagementScreen = ({ navigation }: { navigation: RootNavigationProp }): React.JSX.Element => {
  const { t } = useTranslation();
  useTheme();
  const [isProcessing, setIsProcessing] = useState(false);
  const { encryptionKey } = useQuestionnaireStore();

  const canBackup = supportsShare;
  const canRestore = supportsDocumentPicker && supportsRNFS;
  const showError = (message: string, error?: unknown) => {
    reportUserError({ title: t('common.error'), message, error });
  };

  const handleBackup = async () => {
    setIsProcessing(true);
    try {
      const shareModule = getShareModule();
      if (!shareModule) {
        showError(t('dataManagement.backup.error'));
        return;
      }

      const backupUseCase = new BackupUseCase();
      if (!encryptionKey) {
        showError(t('masterPassword.errorEmpty'));
        return;
      }
      const result = await backupUseCase.execute({ encryptionKey });

      if (!result.success) {
        showError(result.error || t('dataManagement.backup.error'));
        return;
      }

      // Share the backup file
      await shareModule.open({
        url: `file://${result.filePath}`,
        type: 'application/octet-stream',
        title: t('dataManagement.backup.title'),
      });

      Alert.alert(t('common.success'), t('dataManagement.backup.success'));
    } catch (error) {
      showError(t('dataManagement.backup.error'), error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRestore = async (strategy: RestoreStrategy) => {
    try {
      const documentPicker = getDocumentPicker();
      if (!documentPicker) {
        showError(t('dataManagement.restore.error'));
        return;
      }

      if (!supportsRNFS) {
        showError(t('dataManagement.restore.error'));
        return;
      }

      const pickerResult = await documentPicker.pick({
        type: [documentPicker.types.allFiles],
      });

      const file = pickerResult[0];
      if (!file || !file.uri) {
        return;
      }

      setIsProcessing(true);

      // Read file content
      const filePath = file.uri.replace('file://', '');
      const RNFS = requireRNFS();
      const backupData = await RNFS.readFile(filePath, 'utf8');

      const restoreUseCase = new RestoreUseCase();
      if (!encryptionKey) {
        showError(t('masterPassword.errorEmpty'));
        return;
      }
      const result = await restoreUseCase.execute({
        backupData,
        encryptionKey,
        strategy,
      });

      if (!result.success) {
        showError(result.error || t('dataManagement.restore.error'));
        return;
      }

      Alert.alert(t('common.success'), t('dataManagement.restore.success'));
    } catch (error) {
      const documentPicker = getDocumentPicker();
      if (documentPicker?.isCancel(error)) {
        // User cancelled
        return;
      }

      if (error instanceof Error && error.message.includes('RNFS is not available')) {
        showError(t('dataManagement.restore.error'));
        return;
      }

      showError(t('dataManagement.restore.error'), error);
    } finally {
      setIsProcessing(false);
    }
  };

  const confirmRestore = (strategy: RestoreStrategy) => {
    const title =
      strategy === 'replace'
        ? t('dataManagement.restore.replaceTitle')
        : t('dataManagement.restore.mergeTitle');

    const message =
      strategy === 'replace'
        ? t('dataManagement.restore.replaceWarning')
        : t('dataManagement.restore.mergeWarning');

    Alert.alert(title, message, [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.continue'),
        style: strategy === 'replace' ? 'destructive' : 'default',
        onPress: () => handleRestore(strategy),
      },
    ]);
  };

  return (
    <ScreenContainer testID="data-management-screen" accessibilityLabel="Data Management">
      <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.content}>
        {(!canBackup || !canRestore) && (
          <FeatureBanner
            title={t('common.featureUnavailableTitle')}
            message={t('common.featureUnavailableMessage', { feature: t('dataManagement.title') })}
          />
        )}
        <AppText style={styles.title} accessibilityRole="header">
          {t('dataManagement.title')}
        </AppText>
        <AppText style={styles.subtitle}>{t('dataManagement.subtitle')}</AppText>

        {/* Backup Section */}
        <View style={styles.section}>
          <AppText style={styles.sectionTitle} accessibilityRole="header">
            {t('dataManagement.backup.title')}
          </AppText>
          <AppText style={styles.sectionDescription}>{t('dataManagement.backup.description')}</AppText>
          <AppButton
            title={t('dataManagement.backup.createBackup')}
            onPress={handleBackup}
            disabled={isProcessing}
            loading={isProcessing}
          />
        </View>

        {/* Restore Section */}
        <View style={styles.section}>
          <AppText style={styles.sectionTitle} accessibilityRole="header">
            {t('dataManagement.restore.title')}
          </AppText>
          <AppText style={styles.sectionDescription}>{t('dataManagement.restore.description')}</AppText>

          <AppButton
            title={t('dataManagement.restore.mergeButton')}
            variant="secondary"
            onPress={() => confirmRestore('merge')}
            disabled={isProcessing}
            style={styles.actionButton}
          />

          <AppButton
            title={t('dataManagement.restore.replaceButton')}
            variant="danger"
            onPress={() => confirmRestore('replace')}
            disabled={isProcessing}
            accessibilityHint={t('dataManagement.restore.replaceWarning')}
          />
        </View>

        {/* Analysis Section */}
        <View style={styles.section}>
          <AppText style={styles.sectionTitle} accessibilityRole="header">
            {t('dashboard.title', 'Analysis & Statistics')}
          </AppText>
          <AppText style={styles.sectionDescription}>
            {t('dashboard.description', 'View statistics and completion rates for your questionnaires.')}
          </AppText>
          <AppButton
            title={t('dashboard.open', 'Open Dashboard')}
            onPress={() => navigation.navigate('Dashboard')}
            variant="primary"
          />
        </View>

        {/* Info Section */}
        <View style={styles.infoCard}>
          <AppText style={styles.infoTitle} accessibilityRole="header">
            {t('dataManagement.info.title')}
          </AppText>
          <AppText style={styles.infoText}>
            • {t('dataManagement.info.encrypted')}
            {'\n'}• {t('dataManagement.info.localOnly')}
            {'\n'}• {t('dataManagement.info.gdprCompliant')}
          </AppText>
        </View>
        </View>
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
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textMuted,
    marginBottom: spacing.xl,
  },
  section: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  sectionDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
    lineHeight: 20,
  },
  actionButton: {
    marginBottom: spacing.sm,
  },
  infoCard: {
    backgroundColor: colors.primaryLight,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primaryDark,
    marginBottom: spacing.xs,
  },
  infoText: {
    fontSize: 14,
    color: colors.primaryDark,
    lineHeight: 22,
  },
});
