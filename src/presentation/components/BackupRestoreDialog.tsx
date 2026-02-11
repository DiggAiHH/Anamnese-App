/**
 * BackupRestoreDialog - First-launch and on-demand backup restore modal
 *
 * @description Guides users through importing backups:
 *   - File selection
 *   - Password entry
 *   - Conflict resolution (merge/replace/newer-wins)
 *
 * @security DSGVO Art. 32 - Secure backup handling
 */

import React, { useState, useCallback } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import i18n from 'i18next';
import { colors, spacing, radius } from '../theme/tokens';
import { AppButton } from './AppButton';
import { RestoreStrategy, RestoreConflict } from '@application/use-cases/RestoreUseCase';

export interface BackupRestoreDialogProps {
  visible: boolean;
  onClose: () => void;
  onRestore: (backupContent: string, password: string, strategy: RestoreStrategy) => Promise<void>;
  conflicts?: RestoreConflict[];
  onResolveConflicts?: (resolved: Map<string, 'local' | 'backup'>) => void;
  isFirstLaunch?: boolean;
}

type Step = 'file' | 'password' | 'strategy' | 'conflicts' | 'progress' | 'result';

export const BackupRestoreDialog = ({
  visible,
  onClose,
  onRestore,
  conflicts,
  onResolveConflicts,
  isFirstLaunch = false,
}: BackupRestoreDialogProps): React.JSX.Element => {
  const { t } = useTranslation();

  const [step, setStep] = useState<Step>('file');
  const [backupContent, setBackupContent] = useState('');
  const [password, setPassword] = useState('');
  const [strategy, setStrategy] = useState<RestoreStrategy>('merge');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  // Conflict resolution state
  const [conflictResolutions, setConflictResolutions] = useState<Map<string, 'local' | 'backup'>>(
    new Map(),
  );

  const handleSelectFile = useCallback(async () => {
    // In a real implementation, this would use DocumentPicker
    // For now, we simulate with placeholder
    setError(null);

    // Placeholder: In production, use react-native-document-picker
    // const result = await DocumentPicker.pick({ type: ['application/json'] });
    // const content = await RNFS.readFile(result.uri);
    // setBackupContent(content);

    // For demo, advance to password step
    setStep('password');
  }, []);

  const handlePasswordSubmit = useCallback(() => {
    if (password.length < 8) {
      setError(t('backup.error.passwordTooShort'));
      return;
    }
    setError(null);
    setStep('strategy');
  }, [password, t]);

  const handleStrategySelect = useCallback((selectedStrategy: RestoreStrategy) => {
    setStrategy(selectedStrategy);
  }, []);

  const handleStartRestore = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setStep('progress');

    try {
      await onRestore(backupContent, password, strategy);
      setResult({
        success: true,
        message: t('backup.restoreSuccess'),
      });
      setStep('result');
    } catch (err) {
      setError(err instanceof Error ? err.message : t('backup.error.unknown'));
      setStep('strategy'); // Go back to strategy selection
    } finally {
      setIsLoading(false);
    }
  }, [backupContent, password, strategy, onRestore, t]);

  const handleConflictResolution = useCallback((id: string, choice: 'local' | 'backup') => {
    setConflictResolutions(prev => {
      const next = new Map(prev);
      next.set(id, choice);
      return next;
    });
  }, []);

  const handleApplyConflictResolutions = useCallback(() => {
    if (onResolveConflicts) {
      onResolveConflicts(conflictResolutions);
    }
    setStep('progress');
  }, [conflictResolutions, onResolveConflicts]);

  const handleClose = useCallback(() => {
    // Reset state
    setStep('file');
    setBackupContent('');
    setPassword('');
    setStrategy('merge');
    setError(null);
    setResult(null);
    setConflictResolutions(new Map());
    onClose();
  }, [onClose]);

  const renderFileStep = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>{t('backup.selectFile')}</Text>
      <Text style={styles.stepDescription}>
        {isFirstLaunch ? t('backup.firstLaunchMessage') : t('backup.selectFileDescription')}
      </Text>

      <AppButton
        title={t('backup.browseFiles')}
        onPress={handleSelectFile}
        accessibilityLabel={t('backup.browseFiles')}
      />

      {isFirstLaunch && (
        <TouchableOpacity style={styles.skipButton} onPress={handleClose}>
          <Text style={styles.skipButtonText}>{t('backup.skipRestore')}</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderPasswordStep = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>{t('backup.enterPassword')}</Text>
      <Text style={styles.stepDescription}>{t('backup.passwordDescription')}</Text>

      <TextInput
        style={styles.passwordInput}
        secureTextEntry
        placeholder={t('backup.passwordPlaceholder')}
        placeholderTextColor={colors.textMuted}
        value={password}
        onChangeText={(text) => {
          setPassword(text);
          if (error) setError(null);
        }}
        autoFocus
        accessibilityLabel={t('backup.passwordInput')}
      />

      {error && <Text style={styles.errorText}>{error}</Text>}

      <View style={styles.buttonRow}>
        <AppButton title={t('common.back')} onPress={() => setStep('file')} variant="secondary" />
        <AppButton
          title={t('common.continue')}
          onPress={handlePasswordSubmit}
          disabled={password.length < 8}
        />
      </View>
    </View>
  );

  const renderStrategyStep = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>{t('backup.selectStrategy')}</Text>
      <Text style={styles.stepDescription}>{t('backup.strategyDescription')}</Text>

      <View style={styles.strategyOptions}>
        <TouchableOpacity
          style={[styles.strategyOption, strategy === 'merge' && styles.strategyOptionSelected]}
          onPress={() => handleStrategySelect('merge')}
          accessibilityRole="radio"
          accessibilityState={{ selected: strategy === 'merge' }}>
          <Text style={styles.strategyTitle}>📥 {t('backup.strategy.merge')}</Text>
          <Text style={styles.strategyDesc}>{t('backup.strategy.mergeDesc')}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.strategyOption, strategy === 'replace' && styles.strategyOptionSelected]}
          onPress={() => handleStrategySelect('replace')}
          accessibilityRole="radio"
          accessibilityState={{ selected: strategy === 'replace' }}>
          <Text style={styles.strategyTitle}>🔄 {t('backup.strategy.replace')}</Text>
          <Text style={styles.strategyDesc}>{t('backup.strategy.replaceDesc')}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.strategyOption,
            strategy === 'newer-wins' && styles.strategyOptionSelected,
          ]}
          onPress={() => handleStrategySelect('newer-wins')}
          accessibilityRole="radio"
          accessibilityState={{ selected: strategy === 'newer-wins' }}>
          <Text style={styles.strategyTitle}>🕐 {t('backup.strategy.newerWins')}</Text>
          <Text style={styles.strategyDesc}>{t('backup.strategy.newerWinsDesc')}</Text>
        </TouchableOpacity>
      </View>

      {error && <Text style={styles.errorText}>{error}</Text>}

      <View style={styles.buttonRow}>
        <AppButton
          title={t('common.back')}
          onPress={() => setStep('password')}
          variant="secondary"
        />
        <AppButton title={t('backup.startRestore')} onPress={handleStartRestore} />
      </View>
    </View>
  );

  const renderConflictsStep = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>{t('backup.resolveConflicts')}</Text>
      <Text style={styles.stepDescription}>{t('backup.conflictsDescription')}</Text>

      <ScrollView style={styles.conflictsList}>
        {conflicts?.map(conflict => (
          <View key={conflict.id} style={styles.conflictItem}>
            <Text style={styles.conflictType}>
              {conflict.type === 'patient' ? '👤' : '📋'} {conflict.id.substring(0, 8)}
            </Text>
            <Text style={styles.conflictDates}>
              {t('backup.localDate')}: {new Date(conflict.localUpdatedAt).toLocaleDateString(i18n.language || 'de-DE')}
              {'\n'}
              {t('backup.backupDate')}: {new Date(conflict.backupUpdatedAt).toLocaleDateString(i18n.language || 'de-DE')}
            </Text>
            <View style={styles.conflictActions}>
              <TouchableOpacity
                style={[
                  styles.conflictButton,
                  conflictResolutions.get(conflict.id) === 'local' && styles.conflictButtonSelected,
                ]}
                onPress={() => handleConflictResolution(conflict.id, 'local')}>
                <Text style={styles.conflictButtonText}>{t('backup.keepLocal')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.conflictButton,
                  conflictResolutions.get(conflict.id) === 'backup' &&
                  styles.conflictButtonSelected,
                ]}
                onPress={() => handleConflictResolution(conflict.id, 'backup')}>
                <Text style={styles.conflictButtonText}>{t('backup.useBackup')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>

      <AppButton
        title={t('backup.applyResolutions')}
        onPress={handleApplyConflictResolutions}
        disabled={conflictResolutions.size !== conflicts?.length}
      />
    </View>
  );

  const renderProgressStep = () => (
    <View style={styles.stepContainer}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={styles.progressText}>{t('backup.restoring')}</Text>
    </View>
  );

  const renderResultStep = () => (
    <View style={styles.stepContainer}>
      {result?.success ? (
        <>
          <Text style={styles.successIcon}>✅</Text>
          <Text style={styles.resultTitle}>{t('backup.restoreComplete')}</Text>
          <Text style={styles.resultMessage}>{result.message}</Text>
        </>
      ) : (
        <>
          <Text style={styles.errorIcon}>❌</Text>
          <Text style={styles.resultTitle}>{t('backup.restoreFailed')}</Text>
          <Text style={styles.resultMessage}>{error}</Text>
        </>
      )}
      <AppButton title={t('common.close')} onPress={handleClose} />
    </View>
  );

  const renderCurrentStep = () => {
    switch (step) {
      case 'file':
        return renderFileStep();
      case 'password':
        return renderPasswordStep();
      case 'strategy':
        return renderStrategyStep();
      case 'conflicts':
        return renderConflictsStep();
      case 'progress':
        return renderProgressStep();
      case 'result':
        return renderResultStep();
      default:
        return null;
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>
            {isFirstLaunch ? t('backup.welcomeTitle') : t('backup.restoreTitle')}
          </Text>
          {!isLoading && step !== 'result' && (
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Progress indicator */}
        <View style={styles.progressIndicator}>
          {['file', 'password', 'strategy', 'result'].map((s, i) => (
            <View
              key={s}
              style={[
                styles.progressDot,
                ['file', 'password', 'strategy', 'conflicts', 'progress', 'result'].indexOf(step) >=
                i && styles.progressDotActive,
              ]}
            />
          ))}
        </View>

        {renderCurrentStep()}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
  },
  closeButton: {
    padding: spacing.sm,
  },
  closeButtonText: {
    fontSize: 24,
    color: colors.textMuted,
  },
  progressIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: spacing.xl,
    gap: spacing.sm,
  },
  progressDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.border,
  },
  progressDotActive: {
    backgroundColor: colors.primary,
  },
  stepContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  stepDescription: {
    fontSize: 14,
    color: colors.textMuted,
    marginBottom: spacing.xl,
    textAlign: 'center',
    lineHeight: 20,
  },
  passwordInput: {
    width: '100%',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.md,
    fontSize: 16,
    marginBottom: spacing.lg,
    color: colors.text,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  skipButton: {
    marginTop: spacing.xl,
    padding: spacing.md,
  },
  skipButtonText: {
    color: colors.textMuted,
    fontSize: 14,
  },
  strategyOptions: {
    width: '100%',
    gap: spacing.md,
  },
  strategyOption: {
    padding: spacing.lg,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
  },
  strategyOptionSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  strategyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  strategyDesc: {
    fontSize: 13,
    color: colors.textMuted,
  },
  errorText: {
    color: colors.danger,
    fontSize: 14,
    marginTop: spacing.md,
    textAlign: 'center',
  },
  conflictsList: {
    width: '100%',
    maxHeight: 300,
  },
  conflictItem: {
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  conflictType: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
  },
  conflictDates: {
    fontSize: 12,
    color: colors.textMuted,
    marginVertical: spacing.sm,
  },
  conflictActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  conflictButton: {
    flex: 1,
    padding: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  conflictButtonSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  conflictButtonText: {
    fontSize: 14,
    color: colors.text,
  },
  progressText: {
    fontSize: 16,
    color: colors.textMuted,
    marginTop: spacing.lg,
  },
  successIcon: {
    fontSize: 64,
    marginBottom: spacing.lg,
  },
  errorIcon: {
    fontSize: 64,
    marginBottom: spacing.lg,
  },
  resultTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.md,
  },
  resultMessage: {
    fontSize: 14,
    color: colors.textMuted,
    marginBottom: spacing.xl,
    textAlign: 'center',
  },
});

export default BackupRestoreDialog;
