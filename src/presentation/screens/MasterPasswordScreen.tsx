/**
 * MasterPasswordScreen - derive session encryption key
 *
 * Minimal demo-ready implementation:
 * - User enters a master password
 * - Key is derived locally via NativeEncryptionService (PBKDF2)
 * - Key is kept in-memory (Zustand) for the session
 */

import React, { useMemo, useRef, useState } from 'react';
import { View, StyleSheet, Alert, Switch, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import { useTranslation } from 'react-i18next';
import { PasswordGenerator } from '../../domain/services/PasswordGenerator';
import { usePatientContext } from '../../application/PatientContext';
import { UserRole } from '../../domain/entities/UserRole';
import { AppText } from '../components/AppText';
import type { StackScreenProps } from '@react-navigation/stack';
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
import { colors, spacing } from '../theme/tokens';
import { bruteForceProtection } from '@shared/bruteForceProtection';
import { AppButton } from '../components/AppButton';
import { AppInput } from '../components/AppInput';
import { IconButton } from '../components/IconButton';
import { ScreenContainer } from '../components/ScreenContainer';

type Props = StackScreenProps<RootStackParamList, 'MasterPassword'>;

export const MasterPasswordScreen = ({ navigation, route }: Props): React.JSX.Element => {
  const { t } = useTranslation();
  const mode = route.params?.mode ?? 'setup';

  const isDev = typeof __DEV__ !== 'undefined' && __DEV__;

  const { encryptionKey, setEncryptionKey, reset } = useQuestionnaireStore();
  const { userRole } = usePatientContext();

  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isWorking, setIsWorking] = useState(false);
  const [rememberKey, setRememberKey] = useState(false);
  const [secureAvailable, setSecureAvailable] = useState(false);
  const [_lockoutSeconds, setLockoutSeconds] = useState(0);

  // Ref guard to prevent double-tap race condition (state update is async)
  const isSubmittingRef = useRef(false);
  // Ref for brute-force countdown interval (cleanup on unmount — M-5 fix)
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Ref for clipboard auto-clear timer (cleanup on unmount — Phase 2 fix)
  const clipboardTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cleanup timers on unmount to prevent timer leak
  React.useEffect(() => {
    return () => {
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
        countdownRef.current = null;
      }
      if (clipboardTimerRef.current) {
        clearTimeout(clipboardTimerRef.current);
        clipboardTimerRef.current = null;
      }
    };
  }, []);

  const copyToClipboard = (value: string): void => {
    Clipboard.setString(value);
    if (clipboardTimerRef.current) {
      clearTimeout(clipboardTimerRef.current);
    }
    clipboardTimerRef.current = setTimeout(() => Clipboard.setString(''), 30000);
  };

  const handleGenerateAndCopy = (): void => {
    if (!isDev) {
      Alert.alert(
        t('common.error'),
        t('masterPassword.clipboardDisabled', {
          defaultValue: 'Clipboard copying is disabled for security reasons.',
        }),
      );
      return;
    }
    const generated = PasswordGenerator.generate(20);
    setPassword(generated);
    copyToClipboard(generated);
    Alert.alert(t('masterPassword.generatedTitle'), t('masterPassword.generatedMessage'));
  };

  const handleCopy = (): void => {
    if (!password) return;
    if (!isDev) {
      Alert.alert(
        t('common.error'),
        t('masterPassword.clipboardDisabled', {
          defaultValue: 'Clipboard copying is disabled for security reasons.',
        }),
      );
      return;
    }
    copyToClipboard(password);
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
    // Double-tap guard: ref is synchronous, prevents race condition
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;

    if (!password.trim()) {
      setError(t('masterPassword.errorEmpty'));
      isSubmittingRef.current = false;
      return;
    }

    // BSI ORP.4: Brute-force protection check
    const { allowed, state: bfState } = bruteForceProtection.canAttempt();
    if (!allowed) {
      if (bfState.isLocked) {
        Alert.alert(
          t('common.error'),
          t('masterPassword.errorLocked', {
            defaultValue: 'Zu viele Fehlversuche. Bitte starten Sie die App neu.',
          }),
        );
      } else {
        const seconds = Math.ceil(bfState.remainingLockoutMs / 1000);
        setLockoutSeconds(seconds);
        setError(
          t('masterPassword.errorBackoff', {
            defaultValue: `Bitte warten Sie {{seconds}} Sekunden.`,
            seconds,
          }),
        );
        // Countdown timer (store ref for cleanup on unmount)
        if (countdownRef.current) clearInterval(countdownRef.current);
        countdownRef.current = setInterval(() => {
          const { state: s } = bruteForceProtection.canAttempt();
          const remaining = Math.ceil(s.remainingLockoutMs / 1000);
          setLockoutSeconds(remaining);
          if (remaining <= 0) {
            if (countdownRef.current) clearInterval(countdownRef.current);
            countdownRef.current = null;
            setError(null);
          }
        }, 1000);
      }
      isSubmittingRef.current = false;
      return;
    }

    setIsWorking(true);

    try {
      const derived = await encryptionService.deriveKey(password);

      if (mode === 'unlock') {
        const valid = await verifyKeyAgainstExistingData(derived.key);
        if (!valid) {
          // BSI ORP.4: Record failed attempt
          const failState = bruteForceProtection.recordFailure();
          if (failState.isLocked) {
            Alert.alert(
              t('common.error'),
              t('masterPassword.errorLocked', {
                defaultValue: 'Zu viele Fehlversuche. Bitte starten Sie die App neu.',
              }),
            );
          } else if (failState.remainingLockoutMs > 0) {
            const seconds = Math.ceil(failState.remainingLockoutMs / 1000);
            setLockoutSeconds(seconds);
            Alert.alert(
              t('common.error'),
              t('masterPassword.errorWrongPasswordBackoff', {
                defaultValue: `Falsches Passwort. Bitte warten Sie {{seconds}} Sekunden.`,
                seconds,
              }),
            );
          } else {
            Alert.alert(
              t('common.error'),
              t('masterPassword.errorWrongPassword', {
                defaultValue: 'Wrong password. Please try again.',
              }),
            );
          }
          isSubmittingRef.current = false;
          return;
        }
      }

      // BSI ORP.4: Record successful authentication
      bruteForceProtection.recordSuccess();
      setLockoutSeconds(0);

      setEncryptionKey(derived.key);
      await setActiveEncryptionKey(derived.key, { persist: rememberKey });
      if (mode === 'unlock') {
        if (userRole === UserRole.DOCTOR) {
          navigation.navigate('PatientStatus');
        } else {
          navigation.goBack();
        }
      } else {
        // After setup, navigate to VisitReason to continue the onboarding flow
        navigation.replace('VisitReason');
      }
    } catch (error) {
      Alert.alert(
        t('common.error'),
        error instanceof Error ? error.message : t('masterPassword.errorDerive'),
      );
    } finally {
      setIsWorking(false);
      isSubmittingRef.current = false;
    }
  };

  if (Platform.OS === 'windows') {
    return (
      <ScreenContainer testID="master-password-screen" accessibilityLabel="Master Password">
      <View style={styles.container}>
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.contentContainer}
          keyboardShouldPersistTaps="handled"
          testID="master-password-screen">
          <AppText style={styles.title}>{title}</AppText>
          <AppText style={styles.subtitle}>{t('masterPassword.subtitle')}</AppText>

          <View style={styles.card}>
            <AppInput
              label={t('masterPassword.label')}
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                if (error) setError(null);
              }}
              placeholder={t('masterPassword.placeholder')}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              error={error ?? undefined}
              testID="input-master_password"
              onSubmitEditing={() => {
                void handleContinue();
              }}
              returnKeyType="go"
            />

            <View style={styles.actionRow}>
              <IconButton
                icon={<AppText style={styles.iconEmoji}>🎲</AppText>}
                onPress={handleGenerateAndCopy}
                testID="btn-generate-password"
              />
              <IconButton
                icon={<AppText style={styles.iconEmoji}>📋</AppText>}
                onPress={handleCopy}
                disabled={!password}
                testID="btn-copy-password"
              />
            </View>

            <AppButton
              title={t('masterPassword.unlock')}
              onPress={() => {
                void handleContinue();
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
              <AppText style={styles.rememberTitle}>{t('masterPassword.rememberKey')}</AppText>
              <AppText style={styles.rememberHint}>
                {secureAvailable
                  ? t('masterPassword.rememberKeyHint')
                  : t('masterPassword.rememberKeyUnavailable')}
              </AppText>
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
        </ScrollView>
      </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer testID="master-password-screen" accessibilityLabel="Master Password">
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.keyboardAvoidingView}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        keyboardShouldPersistTaps="handled"
        testID="master-password-screen">
        <AppText style={styles.title}>{title}</AppText>
        <AppText style={styles.subtitle}>{t('masterPassword.subtitle')}</AppText>

        <View style={styles.card}>
          <AppInput
            label={t('masterPassword.label')}
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              if (error) setError(null);
            }}
            placeholder={t('masterPassword.placeholder')}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            error={error ?? undefined}
            testID="input-master_password"
            onSubmitEditing={() => {
              void handleContinue();
            }}
            returnKeyType="go"
          />

          <View style={styles.actionRow}>
            <IconButton
              icon={<AppText style={styles.iconEmoji}>🎲</AppText>}
              onPress={handleGenerateAndCopy}
              testID="btn-generate-password"
            />
            <IconButton
              icon={<AppText style={styles.iconEmoji}>📋</AppText>}
              onPress={handleCopy}
              disabled={!password}
              testID="btn-copy-password"
            />
          </View>

          <AppButton
            title={t('masterPassword.unlock')}
            onPress={() => {
              void handleContinue();
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
            <AppText style={styles.rememberTitle}>{t('masterPassword.rememberKey')}</AppText>
            <AppText style={styles.rememberHint}>
              {secureAvailable
                ? t('masterPassword.rememberKeyHint')
                : t('masterPassword.rememberKeyUnavailable')}
            </AppText>
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
      </ScrollView>
    </KeyboardAvoidingView>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  keyboardAvoidingView: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  contentContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: spacing.xl,
    // Add extra padding at bottom for keyboard safety
    paddingBottom: spacing.xxl * 2,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textMuted,
    marginBottom: 16,
    lineHeight: 20,
  },
  card: {
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 8,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
    justifyContent: 'flex-start',
  },
  primaryButton: {
    marginBottom: 10,
  },
  iconEmoji: {
    fontSize: 18,
    color: colors.primary,
  },
  rememberRow: {
    marginTop: 16,
    padding: 12,
    borderRadius: 8,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
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
    color: colors.text,
    marginBottom: 4,
  },
  rememberHint: {
    fontSize: 12,
    color: colors.textMuted,
  },
  // High Contrast
  textHighContrast: { color: '#ffffff' },
  textHighContrastInverse: { color: '#000000' },
  bgHighContrast: { backgroundColor: '#000000' },
  surfaceHighContrast: { backgroundColor: '#ffffff' },
});
