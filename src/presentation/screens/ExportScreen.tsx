/**
 * ExportScreen - minimal UI to trigger ExportGDTUseCase
 * ISO/WCAG: Token-based design system
 */

import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
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

import { ExportGDTUseCase } from '@application/use-cases/ExportGDTUseCase';
import { SQLitePatientRepository } from '@infrastructure/persistence/SQLitePatientRepository';
import { SQLiteQuestionnaireRepository } from '@infrastructure/persistence/SQLiteQuestionnaireRepository';
import { SQLiteAnswerRepository } from '@infrastructure/persistence/SQLiteAnswerRepository';
import { SQLiteGDPRConsentRepository } from '@infrastructure/persistence/SQLiteGDPRConsentRepository';
import { database } from '@infrastructure/persistence/DatabaseConnection';
import { useQuestionnaireStore } from '../state/useQuestionnaireStore';
import { reportUserError } from '../../shared/userFacingError';

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
        showError(t('export.failedTitle'), result.error ?? t('common.unknownError'));
        return;
      }

      Alert.alert(
        t('export.successTitle'),
        t('export.successMessage', { path: result.filePath }),
      );
      navigation.popToTop();
    } catch (error) {
      showError(t('common.error'), error instanceof Error ? error.message : t('common.unknownError'), error);
    } finally {
      setIsWorking(false);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      testID="export-screen"
      accessibilityRole="scrollbar"
      accessibilityLabel={t('export.title')}>
      <Text style={styles.title} accessibilityRole="header">
        {t('export.title')}
      </Text>
      <Text style={styles.subtitle}>
        {t('export.subtitle', { id: questionnaireId })}
      </Text>

      <Card>
        <Text style={styles.label}>{t('export.senderIdLabel')}</Text>
        <TextInput
          value={senderId}
          onChangeText={setSenderId}
          style={styles.input}
          autoCapitalize="characters"
          testID="input-sender-id"
          accessibilityLabel={t('export.senderIdLabel')}
        />

        <Text style={styles.label}>{t('export.receiverIdLabel')}</Text>
        <TextInput
          value={receiverId}
          onChangeText={setReceiverId}
          style={styles.input}
          autoCapitalize="characters"
          testID="input-receiver-id"
          accessibilityLabel={t('export.receiverIdLabel')}
        />

        <View style={styles.row}>
          <TouchableOpacity
            style={[styles.chip, gdtVersion === '2.1' && styles.chipSelected]}
            onPress={() => setGdtVersion('2.1')}
            testID="chip-2-1"
            accessibilityRole="radio"
            accessibilityState={{ selected: gdtVersion === '2.1' }}>
            <Text style={[styles.chipText, gdtVersion === '2.1' && styles.chipTextSelected]}>
              {t('export.gdtVersion21')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.chip, gdtVersion === '3.0' && styles.chipSelected]}
            onPress={() => setGdtVersion('3.0')}
            testID="chip-3-0"
            accessibilityRole="radio"
            accessibilityState={{ selected: gdtVersion === '3.0' }}>
            <Text style={[styles.chipText, gdtVersion === '3.0' && styles.chipTextSelected]}>
              {t('export.gdtVersion30')}
            </Text>
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

        <Text style={styles.hint}>{t('export.hint')}</Text>
      </Card>
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
});
