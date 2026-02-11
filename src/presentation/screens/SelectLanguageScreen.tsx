/**
 * SelectLanguageScreen - choose app UI language (local-only)
 * ISO/WCAG: Token-based design system
 */

import React, { useMemo } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { AppText } from '../components/AppText';
import { ScreenContainer } from '../components/ScreenContainer';
import { useTranslation } from 'react-i18next';
import { logDebug } from '@shared/logger';
import i18n, { setAppLanguage, SUPPORTED_LANGUAGES, SupportedLanguage } from '../i18n/config';
import type { StackScreenProps } from '@react-navigation/stack';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { colors, spacing, radius } from '../theme/tokens';

type Props = StackScreenProps<RootStackParamList, 'SelectLanguage'>;

const LABELS: Record<SupportedLanguage, { nativeName: string }> = {
  de: { nativeName: 'Deutsch' },
  en: { nativeName: 'English' },
  fr: { nativeName: 'Français' },
  es: { nativeName: 'Español' },
  it: { nativeName: 'Italiano' },
  pt: { nativeName: 'Português' },
  nl: { nativeName: 'Nederlands' },
  pl: { nativeName: 'Polski' },
  tr: { nativeName: 'Türkçe' },
  ru: { nativeName: 'Русский' },
  ar: { nativeName: 'العربية' },
  fa: { nativeName: 'فارسی' },
  zh: { nativeName: '中文' },
  ja: { nativeName: '日本語' },
  ko: { nativeName: '한국어' },
  vi: { nativeName: 'Tiếng Việt' },
  uk: { nativeName: 'Українська' },
  ro: { nativeName: 'Română' },
  el: { nativeName: 'Ελληνικά' },
};

export const SelectLanguageScreen = ({ navigation }: Props): React.JSX.Element => {
  const { t } = useTranslation();

  const current = useMemo<SupportedLanguage>(() => {
    const normalized = (i18n.language ?? 'de').split('-')[0] as SupportedLanguage;
    return (SUPPORTED_LANGUAGES as readonly string[]).includes(normalized) ? normalized : 'de';
  }, []);

  const onPick = async (language: SupportedLanguage): Promise<void> => {
    logDebug(`[SelectLanguageScreen] Selected language: ${language}`);
    await setAppLanguage(language);
    navigation.goBack();
  };

  return (
    <ScreenContainer testID="select-language-screen" accessibilityLabel="Select Language">
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer} testID="select-language-screen">
      <AppText style={styles.title} accessibilityRole="header">
        {t('selectLanguage.title')}
      </AppText>
      <AppText style={styles.subtitle}>{t('selectLanguage.subtitle')}</AppText>

      <View style={styles.card} accessibilityRole="radiogroup">
        {SUPPORTED_LANGUAGES.map(language => {
          const selected = language === current;
          return (
            <TouchableOpacity
              key={language}
              style={[styles.row, selected && styles.rowSelected]}
              onPress={() => {
                onPick(language);
              }}
              testID={`language-${language}`}
              accessibilityRole="radio"
              accessibilityState={{ checked: selected }}
              accessibilityLabel={LABELS[language].nativeName}>
              <View style={[styles.radio, selected && styles.radioSelected]} />
              <AppText style={styles.label}>{LABELS[language].nativeName}</AppText>
            </TouchableOpacity>
          );
        })}
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
  contentContainer: {
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  title: {
    color: colors.text,
    marginBottom: spacing.sm,
  },
  subtitle: {
    color: colors.textMuted,
    marginBottom: spacing.md,
    lineHeight: 20,
  },
  card: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radius.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  rowSelected: {
    opacity: 0.95,
  },
  radio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: colors.primary,
    marginRight: spacing.sm,
  },
  radioSelected: {
    backgroundColor: colors.primary,
  },
  label: {
    color: colors.text,
    fontWeight: '600',
  },
  // High Contrast
  textHighContrast: { color: '#ffffff' },
  textHighContrastInverse: { color: '#000000' },
  bgHighContrast: { backgroundColor: '#000000' },
  surfaceHighContrast: { backgroundColor: '#ffffff' },
});
