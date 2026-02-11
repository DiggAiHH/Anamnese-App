/**
 * TwoFactorScreen - TOTP 2FA verification
 *
 * @security 6-digit TOTP code verification with ±30s window.
 * @gdpr No PII logged.
 */

import React, { useState, useRef } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { StackScreenProps } from '@react-navigation/stack';
import { AppText } from '../components/AppText';
import { AppInput } from '../components/AppInput';
import { AppButton } from '../components/AppButton';
import { ScreenContainer } from '../components/ScreenContainer';
import { useTheme } from '../theme/ThemeContext';
import { useAuthStore } from '../state/useAuthStore';
import { authService } from './LoginScreen';
import { colors, spacing, radius } from '../theme/tokens';
import type { RootStackParamList } from '../navigation/RootNavigator';

type Props = StackScreenProps<RootStackParamList, 'TwoFactor'>;

export const TwoFactorScreen = ({ navigation, route }: Props): React.JSX.Element => {
  const { t } = useTranslation();
  const { isHighContrast } = useTheme();
  const complete2FA = useAuthStore(s => s.complete2FA);

  const [code, setCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const isSubmittingRef = useRef(false);

  const handleVerify = async (): Promise<void> => {
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;

    try {
      if (code.length !== 6) {
        Alert.alert(
          t('common.error'),
          t('auth.invalidCodeLength', { defaultValue: 'Bitte geben Sie den 6-stelligen Code ein.' }),
        );
        return;
      }

      setIsVerifying(true);
      const result = await authService.verify2FA(route.params.userId, code);

      if (!result.success) {
        Alert.alert(t('common.error'), t(result.error || 'auth.invalid2FACode'));
        setCode('');
        return;
      }

      if (result.sessionToken) {
        complete2FA(result.sessionToken);
        navigation.navigate('TherapistDashboard');
      }
    } catch (error) {
      Alert.alert(t('common.error'), t('auth.verificationFailed'));
    } finally {
      setIsVerifying(false);
      isSubmittingRef.current = false;
    }
  };

  return (
    <ScreenContainer testID="two-factor-screen" accessibilityLabel="Two-Factor Authentication">
    <View style={[styles.container, isHighContrast && styles.containerHC]}>
      <View style={styles.content}>
        <View style={styles.header}>
          <AppText variant="h2" style={[styles.title, isHighContrast && styles.textHC]}>
            {t('auth.twoFactorTitle', { defaultValue: 'Zwei-Faktor-Authentifizierung' })}
          </AppText>
          <AppText style={[styles.subtitle, isHighContrast && styles.textHC]}>
            {t('auth.twoFactorSubtitle', {
              defaultValue: 'Geben Sie den 6-stelligen Code aus Ihrer Authenticator-App ein.',
            })}
          </AppText>
        </View>

        <View style={styles.codeInput}>
          <AppInput
            label={t('auth.verificationCode', { defaultValue: 'Verifizierungscode' })}
            required
            value={code}
            onChangeText={(text) => setCode(text.replace(/[^0-9]/g, '').slice(0, 6))}
            placeholder={t('auth.codePlaceholder', { defaultValue: '000000' })}
            keyboardType="number-pad"
            maxLength={6}
            testID="input-2fa-code"
          />
        </View>

        <AppButton
          title={t('auth.verify', { defaultValue: 'Verifizieren' })}
          onPress={handleVerify}
          disabled={isVerifying || code.length !== 6}
          loading={isVerifying}
          testID="btn-verify-2fa"
        />

        <View style={styles.helpBox}>
          <AppText style={styles.helpText}>
            🔐 {t('auth.twoFactorHelp', {
              defaultValue:
                'Öffnen Sie Ihre Authenticator-App (z.B. Google Authenticator) und geben Sie den aktuellen Code ein.',
            })}
          </AppText>
        </View>
      </View>
    </View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, justifyContent: 'center' },
  containerHC: { backgroundColor: '#000' },
  content: { padding: spacing.lg },
  header: { marginBottom: spacing.xl, alignItems: 'center' },
  title: { marginBottom: spacing.sm, textAlign: 'center' },
  subtitle: { fontSize: 16, color: colors.textMuted, textAlign: 'center' },
  textHC: { color: '#fff' },
  codeInput: { marginBottom: spacing.xl },
  helpBox: {
    backgroundColor: colors.infoSurface || '#E3F2FD',
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.xl,
  },
  helpText: { fontSize: 13, color: colors.textMuted, lineHeight: 20 },
});
