/**
 * ExportScreen - minimal UI to trigger ExportGDTUseCase
 * ISO/WCAG: Token-based design system
 */

import React, { useMemo, useState } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { colors, spacing, radius } from '../theme/tokens';
import { Card } from '../components/Card';
import { AppButton } from '../components/AppButton';
import { AppText } from '../components/AppText';

import { ExportGDTUseCase } from '@application/use-cases/ExportGDTUseCase';
import { ExportAnonymizedUseCase } from '@application/use-cases/ExportAnonymizedUseCase';
import { SQLitePatientRepository } from '@infrastructure/persistence/SQLitePatientRepository';
import { SQLiteQuestionnaireRepository } from '@infrastructure/persistence/SQLiteQuestionnaireRepository';
import { SQLiteAnswerRepository } from '@infrastructure/persistence/SQLiteAnswerRepository';
import { SQLiteGDPRConsentRepository } from '@infrastructure/persistence/SQLiteGDPRConsentRepository';
import { database } from '@infrastructure/persistence/DatabaseConnection';
import { useQuestionnaireStore } from '../state/useQuestionnaireStore';
import { reportUserError } from '../../shared/userFacingError';
import { supportsShare } from '@shared/platformCapabilities';

type Props = NativeStackScreenProps<RootStackParamList, 'Export'>;

export const ExportScreen = ({ route, navigation }: Props): React.JSX.Element => {
  const { t } = useTranslation();
  const { questionnaireId } = route.params;
  const { patient, encryptionKey } = useQuestionnaireStore();

  const [senderId, setSenderId] = useState('PRAXIS01');
  const [receiverId, setReceiverId] = useState('');
  const [gdtVersion, setGdtVersion] = useState<'2.1' | '3.0'>('3.0');
  const [isWorking, setIsWorking] = useState(false);
  const showError = (title: string, message: string, error?: unknown) => {
    reportUserError({ title, message, error });
  };

  const canExport = useMemo(() => {
    return !!patient && !!encryptionKey && !!senderId.trim();
  }, [patient, encryptionKey, senderId]);

  const handleExport = async (): Promise<void> => {
    if (!patient || !encryptionKey) {
      Alert.alert(t('common.error'), t('export.missingPatientOrKey'));
      return;
    }

    if (!senderId.trim()) {
      Alert.alert(t('common.error'), t('export.missingSenderId'));
      return;
    }

    setIsWorking(true);

    try {
      const useCase = new ExportGDTUseCase(
        new SQLitePatientRepository(),
        new SQLiteQuestionnaireRepository(),
        new SQLiteAnswerRepository(),
        new SQLiteGDPRConsentRepository(database),
      );

      const result = await useCase.execute({
        patientId: patient.id,
        questionnaireId,
        encryptionKey,
        senderId: senderId.trim(),
        receiverId: receiverId.trim() || undefined,
        gdtVersion,
      });

      if (!result.success) {
        if (result.error === 'GDT export consent not granted') {
          Alert.alert(
            t('export.failedTitle'),
            t('export.consentMissing', {
              defaultValue:
                'Bitte aktivieren Sie die Einwilligung für den GDT-Export in den Datenschutz-Einstellungen.',
            }),
            [
              { text: t('common.cancel', { defaultValue: 'Abbrechen' }), style: 'cancel' },
              {
                text: t('export.openConsents', { defaultValue: 'Einwilligungen öffnen' }),
                onPress: () => navigation.navigate('GDPRConsent'),
              },
            ],
          );
          return;
        }
        showError(t('export.failedTitle'), result.error ?? t('common.unknownError'));
        return;
      }

      const filePath = result.filePath;

      Alert.alert(t('export.successTitle'), t('export.successMessage', { path: filePath }));

      if (supportsShare && filePath) {
        try {
          // eslint-disable-next-line @typescript-eslint/no-var-requires
          const Share = require('react-native-share') as {
            open?: (options: {
              url: string;
              type?: string;
              filename?: string;
              message?: string;
            }) => Promise<unknown>;
          };

          const url = filePath.startsWith('file://') ? filePath : `file://${filePath}`;
          await Share?.open?.({
            url,
            type: 'text/plain',
            filename: 'anamnese.gdt',
            message: t('export.shareMessage', { defaultValue: 'GDT-Datei teilen' }),
          });
        } catch {
          // Ignore share failures; file was still created.
        }
      }

      navigation.popToTop();
    } catch (error) {
      showError(
        t('common.error'),
        error instanceof Error ? error.message : t('common.unknownError'),
        error,
      );
    } finally {
      setIsWorking(false);
    }
  };

  const handleAnonymizedExport = async (): Promise<void> => {
    if (!patient || !encryptionKey) return;
    setIsWorking(true);
    try {
      const useCase = new ExportAnonymizedUseCase(
        new SQLitePatientRepository(),
        new SQLiteQuestionnaireRepository(),
        new SQLiteAnswerRepository()
      );

      const result = await useCase.execute({
        patientId: patient.id,
        questionnaireId,
        encryptionKey
      });

      if (result.success && result.filePath) {
        Alert.alert(t('export.successTitle'), t('export.anonSuccessMessage', { defaultValue: 'Anonymized export saved:\n' }) + result.filePath);

        if (supportsShare) {
          // eslint-disable-next-line @typescript-eslint/no-var-requires
          const Share = require('react-native-share');
          await Share.open({
            url: `file://${result.filePath}`,
            type: 'application/json',
            filename: 'anamnese_anon.json',
            message: t('export.shareAnonMessage', { defaultValue: 'Anonymized Data' })
          });
        }
      } else {
        showError(t('common.error'), result.error ?? 'Unknown error');
      }

    } catch (e) {
      showError(t('common.error'), e instanceof Error ? e.message : 'Error');
    } finally {
      setIsWorking(false);
    }
  };

  const handleTextExport = async () => {
    // Just share the plain text summary (reusing logic from SummaryScreen usually, but here simplified)
    // For now, let's just alert that this is available in Summary
    Alert.alert(t('common.info'), t('export.textHint', { defaultValue: 'For plain text, please use the "Copy" button on the Summary screen.' }));
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      testID="export-screen"
      accessibilityRole="scrollbar"
      accessibilityLabel={t('export.title')}>
      <AppText style={styles.title} accessibilityRole="header">
        {t('export.title')}
      </AppText>
      <AppText style={styles.subtitle}>{t('export.subtitle', { id: questionnaireId })}</AppText>

      <Card>
        <AppText style={styles.label}>{t('export.senderIdLabel')}</AppText>
        <TextInput
          value={senderId}
          onChangeText={setSenderId}
          style={styles.input}
          autoCapitalize="characters"
          testID="input-sender-id"
          accessibilityLabel={t('export.senderIdLabel')}
        />

        <AppText style={styles.label}>{t('export.receiverIdLabel')}</AppText>
        <TextInput
          value={receiverId}
          onChangeText={setReceiverId}
          style={styles.input}
          autoCapitalize="characters"
          testID="input-receiver-id"
          accessibilityLabel={t('export.receiverIdLabel')}
        />
      </Card>

      <View style={styles.spacer} />

      <View style={styles.row}>
        <TouchableOpacity
          style={[styles.chip, gdtVersion === '2.1' && styles.chipSelected]}
          onPress={() => setGdtVersion('2.1')}
          testID="chip-2-1"
          accessibilityRole="radio"
          accessibilityState={{ selected: gdtVersion === '2.1' }}>
          <AppText style={[styles.chipText, gdtVersion === '2.1' && styles.chipTextSelected]}>
            {t('export.gdtVersion21')}
          </AppText>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.chip, gdtVersion === '3.0' && styles.chipSelected]}
          onPress={() => setGdtVersion('3.0')}
          testID="chip-3-0"
          accessibilityRole="radio"
          accessibilityState={{ selected: gdtVersion === '3.0' }}>
          <AppText style={[styles.chipText, gdtVersion === '3.0' && styles.chipTextSelected]}>
            {t('export.gdtVersion30')}
          </AppText>
        </TouchableOpacity>
      </View>

      <AppButton
        variant="primary"
        title={isWorking ? '' : t('export.run')}
        onPress={handleExport}
        disabled={!canExport || isWorking}
        testID="btn-run-export"
        loading={isWorking}
      />

      <AppButton
        variant="primary"
        title={isWorking ? '' : t('export.run', { defaultValue: 'Export GDT (Practice)' })}
        onPress={handleExport}
        disabled={!canExport || isWorking}
        testID="btn-run-export"
        loading={isWorking && gdtVersion !== '3.0'} // Just a visual hack, better to track separate loading states
      />

      <View style={styles.divider} />

      <AppText style={styles.sectionHeader}>{t('export.otherOptions', { defaultValue: 'Other Formats' })}</AppText>

      <AppButton
        variant="secondary"
        title={t('export.runAnon', { defaultValue: 'Export Anonymized (JSON)' })}
        onPress={handleAnonymizedExport}
        disabled={!patient || !encryptionKey || isWorking}
        style={{ marginBottom: spacing.sm }}
      />

      <AppButton
        variant="secondary"
        title={t('export.runText', { defaultValue: 'Plain Text (Summary)' })}
        onPress={handleTextExport}
      />

      <AppText style={styles.hint}>{t('export.hint')}</AppText>
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
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: 13,
    color: colors.textMuted,
    marginBottom: spacing.md,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  input: {
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  chip: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: 999,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    backgroundColor: colors.surface,
  },
  chipSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.infoSurface,
  },
  chipText: {
    color: colors.textSecondary,
    fontWeight: '600',
  },
  chipTextSelected: {
    color: colors.infoText,
  },
  hint: {
    marginTop: spacing.sm,
    fontSize: 12,
    color: colors.textMuted,
    lineHeight: 18,
  },
  divider: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginVertical: spacing.lg,
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: spacing.md,
    color: colors.text,
  },
  spacer: {
    height: spacing.lg,
  },
});
