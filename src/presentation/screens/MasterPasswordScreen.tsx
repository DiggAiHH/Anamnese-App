/**
 * MasterPasswordScreen - derive session encryption key
 *
 * Minimal demo-ready implementation:
 * - User enters a master password
 * - Key is derived locally via NativeEncryptionService (PBKDF2)
 * - Key is kept in-memory (Zustand) for the session
 */

import React, { useMemo, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Switch } from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import { useTranslation } from 'react-i18next';
import { PasswordGenerator } from '../../domain/services/PasswordGenerator';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { useQuestionnaireStore } from '../state/useQuestionnaireStore';
import { encryptionService } from '@infrastructure/encryption/encryptionService';
import { database } from '@infrastructure/persistence/DatabaseConnection';
import { EncryptedDataVO } from '@domain/value-objects/EncryptedData';
import {
  clearActiveEncryptionKey,
  getKeyOptIn,
  isSecureKeyStorageAvailable,
  setActiveEncryptionKey,
} from '@shared/keyManager';
import { AppButton } from '../components/AppButton';

type Props = NativeStackScreenProps<RootStackParamList, 'MasterPassword'>;

export const MasterPasswordScreen = ({ navigation, route }: Props): React.JSX.Element => {
  const { t } = useTranslation();
  const mode = route.params?.mode ?? 'setup';

  const { encryptionKey, setEncryptionKey, reset } = useQuestionnaireStore();

  const [password, setPassword] = useState('');
  const [isWorking, setIsWorking] = useState(false);
  const [rememberKey, setRememberKey] = useState(false);
  const [secureAvailable, setSecureAvailable] = useState(false);

  const handleGenerateAndCopy = (): void => {
    const generated = PasswordGenerator.generate(20);
    setPassword(generated);
    Clipboard.setString(generated);
    Alert.alert(t('masterPassword.generatedTitle'), t('masterPassword.generatedMessage'));
  };

  const handleCopy = (): void => {
    if (!password) return;
    Clipboard.setString(password);
    Alert.alert(t('masterPassword.copiedTitle'), t('masterPassword.copiedMessage'));
  };

  const title = useMemo(() => {
    return mode === 'unlock' ? t('masterPassword.titleUnlock') : t('masterPassword.titleSetup');
  }, [mode, t]);

  const verifyKeyAgainstExistingData = async (derivedKey: string): Promise<boolean> => {
    try {
      const db = await database.connect();
      const [patientResult] = await db.executeSql('SELECT encrypted_data FROM patients LIMIT 10;');

      const encryptedCandidates: string[] = [];
      const plaintextCandidates: string[] = [];

      if (patientResult?.rows && patientResult.rows.length > 0) {
        for (let i = 0; i < patientResult.rows.length; i++) {
          const row = patientResult.rows.item(i) as { encrypted_data?: unknown } | null;
          const raw = String(row?.encrypted_data ?? '').trim();
          if (!raw) continue;
          if (raw.startsWith('{')) {
            plaintextCandidates.push(raw);
          } else {
            encryptedCandidates.push(raw);
          }
        }
      }

      // If we have any encrypted patient data, the key must be able to decrypt at least one record.
      if (encryptedCandidates.length > 0) {
        for (const raw of encryptedCandidates) {
          try {
            const encrypted = EncryptedDataVO.fromString(raw);
            const decryptedJson = await encryptionService.decrypt(encrypted, derivedKey);
            JSON.parse(decryptedJson);
            return true;
          } catch {
            // try next
          }
        }
        return false;
      }

      // If only legacy plaintext patients exist, verify the key against at least one encrypted answer (if any).
      const [answerResult] = await db.executeSql(
        'SELECT encrypted_value FROM answers WHERE encrypted_value IS NOT NULL LIMIT 1;',
      );

      if (answerResult?.rows && answerResult.rows.length > 0) {
        const row = answerResult.rows.item(0) as { encrypted_value?: unknown } | null;
        const raw = String(row?.encrypted_value ?? '').trim();
        if (!raw) return true;

        const encrypted = EncryptedDataVO.fromString(raw);
        const decryptedJson = await encryptionService.decrypt(encrypted, derivedKey);
        JSON.parse(decryptedJson);
        return true;
      }

      // No encrypted data exists yet (fresh install / no answers) => any key is acceptable.
      // Still validate plaintext payload shape to guard against corrupted DB rows.
      for (const raw of plaintextCandidates) {
        JSON.parse(raw);
      }
      return true;
    } catch {
      return false;
    }
  };

  React.useEffect(() => {
    let mounted = true;
    const init = async () => {
      const available = await isSecureKeyStorageAvailable();
      const optedIn = await getKeyOptIn();
      if (!mounted) return;
      setSecureAvailable(available);
      setRememberKey(available ? optedIn : false);
    };
    init();
    return () => {
      mounted = false;
    };
  }, []);

  const handleContinue = async (): Promise<void> => {
    if (!password.trim()) {
      Alert.alert(t('common.error'), t('masterPassword.errorEmpty'));
      return;
    }

    setIsWorking(true);

    try {
      const derived = await encryptionService.deriveKey(password);

      if (mode === 'unlock') {
        const valid = await verifyKeyAgainstExistingData(derived.key);
        if (!valid) {
          Alert.alert(
            t('common.error'),
            t('masterPassword.errorWrongPassword', {
              defaultValue: 'Wrong password. Please try again.',
            }),
          );
          return;
        }
      }

      setEncryptionKey(derived.key);
      await setActiveEncryptionKey(derived.key, { persist: rememberKey });
      if (mode === 'unlock') {
        navigation.goBack();
      } else {
        navigation.replace('PatientInfo');
      }
    } catch (error) {
      Alert.alert(
        t('common.error'),
        error instanceof Error ? error.message : t('masterPassword.errorDerive'),
      );
    } finally {
      setIsWorking(false);
    }
  };

  return (
    <View style={styles.container} testID="master-password-screen">
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{t('masterPassword.subtitle')}</Text>

      <View style={styles.card}>
        <Text style={styles.label}>{t('masterPassword.label')}</Text>
        <View style={styles.passwordRow}>
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder={t('masterPassword.placeholder')}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            style={[styles.input, styles.passwordInput]}
            testID="input-master_password"
          />

          <TouchableOpacity
            style={styles.iconButton}
            onPress={handleGenerateAndCopy}
            accessibilityLabel={t('masterPassword.generate')}
            testID="btn-generate-password">
            <Text style={styles.iconEmoji}>🎲</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.iconButton, !password && styles.iconButtonDisabled]}
            onPress={handleCopy}
            disabled={!password}
            accessibilityLabel={t('masterPassword.copy')}
            testID="btn-copy-password">
            <Text style={styles.iconEmoji}>📋</Text>
          </TouchableOpacity>
        </View>

        <AppButton
          title={t('masterPassword.unlock')}
          onPress={() => {
            handleContinue();
          }}
          disabled={isWorking}
          loading={isWorking}
          testID="btn-continue"
          style={styles.primaryButton}
        />

        {!!encryptionKey && (
          <AppButton
            title={t('masterPassword.resetSession')}
            variant="secondary"
            onPress={() => {
              reset();
              setPassword('');
              void clearActiveEncryptionKey({ removePersisted: true });
              Alert.alert(t('masterPassword.resetTitle'), t('masterPassword.resetMessage'));
            }}
            testID="btn-reset-session"
          />
        )}
      </View>

      <View style={styles.rememberRow}>
        <View style={styles.rememberTextWrap}>
          <Text style={styles.rememberTitle}>{t('masterPassword.rememberKey')}</Text>
          <Text style={styles.rememberHint}>
            {secureAvailable
              ? t('masterPassword.rememberKeyHint')
              : t('masterPassword.rememberKeyUnavailable')}
          </Text>
        </View>
        <Switch
          value={rememberKey}
          onValueChange={next => {
            if (!secureAvailable && next) {
              Alert.alert(t('common.error'), t('masterPassword.rememberKeyUnavailable'));
              return;
            }
            setRememberKey(next);
          }}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 16,
    lineHeight: 20,
  },
  card: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    color: '#111827',
    marginBottom: 12,
  },
  passwordRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  passwordInput: {
    flex: 1,
    marginBottom: 0,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconButtonDisabled: {
    opacity: 0.6,
  },
  iconEmoji: {
    fontSize: 18,
    color: '#2563eb',
  },
  primaryButton: {
    marginBottom: 10,
  },
  rememberRow: {
    marginTop: 16,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  rememberTextWrap: {
    flex: 1,
  },
  rememberTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  rememberHint: {
    fontSize: 12,
    color: '#6b7280',
  },
});
