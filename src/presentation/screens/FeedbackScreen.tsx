/**
 * Feedback Screen
 * Allows users to submit improvement suggestions via email or clipboard.
 * ISO/WCAG: Token-based design system
 *
 * @security No PII collected. Only category + freeform description.
 */

import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  Linking,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import Clipboard from '@react-native-clipboard/clipboard';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { FeedbackTextBuilder, FeedbackCategory } from '../../domain/services/FeedbackTextBuilder';
import { colors, spacing, radius } from '../theme/tokens';
import { AppButton } from '../components/AppButton';
import { AppText } from '../components/AppText';

type Props = NativeStackScreenProps<RootStackParamList, 'Feedback'>;

const DEVELOPER_EMAIL = 'laith.alshdaifat@hotmail.com';

const CATEGORIES: { key: FeedbackCategory; labelKey: string }[] = [
  { key: 'bug', labelKey: 'feedback.categoryBug' },
  { key: 'feature', labelKey: 'feedback.categoryFeature' },
  { key: 'other', labelKey: 'feedback.categoryOther' },
];

export const FeedbackScreen = (_props: Props): React.JSX.Element => {
  const { t, i18n } = useTranslation();

  const [selectedCategory, setSelectedCategory] = useState<FeedbackCategory>('feature');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!description.trim()) {
      Alert.alert(
        t('common.error'),
        t('feedback.errorEmpty', { defaultValue: 'Please enter a description.' }),
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const input = {
        category: selectedCategory,
        description,
        locale: i18n.language,
      };

      const mailtoUri = FeedbackTextBuilder.buildMailtoUri(DEVELOPER_EMAIL, input);
      const canOpen = await Linking.canOpenURL(mailtoUri);

      if (canOpen) {
        await Linking.openURL(mailtoUri);
        Alert.alert(
          t('common.success', { defaultValue: 'Success' }),
          t('feedback.successEmail', { defaultValue: 'Email client opened.' }),
        );
      } else {
        // Fallback: Copy to clipboard
        const { fullText } = FeedbackTextBuilder.build(input);
        Clipboard.setString(fullText);
        Alert.alert(
          t('feedback.copiedTitle', { defaultValue: 'Copied to Clipboard' }),
          t('feedback.copiedMessage', {
            defaultValue:
              'Feedback text copied. Please paste it into an email to: ' + DEVELOPER_EMAIL,
          }),
        );
      }

      // Reset form on success
      setDescription('');
      setSelectedCategory('feature');
    } catch (error) {
      // Fallback on any error: copy to clipboard
      try {
        const { fullText } = FeedbackTextBuilder.build({
          category: selectedCategory,
          description,
          locale: i18n.language,
        });
        Clipboard.setString(fullText);
        Alert.alert(
          t('feedback.copiedTitle', { defaultValue: 'Copied to Clipboard' }),
          t('feedback.copiedMessage', {
            defaultValue:
              'Feedback text copied. Please paste it into an email to: ' + DEVELOPER_EMAIL,
          }),
        );
        setDescription('');
        setSelectedCategory('feature');
      } catch {
        Alert.alert(
          t('common.error'),
          t('feedback.errorGeneric', { defaultValue: 'Could not send feedback.' }),
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyOnly = () => {
    if (!description.trim()) {
      Alert.alert(
        t('common.error'),
        t('feedback.errorEmpty', { defaultValue: 'Please enter a description.' }),
      );
      return;
    }

    const { fullText } = FeedbackTextBuilder.build({
      category: selectedCategory,
      description,
      locale: i18n.language,
    });
    Clipboard.setString(fullText);
    Alert.alert(
      t('feedback.copiedTitle', { defaultValue: 'Copied to Clipboard' }),
      t('feedback.copiedMessageShort', { defaultValue: 'Feedback copied!' }),
    );
  };

  return (
    <ScrollView style={styles.container} testID="feedback-screen">
      <View style={styles.content}>
        <AppText style={styles.title}>{t('feedback.title', { defaultValue: 'Send Feedback' })}</AppText>
        <AppText style={styles.subtitle}>
          {t('feedback.subtitle', {
            defaultValue: 'Help us improve the app by sharing your thoughts.',
          })}
        </AppText>

        {/* Category Selection */}
        <AppText style={styles.label}>
          {t('feedback.categoryLabel', { defaultValue: 'Category' })}
        </AppText>
        <View style={styles.categoryContainer}>
          {CATEGORIES.map(({ key, labelKey }) => (
            <TouchableOpacity
              key={key}
              style={[
                styles.categoryButton,
                selectedCategory === key && styles.categoryButtonSelected,
              ]}
              onPress={() => setSelectedCategory(key)}
              testID={`feedback-category-${key}`}
              accessibilityRole="button"
              accessibilityState={{ selected: selectedCategory === key }}
              accessibilityLabel={t(labelKey, { defaultValue: key })}>
              <AppText
                style={[
                  styles.categoryButtonText,
                  selectedCategory === key && styles.categoryButtonTextSelected,
                ]}>
                {t(labelKey, { defaultValue: key })}
              </AppText>
            </TouchableOpacity>
          ))}
        </View>

        {/* Description Input */}
        <AppText style={styles.label}>
          {t('feedback.descriptionLabel', { defaultValue: 'Description' })}
        </AppText>
        <TextInput
          style={styles.textInput}
          multiline
          numberOfLines={6}
          placeholder={t('feedback.descriptionPlaceholder', {
            defaultValue: 'Describe your feedback in detail...',
          })}
          placeholderTextColor="#9ca3af"
          value={description}
          onChangeText={setDescription}
          maxLength={2000}
          testID="feedback-description-input"
          accessibilityLabel={t('feedback.descriptionLabel', { defaultValue: 'Description' })}
        />
        <AppText style={styles.charCount}>{description.length} / 2000</AppText>

        {/* Submit Buttons */}
        <View style={styles.buttonContainer}>
          <AppButton
            title={t('feedback.submitButton', { defaultValue: 'Send Feedback' })}
            onPress={handleSubmit}
            disabled={isSubmitting}
            loading={isSubmitting}
            testID="feedback-submit-button"
            accessibilityLabel={t('feedback.submitButton', { defaultValue: 'Send Feedback' })}
          />

          <AppButton
            title={t('feedback.copyButton', { defaultValue: 'Copy to Clipboard' })}
            variant="secondary"
            onPress={handleCopyOnly}
            testID="feedback-copy-button"
            accessibilityLabel={t('feedback.copyButton', { defaultValue: 'Copy to Clipboard' })}
          />
        </View>

        {/* Privacy Note */}
        <View style={styles.privacyNote}>
          <AppText style={styles.privacyText}>
            {t('feedback.privacyNote', {
              defaultValue:
                'Your feedback is sent directly to the developer. No personal data is collected.',
            })}
          </AppText>
        </View>
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
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textMuted,
    marginBottom: spacing.xl,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  categoryButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.xl,
    backgroundColor: colors.border,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  categoryButtonSelected: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  categoryButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  categoryButtonTextSelected: {
    color: colors.primary,
    fontWeight: '600',
  },
  textInput: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: radius.md,
    padding: spacing.sm,
    fontSize: 16,
    color: colors.text,
    textAlignVertical: 'top',
    minHeight: 150,
  },
  charCount: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'right',
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
  },
  buttonContainer: {
    gap: spacing.sm,
  },
  privacyNote: {
    marginTop: spacing.xl,
    padding: spacing.sm,
    backgroundColor: colors.successSurface,
    borderRadius: radius.md,
    borderLeftWidth: 4,
    borderLeftColor: colors.success,
  },
  privacyText: {
    fontSize: 13,
    color: colors.successText,
    lineHeight: 18,
  },
});
