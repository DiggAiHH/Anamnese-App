/**
 * DocumentRequestScreen - Document type selection for returning patients
 *
 * Options: Rezept, Überweisung, AU-Bescheinigung
 * After selection, navigates to the specific request form.
 *
 * @security No PII stored/logged on this screen.
 */

import React from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { StackScreenProps } from '@react-navigation/stack';
import { usePatientContext } from '../../application/PatientContext';
import { useTheme } from '../theme/ThemeContext';
import { AppText } from '../components/AppText';
import { DocumentType } from '../../domain/entities/DocumentRequest';
import { colors, spacing, radius } from '../theme/tokens';
import type { RootStackParamList } from '../navigation/RootNavigator';

type Props = StackScreenProps<RootStackParamList, 'DocumentRequest'>;

interface DocumentOption {
  type: DocumentType;
  icon: string;
  labelKey: string;
  descKey: string;
  screen: 'PrescriptionRequest' | 'ReferralRequest' | 'SickNoteRequest';
  color: string;
}

const DOCUMENT_OPTIONS: DocumentOption[] = [
  {
    type: DocumentType.REZEPT,
    icon: '💊',
    labelKey: 'documentRequest.rezept',
    descKey: 'documentRequest.rezeptDesc',
    screen: 'PrescriptionRequest',
    color: '#4CAF50',
  },
  {
    type: DocumentType.UEBERWEISUNG,
    icon: '📋',
    labelKey: 'documentRequest.ueberweisung',
    descKey: 'documentRequest.ueberweisungDesc',
    screen: 'ReferralRequest',
    color: '#2196F3',
  },
  {
    type: DocumentType.AU_BESCHEINIGUNG,
    icon: '🏥',
    labelKey: 'documentRequest.au',
    descKey: 'documentRequest.auDesc',
    screen: 'SickNoteRequest',
    color: '#FF9800',
  },
];

export const DocumentRequestScreen = ({ navigation }: Props): React.JSX.Element => {
  const { t } = useTranslation();
  const { setSelectedConcern, patientStatus } = usePatientContext();
  const { isHighContrast } = useTheme();

  const handleSelectDocument = (option: DocumentOption): void => {
    setSelectedConcern(option.type);
    navigation.navigate(option.screen);
  };

  return (
    <View style={[styles.container, isHighContrast && styles.containerHighContrast]}>
      <View style={styles.headerSection}>
        <AppText variant="h1" style={[styles.title, isHighContrast && styles.textHighContrast]}>
          {t('documentRequest.title', { defaultValue: 'Was benötigen Sie?' })}
        </AppText>
        <AppText style={[styles.subtitle, isHighContrast && styles.textHighContrast]}>
          {t('documentRequest.subtitle', {
            defaultValue: 'Wählen Sie die Art des gewünschten Dokuments',
          })}
        </AppText>
      </View>

      <ScrollView style={styles.optionsScroll} contentContainerStyle={styles.optionsContainer}>
        {DOCUMENT_OPTIONS.map(option => (
          <TouchableOpacity
            key={option.type}
            style={[styles.optionCard, isHighContrast && styles.optionCardHighContrast]}
            onPress={() => handleSelectDocument(option)}
            accessibilityRole="button"
            accessibilityLabel={t(option.labelKey, { defaultValue: option.type })}>
            <View style={[styles.iconCircle, { backgroundColor: option.color + '20' }]}>
              <AppText style={styles.iconEmoji}>{option.icon}</AppText>
            </View>
            <View style={styles.optionTextContainer}>
              <AppText
                style={[styles.optionTitle, isHighContrast && styles.textHighContrastInverse]}>
                {t(option.labelKey, { defaultValue: option.type })}
              </AppText>
              <AppText
                style={[styles.optionDesc, isHighContrast && styles.textHighContrastInverse]}>
                {t(option.descKey, { defaultValue: '' })}
              </AppText>
            </View>
            <AppText style={styles.arrow}>→</AppText>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {patientStatus === 'new' && (
        <View style={styles.noteBox}>
          <AppText style={[styles.noteText, isHighContrast && styles.textHighContrast]}>
            {t('documentRequest.newPatientNote', {
              defaultValue:
                'Als neuer Patient werden Sie nach der Dokumentanforderung zur Anamnese weitergeleitet.',
            })}
          </AppText>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.lg,
  },
  containerHighContrast: {
    backgroundColor: '#000000',
  },
  headerSection: {
    marginBottom: spacing.xl,
  },
  title: {
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: colors.textMuted,
    textAlign: 'center',
  },
  textHighContrast: {
    color: '#ffffff',
  },
  textHighContrastInverse: {
    color: '#000000',
  },
  optionsScroll: {
    flex: 1,
  },
  optionsContainer: {
    gap: spacing.md,
    paddingBottom: spacing.lg,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  optionCardHighContrast: {
    backgroundColor: '#FFFF00',
    borderColor: '#000000',
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  iconEmoji: {
    fontSize: 24,
  },
  optionTextContainer: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  optionDesc: {
    fontSize: 14,
    color: colors.textMuted,
  },
  arrow: {
    fontSize: 24,
    color: colors.textMuted,
  },
  noteBox: {
    backgroundColor: colors.warningSurface || '#FFF3E0',
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.md,
  },
  noteText: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
  },
});
