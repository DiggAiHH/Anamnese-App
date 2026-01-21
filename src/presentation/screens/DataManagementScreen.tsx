/**
 * Data Management Screen - Backup & Restore
 * ISO/WCAG: Token-based design system
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { BackupUseCase } from '../../application/use-cases/BackupUseCase';
import { RestoreUseCase, RestoreStrategy } from '../../application/use-cases/RestoreUseCase';
import DocumentPicker from 'react-native-document-picker';
import Share from 'react-native-share';
import { requireRNFS } from '../../shared/rnfsSafe';
import { colors, spacing, radius } from '../theme/tokens';
import { logError } from '../../shared/logger';

// Navigation Props type (kept for future use)
// type Props = NativeStackScreenProps<RootStackParamList, 'DataManagement'>;

export const DataManagementScreen = (): React.JSX.Element => {
  const { t } = useTranslation();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleBackup = async () => {
    setIsProcessing(true);
    try {
      const backupUseCase = new BackupUseCase();
      const result = await backupUseCase.execute({ encryptionKey: 'default-key' });

      if (!result.success) {
        Alert.alert(t('common.error'), result.error || t('dataManagement.backup.error'));
        return;
      }

      // Share the backup file
      await Share.open({
        url: `file://${result.filePath}`,
        type: 'application/octet-stream',
        title: t('dataManagement.backup.title'),
      });

      Alert.alert(
        t('common.success'),
        t('dataManagement.backup.success')
      );
    } catch (error) {
      // GDPR-safe: error logged through sanitizing logger
      logError('[DataManagement] Backup error', error);
      Alert.alert(t('common.error'), t('dataManagement.backup.error'));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRestore = async (strategy: RestoreStrategy) => {
    try {
      const pickerResult = await DocumentPicker.pick({
        type: [DocumentPicker.types.allFiles],
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
      const result = await restoreUseCase.execute({
        backupData,
        encryptionKey: 'default-key',
        strategy,
      });

      if (!result.success) {
        Alert.alert(t('common.error'), result.error || t('dataManagement.restore.error'));
        return;
      }

      Alert.alert(
        t('common.success'),
        t('dataManagement.restore.success')
      );
    } catch (error) {
      if (DocumentPicker.isCancel(error)) {
        // User cancelled
        return;
      }

      if (error instanceof Error && error.message.includes('RNFS is not available')) {
        Alert.alert(t('common.error'), t('dataManagement.restore.error'));
        return;
      }

      // GDPR-safe: error sanitized before logging
      if (typeof __DEV__ !== 'undefined' && __DEV__) {
        // eslint-disable-next-line no-console, @typescript-eslint/no-var-requires
        const { sanitizeErrorToString } = require('../../shared/sanitizeError');
        // eslint-disable-next-line no-console
        console.error('[DataManagement] Restore error:', sanitizeErrorToString(error));
      }
      Alert.alert(t('common.error'), t('dataManagement.restore.error'));
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
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title} accessibilityRole="header">{t('dataManagement.title')}</Text>
        <Text style={styles.subtitle}>{t('dataManagement.subtitle')}</Text>

        {/* Backup Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle} accessibilityRole="header">{t('dataManagement.backup.title')}</Text>
          <Text style={styles.sectionDescription}>
            {t('dataManagement.backup.description')}
          </Text>
          <TouchableOpacity
            style={[styles.primaryButton, isProcessing && styles.buttonDisabled]}
            onPress={handleBackup}
            disabled={isProcessing}
            accessibilityRole="button"
            accessibilityState={{ disabled: isProcessing }}
            accessibilityLabel={t('dataManagement.backup.createBackup')}>
            {isProcessing ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.primaryButtonText}>
                {t('dataManagement.backup.createBackup')}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Restore Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle} accessibilityRole="header">{t('dataManagement.restore.title')}</Text>
          <Text style={styles.sectionDescription}>
            {t('dataManagement.restore.description')}
          </Text>

          <TouchableOpacity
            style={[styles.secondaryButton, isProcessing && styles.buttonDisabled]}
            onPress={() => confirmRestore('merge')}
            disabled={isProcessing}
            accessibilityRole="button"
            accessibilityState={{ disabled: isProcessing }}
            accessibilityLabel={t('dataManagement.restore.mergeButton')}>
            <Text style={styles.secondaryButtonText}>
              {t('dataManagement.restore.mergeButton')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.dangerButton, isProcessing && styles.buttonDisabled]}
            onPress={() => confirmRestore('replace')}
            disabled={isProcessing}
            accessibilityRole="button"
            accessibilityState={{ disabled: isProcessing }}
            accessibilityLabel={t('dataManagement.restore.replaceButton')}
            accessibilityHint={t('dataManagement.restore.replaceWarning')}>
            <Text style={styles.dangerButtonText}>
              {t('dataManagement.restore.replaceButton')}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Info Section */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle} accessibilityRole="header">{t('dataManagement.info.title')}</Text>
          <Text style={styles.infoText}>
            • {t('dataManagement.info.encrypted')}{'\n'}
            • {t('dataManagement.info.localOnly')}{'\n'}
            • {t('dataManagement.info.gdprCompliant')}
          </Text>
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
    padding: spacing.lg,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.sm,
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  sectionDescription: {
    fontSize: 14,
    color: colors.textMuted,
    marginBottom: spacing.md,
    lineHeight: 20,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    padding: spacing.md,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: colors.textInverse,
    fontSize: 16,
    fontWeight: 'bold',
  },
  secondaryButton: {
    backgroundColor: colors.success,
    padding: spacing.md,
    borderRadius: radius.md,
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  secondaryButtonText: {
    color: colors.textInverse,
    fontSize: 16,
    fontWeight: 'bold',
  },
  dangerButton: {
    backgroundColor: colors.danger,
    padding: spacing.md,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  dangerButtonText: {
    color: colors.textInverse,
    fontSize: 16,
    fontWeight: 'bold',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  infoCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  infoText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 22,
  },
});
