/**
 * SelectLanguageScreen - choose app UI language (local-only)
 * ISO/WCAG: Token-based design system
 */

import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import i18n, { setAppLanguage, SUPPORTED_LANGUAGES, SupportedLanguage } from '../i18n/config';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { colors, spacing, radius } from '../theme/tokens';

type Props = NativeStackScreenProps<RootStackParamList, 'SelectLanguage'>;

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
    await setAppLanguage(language);
    navigation.goBack();
  };

  return (
    <View style={styles.container} testID="select-language-screen">
      <Text style={styles.title} accessibilityRole="header">{t('selectLanguage.title')}</Text>
      <Text style={styles.subtitle}>{t('selectLanguage.subtitle')}</Text>

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
              <Text style={styles.label}>{LABELS[language].nativeName}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.lg,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: 14,
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
    fontSize: 16,
    color: colors.text,
    fontWeight: '600',
  },
});
