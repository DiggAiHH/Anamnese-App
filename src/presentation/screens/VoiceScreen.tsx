/**
 * VoiceScreen - Speech-to-Text and Text-to-Speech Demo
 * ISO/WCAG: Token-based design system
 *
 * Uses 100% FREE local processing:
 * - STT: @react-native-voice/voice (system speech recognition)
 * - TTS: react-native-tts (system text-to-speech)
 *
 * @security GDPR Art. 25 compliant - all processing is local
 * @privacy No data leaves the device; no cloud costs
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
  Linking,
  Platform,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { SystemSpeechService, SpeechError } from '../../infrastructure/speech/SystemSpeechService';
import { TTSService, getTTSService } from '../../infrastructure/speech/TTSService';
import { colors, spacing, radius } from '../theme/tokens';

type Props = NativeStackScreenProps<RootStackParamList, 'Voice'>;

export const VoiceScreen = ({ navigation: _navigation }: Props): React.JSX.Element => {
  const { t, i18n } = useTranslation();
  const currentLocale = i18n.language.split('-')[0];

  // STT State
  const [isListening, setIsListening] = useState(false);
  const [recognizedText, setRecognizedText] = useState('');
  const [sttAvailable, setSttAvailable] = useState(false);
  const [sttError, setSttError] = useState<SpeechError | null>(null);

  // TTS State
  const [ttsText, setTtsText] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Services
  const [sttService] = useState(() => new SystemSpeechService());
  const [ttsService] = useState<TTSService>(() => getTTSService());

  // Check availability on mount
  useEffect(() => {
    const checkAvailability = async () => {
      try {
        const available = await sttService.isAvailable();
        setSttAvailable(available);
      } catch {
        setSttAvailable(false);
      }
    };
    checkAvailability();

    // Cleanup on unmount
    return () => {
      sttService.destroy();
    };
  }, [sttService]);

  // Open system settings for microphone permission
  const handleOpenSettings = useCallback(async () => {
    try {
      if (Platform.OS === 'ios') {
        const canOpen = await Linking.canOpenURL('app-settings:');
        if (canOpen) {
          await Linking.openURL('app-settings:');
        } else {
          Alert.alert(t('voice.errorTitle'), t('voice.settingsNotAvailable', { defaultValue: 'Cannot open settings.' }));
        }
      } else if (Platform.OS === 'android') {
        await Linking.openSettings();
      } else {
        // Windows: open Privacy Settings
        const canOpen = await Linking.canOpenURL('ms-settings:privacy-microphone');
        if (canOpen) {
          await Linking.openURL('ms-settings:privacy-microphone');
        } else {
          Alert.alert(t('voice.errorTitle'), t('voice.settingsNotAvailable', { defaultValue: 'Cannot open settings.' }));
        }
      }
    } catch (error) {
      // Android 11+: ActivityNotFoundException when no handler found
      Alert.alert(
        t('voice.errorTitle'),
        t('voice.settingsError', { defaultValue: 'Could not open system settings. Please navigate manually.' })
      );
    }
  }, [t]);

  // Start speech recognition
  const handleStartListening = useCallback(async () => {
    if (!sttAvailable) {
      Alert.alert(t('voice.errorTitle'), t('voice.sttNotAvailable'));
      return;
    }

    try {
      setIsListening(true);
      setRecognizedText('');
      setSttError(null);
      sttService.clearError();
      await sttService.startRecognition(currentLocale);
    } catch {
      setIsListening(false);
      const error = sttService.getLastError();
      setSttError(error);
      Alert.alert(t('voice.errorTitle'), t('voice.sttError'));
    }
  }, [sttService, sttAvailable, currentLocale, t]);

  // Stop speech recognition
  const handleStopListening = useCallback(async () => {
    try {
      const result = await sttService.stopRecognition();
      setRecognizedText(result.transcript);
      setIsListening(false);
    } catch {
      setIsListening(false);
      Alert.alert(t('voice.errorTitle'), t('voice.sttError'));
    }
  }, [sttService, t]);

  // Speak text
  const handleSpeak = useCallback(async () => {
    if (!ttsText.trim()) {
      Alert.alert(t('voice.errorTitle'), t('voice.ttsEmpty'));
      return;
    }

    try {
      setIsSpeaking(true);
      await ttsService.speak(ttsText, currentLocale);
      setIsSpeaking(false);
    } catch {
      setIsSpeaking(false);
      Alert.alert(t('voice.errorTitle'), t('voice.ttsError'));
    }
  }, [ttsService, ttsText, currentLocale, t]);

  // Stop speaking
  const handleStopSpeaking = useCallback(async () => {
    try {
      await ttsService.stop();
      setIsSpeaking(false);
    } catch {
      setIsSpeaking(false);
    }
  }, [ttsService]);

  // Copy recognized text to TTS input
  const handleCopyToTTS = useCallback(() => {
    if (recognizedText) {
      setTtsText(recognizedText);
    }
  }, [recognizedText]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title} accessibilityRole="header">{t('voice.title')}</Text>
        <Text style={styles.subtitle}>{t('voice.subtitle')}</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>🆓 {t('voice.freeLabel')}</Text>
        </View>
      </View>

      {/* Speech-to-Text Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle} accessibilityRole="header">🎤 {t('voice.sttTitle')}</Text>
        <Text style={styles.sectionDesc}>{t('voice.sttDesc')}</Text>

        {!sttAvailable && (
          <View style={styles.warningBox} accessibilityRole="alert">
            <Text style={styles.warningText}>⚠️ {t('voice.sttNotAvailable')}</Text>
          </View>
        )}

        <TouchableOpacity
          style={[
            styles.micButton,
            isListening && styles.micButtonActive,
            !sttAvailable && styles.micButtonDisabled,
          ]}
          onPress={isListening ? handleStopListening : handleStartListening}
          disabled={!sttAvailable}
          accessibilityLabel={isListening ? t('voice.stopListening') : t('voice.startListening')}
          accessibilityRole="button">
          {isListening ? (
            <ActivityIndicator color="#fff" size="large" />
          ) : (
            <Text style={styles.micButtonText}>🎤</Text>
          )}
        </TouchableOpacity>

        <Text style={styles.micLabel}>
          {isListening ? t('voice.listening') : t('voice.tapToSpeak')}
        </Text>

        {/* Error Display with contextual action */}
        {sttError && (
          <View style={styles.errorBox} accessibilityRole="alert">
            <Text style={styles.errorText}>⚠️ {sttError.message}</Text>
            {sttError.type === 'permission_denied' && (
              <TouchableOpacity
                style={styles.settingsButton}
                onPress={handleOpenSettings}
                accessibilityRole="button"
                accessibilityLabel={t('voice.openSettings')}>
                <Text style={styles.settingsButtonText}>⚙️ {t('voice.openSettings')}</Text>
              </TouchableOpacity>
            )}
            {sttError.type === 'network_error' && (
              <Text style={styles.errorHint}>{t('voice.checkConnection')}</Text>
            )}
            {sttError.type === 'no_match' && (
              <Text style={styles.errorHint}>{t('voice.speakClearly')}</Text>
            )}
          </View>
        )}

        {recognizedText ? (
          <View style={styles.resultBox} accessibilityLiveRegion="polite">
            <Text style={styles.resultLabel}>{t('voice.recognizedText')}</Text>
            <Text style={styles.resultText}>{recognizedText}</Text>
            <TouchableOpacity
              style={styles.copyButton}
              onPress={handleCopyToTTS}
              accessibilityRole="button"
              accessibilityLabel={t('voice.copyToTTS')}>
              <Text style={styles.copyButtonText}>⬇️ {t('voice.copyToTTS')}</Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </View>

      {/* Text-to-Speech Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle} accessibilityRole="header">🔊 {t('voice.ttsTitle')}</Text>
        <Text style={styles.sectionDesc}>{t('voice.ttsDesc')}</Text>

        <TextInput
          style={styles.textInput}
          placeholder={t('voice.ttsPlaceholder')}
          placeholderTextColor="#999"
          multiline
          numberOfLines={4}
          value={ttsText}
          onChangeText={setTtsText}
          maxLength={4000}
          accessibilityLabel={t('voice.ttsInput')}
        />

        <View style={styles.ttsButtonRow}>
          <TouchableOpacity
            style={[styles.ttsButton, isSpeaking && styles.ttsButtonDisabled]}
            onPress={handleSpeak}
            disabled={isSpeaking}
            accessibilityLabel={t('voice.speakButton')}
            accessibilityRole="button">
            <Text style={styles.ttsButtonText}>
              {isSpeaking ? '⏳' : '▶️'} {t('voice.speakButton')}
            </Text>
          </TouchableOpacity>

          {isSpeaking && (
            <TouchableOpacity
              style={styles.stopButton}
              onPress={handleStopSpeaking}
              accessibilityLabel={t('voice.stopButton')}
              accessibilityRole="button">
              <Text style={styles.stopButtonText}>⏹️ {t('voice.stopButton')}</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Privacy Note */}
      <View style={styles.privacySection}>
        <Text style={styles.privacyTitle} accessibilityRole="header">🔒 {t('voice.privacyTitle')}</Text>
        <Text style={styles.privacyText}>{t('voice.privacyNote')}</Text>
      </View>

      {/* Language Info */}
      <View style={styles.languageInfo}>
        <Text style={styles.languageInfoText}>
          🌍 {t('voice.currentLanguage')}: {currentLocale.toUpperCase()}
        </Text>
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
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xxxl,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  badge: {
    backgroundColor: colors.success,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.xl,
    marginTop: spacing.sm,
  },
  badgeText: {
    color: colors.textInverse,
    fontWeight: 'bold',
    fontSize: 14,
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
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  sectionDesc: {
    fontSize: 14,
    color: colors.textMuted,
    marginBottom: spacing.md,
  },
  warningBox: {
    backgroundColor: colors.warningSurface,
    padding: spacing.sm,
    borderRadius: radius.md,
    marginBottom: spacing.md,
  },
  warningText: {
    color: colors.warningText,
    fontSize: 14,
  },
  micButton: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginVertical: spacing.md,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  micButtonActive: {
    backgroundColor: colors.danger,
  },
  micButtonDisabled: {
    backgroundColor: colors.border,
  },
  micButtonText: {
    fontSize: 40,
  },
  micLabel: {
    textAlign: 'center',
    color: colors.textMuted,
    fontSize: 14,
    marginBottom: spacing.md,
  },
  resultBox: {
    backgroundColor: colors.infoSurface,
    padding: spacing.md,
    borderRadius: radius.lg,
    marginTop: spacing.sm,
  },
  resultLabel: {
    fontSize: 12,
    color: colors.infoText,
    fontWeight: 'bold',
    marginBottom: spacing.sm,
  },
  resultText: {
    fontSize: 16,
    color: colors.text,
    lineHeight: 24,
  },
  copyButton: {
    marginTop: spacing.sm,
    alignSelf: 'flex-start',
  },
  copyButtonText: {
    color: colors.primary,
    fontWeight: 'bold',
    fontSize: 14,
  },
  textInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.md,
    fontSize: 16,
    minHeight: 120,
    textAlignVertical: 'top',
    backgroundColor: colors.surfaceAlt,
    color: colors.text,
  },
  ttsButtonRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  ttsButton: {
    backgroundColor: colors.success,
    paddingVertical: 14,
    paddingHorizontal: spacing.xxxl,
    borderRadius: 25,
  },
  ttsButtonDisabled: {
    backgroundColor: colors.successBorder,
  },
  ttsButtonText: {
    color: colors.textInverse,
    fontSize: 16,
    fontWeight: 'bold',
  },
  stopButton: {
    backgroundColor: colors.danger,
    paddingVertical: 14,
    paddingHorizontal: spacing.xl,
    borderRadius: 25,
  },
  stopButtonText: {
    color: colors.textInverse,
    fontSize: 16,
    fontWeight: 'bold',
  },
  privacySection: {
    backgroundColor: colors.successSurface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  privacyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.successText,
    marginBottom: spacing.sm,
  },
  privacyText: {
    fontSize: 14,
    color: colors.successText,
    lineHeight: 20,
  },
  languageInfo: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  languageInfoText: {
    fontSize: 14,
    color: colors.textMuted,
  },
  errorBox: {
    backgroundColor: colors.dangerSurface,
    padding: spacing.md,
    borderRadius: radius.lg,
    marginBottom: spacing.md,
    alignItems: 'center',
  },
  errorText: {
    color: colors.dangerText,
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  errorHint: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  settingsButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    marginTop: spacing.sm,
  },
  settingsButtonText: {
    color: colors.textInverse,
    fontWeight: 'bold',
    fontSize: 14,
  },
});
