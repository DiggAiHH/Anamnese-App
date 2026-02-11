/**
 * LoginScreen - Secure authentication for therapists and patients
 *
 * @security PBKDF2 password hashing. Brute-force protection with lockout.
 * @gdpr No PII logged. Email used as identifier only.
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import type { StackScreenProps } from '@react-navigation/stack';
import { AppText } from '../components/AppText';
import { AppInput } from '../components/AppInput';
import { AppButton } from '../components/AppButton';
import { useTheme } from '../theme/ThemeContext';
import { useAuthStore } from '../state/useAuthStore';
import { AuthService } from '../../application/services/AuthService';
import { createUserRepoSync, createAppointmentRepoSync } from '../../infrastructure/persistence/RepositoryFactory';
import { encryptionService } from '../../infrastructure/encryption/encryptionService';
import { seedDemoData, DEMO_CREDENTIALS } from '../../infrastructure/persistence/DemoDataSeeder';
import { colors, spacing, radius } from '../theme/tokens';
import { ScreenContainer } from '../components/ScreenContainer';
import type { RootStackParamList } from '../navigation/RootNavigator';

type Props = StackScreenProps<RootStackParamList, 'Login'>;

// Platform-aware repository (localStorage on web, InMemory on native)
const userRepo = createUserRepoSync();
const appointmentRepo = createAppointmentRepoSync();
const authService = new AuthService(userRepo);

export { authService, userRepo };

export const LoginScreen = ({ navigation }: Props): React.JSX.Element => {
  const { t } = useTranslation();
  const { isHighContrast } = useTheme();
  const setAuth = useAuthStore(s => s.setAuth);
  const setPending2FA = useAuthStore(s => s.setPending2FA);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const isSubmittingRef = useRef(false);

  // Seed demo data on first mount (non-blocking)
  useEffect(() => {
    seedDemoData(userRepo, appointmentRepo).catch(() => {});
  }, []);

  const handleLogin = async (): Promise<void> => {
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;

    try {
      if (!email.trim() || !password) {
        Alert.alert(
          t('common.error'),
          t('auth.fillAllFields', { defaultValue: 'Bitte füllen Sie alle Felder aus.' }),
        );
        return;
      }

      // Email format validation
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
        Alert.alert(
          t('common.error'),
          t('auth.invalidEmail', { defaultValue: 'Bitte geben Sie eine gültige E-Mail-Adresse ein.' }),
        );
        return;
      }

      setIsLoading(true);
      const result = await authService.login(email.trim().toLowerCase(), password);

      if (!result.success) {
        Alert.alert(t('common.error'), t(result.error || 'auth.loginFailed'));
        return;
      }

      if (result.requires2FA && result.user) {
        // Derive encryption key from password before navigating (needed for encrypted notes)
        const derived = await encryptionService.deriveKey(password);
        setPending2FA(result.user.id, result.user.role, result.user.displayName, derived.key);
        navigation.navigate('TwoFactor', { userId: result.user.id });
        return;
      }

      if (result.user && result.sessionToken) {
        // Derive encryption key from password for session use
        const derived = await encryptionService.deriveKey(password);
        setAuth(result.user.id, result.user.role, result.user.displayName, result.sessionToken, derived.key);
        navigation.navigate('TherapistDashboard');
      }
    } catch (error) {
      Alert.alert(t('common.error'), t('auth.loginFailed'));
    } finally {
      setIsLoading(false);
      isSubmittingRef.current = false;
    }
  };

  const handleRegister = async (): Promise<void> => {
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;

    try {
      if (!email.trim() || !password || !displayName.trim()) {
        Alert.alert(t('common.error'), t('auth.fillAllFields'));
        return;
      }

      // Email format validation
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
        Alert.alert(
          t('common.error'),
          t('auth.invalidEmail', { defaultValue: 'Bitte geben Sie eine gültige E-Mail-Adresse ein.' }),
        );
        return;
      }

      // Password strength: min 8 chars, at least 1 uppercase, 1 lowercase, 1 digit
      if (password.length < 8 || !/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/\d/.test(password)) {
        Alert.alert(
          t('common.error'),
          t('auth.weakPassword', {
            defaultValue: 'Das Passwort muss mindestens 8 Zeichen lang sein und Groß-/Kleinbuchstaben sowie eine Zahl enthalten.',
          }),
        );
        return;
      }

      setIsLoading(true);
      const result = await authService.register(
        'therapist',
        email.trim().toLowerCase(),
        password,
        displayName.trim(),
      );

      if (!result.success) {
        Alert.alert(t('common.error'), t(result.error || 'auth.registrationFailed'));
        return;
      }

      Alert.alert(
        t('auth.registrationSuccess', { defaultValue: 'Registrierung erfolgreich' }),
        t('auth.registrationSuccessMessage', {
          defaultValue: 'Sie können sich jetzt einloggen. Richten Sie 2FA in den Einstellungen ein.',
        }),
      );
      setIsRegisterMode(false);
    } catch (error) {
      Alert.alert(t('common.error'), t('auth.registrationFailed'));
    } finally {
      setIsLoading(false);
      isSubmittingRef.current = false;
    }
  };

  return (
    <ScreenContainer testID="login-screen" accessibilityLabel="Login">
    <KeyboardAvoidingView
      style={styles.keyboardView}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={[styles.container, isHighContrast && styles.containerHC]}>
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <AppText variant="h1" style={[styles.title, isHighContrast && styles.textHC]}>
              {isRegisterMode
                ? t('auth.registerTitle', { defaultValue: 'Konto erstellen' })
                : t('auth.loginTitle', { defaultValue: 'Anmelden' })}
            </AppText>
            <AppText style={[styles.subtitle, isHighContrast && styles.textHC]}>
              {isRegisterMode
                ? t('auth.registerSubtitle', { defaultValue: 'Erstellen Sie Ihr Therapeuten-Konto.' })
                : t('auth.loginSubtitle', { defaultValue: 'Melden Sie sich sicher an.' })}
            </AppText>
          </View>

          <View style={styles.form}>
            {isRegisterMode && (
              <AppInput
                label={t('auth.displayName', { defaultValue: 'Anzeigename' })}
                required
                value={displayName}
                onChangeText={setDisplayName}
                placeholder={t('auth.displayNamePlaceholder', { defaultValue: 'Dr. Max Mustermann' })}
                autoCapitalize="words"
                testID="input-display-name"
              />
            )}

            <AppInput
              label={t('auth.email', { defaultValue: 'E-Mail' })}
              required
              value={email}
              onChangeText={setEmail}
              placeholder="therapist@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              testID="input-email"
            />

            <AppInput
              label={t('auth.password', { defaultValue: 'Passwort' })}
              required
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              secureTextEntry
              testID="input-password"
            />
          </View>

          <View style={styles.actions}>
            <AppButton
              title={
                isRegisterMode
                  ? t('auth.register', { defaultValue: 'Registrieren' })
                  : t('auth.login', { defaultValue: 'Anmelden' })
              }
              onPress={isRegisterMode ? handleRegister : handleLogin}
              disabled={isLoading}
              loading={isLoading}
              testID="btn-auth-submit"
            />

            <AppButton
              title={
                isRegisterMode
                  ? t('auth.switchToLogin', { defaultValue: 'Bereits registriert? Anmelden' })
                  : t('auth.switchToRegister', { defaultValue: 'Neues Konto erstellen' })
              }
              variant="tertiary"
              onPress={() => setIsRegisterMode(!isRegisterMode)}
              testID="btn-auth-toggle"
            />

            <AppButton
              title={t('auth.continueAsPatient', { defaultValue: 'Als Patient fortfahren' })}
              variant="secondary"
              onPress={() => navigation.navigate('RoleSelection')}
              testID="btn-continue-patient"
            />

            <AppButton
              title={t('auth.demoLogin', { defaultValue: '🔑 Demo-Login (Schnellstart)' })}
              variant="ghost"
              onPress={() => {
                setEmail(DEMO_CREDENTIALS.email);
                setPassword(DEMO_CREDENTIALS.password);
              }}
              testID="btn-demo-login"
            />
          </View>

          <View style={styles.securityInfo}>
            <AppText style={styles.securityText}>
              🔒 {t('auth.securityInfo', {
                defaultValue:
                  'Ihre Zugangsdaten werden mit PBKDF2 verschlüsselt. Aktivieren Sie 2FA für zusätzliche Sicherheit.',
              })}
            </AppText>
          </View>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  keyboardView: { flex: 1 },
  container: { flex: 1, backgroundColor: colors.background },
  containerHC: { backgroundColor: '#000' },
  scroll: { flex: 1 },
  scrollContent: { padding: spacing.lg, paddingBottom: spacing.xl },
  header: { marginBottom: spacing.xl, alignItems: 'center' },
  title: { marginBottom: spacing.sm, textAlign: 'center' },
  subtitle: { fontSize: 16, color: colors.textMuted, textAlign: 'center' },
  textHC: { color: '#fff' },
  form: { gap: spacing.lg, marginBottom: spacing.xl },
  actions: { gap: spacing.md },
  securityInfo: {
    backgroundColor: colors.infoSurface || '#E3F2FD',
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.xl,
  },
  securityText: { fontSize: 13, color: colors.textMuted, lineHeight: 20 },
});
