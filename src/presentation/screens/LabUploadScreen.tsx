/**
 * Lab Upload Screen
 * Allows doctor to upload lab reports (PDF/image), extract values via OCR,
 * and import them into the Calculator.
 *
 * @security DSGVO Art. 9: Health data. Requires OCR consent.
 * All OCR is local (TesseractOCRService). No PII in logs.
 *
 * Platform: iOS/Android only (OCR + DocumentPicker not available on Windows/Web).
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';

import { AppText } from '../components/AppText';
import { AppButton } from '../components/AppButton';
import { ScreenContainer } from '../components/ScreenContainer';
import { colors, spacing, radius } from '../theme/tokens';
import { supportsDocumentPicker, supportsOCR } from '../../shared/platformCapabilities';
import { TesseractOCRService } from '../../infrastructure/services/TesseractOCRService';
import { uploadLabReport } from '../../application/use-cases/UploadLabReportUseCase';
import type { LabValue } from '../../domain/value-objects/LabValue';
import { LAB_TO_CALCULATOR_MAP } from '../../domain/value-objects/LabValue';
import type { RootStackParamList } from '../navigation/RootNavigator';

type DocumentPickerModule = typeof import('react-native-document-picker');

const getDocumentPicker = (): DocumentPickerModule | null => {
  if (!supportsDocumentPicker) return null;
  try {
    return require('react-native-document-picker') as DocumentPickerModule;
  } catch {
    return null;
  }
};

type LabUploadNavProp = StackNavigationProp<RootStackParamList, 'LabUpload'>;

/** Unit labels for display */
const UNIT_LABELS: Record<string, string> = {
  weight: 'kg',
  height: 'cm',
  creatinine: 'mg/dL',
  totalCholesterol: 'mg/dL',
  hdlCholesterol: 'mg/dL',
  ldlCholesterol: 'mg/dL',
  triglycerides: 'mg/dL',
  glucose: 'mg/dL',
  hemoglobin: 'g/dL',
  got: 'U/L',
  gpt: 'U/L',
  ggt: 'U/L',
  tsh: 'mU/L',
  systolicBP: 'mmHg',
  uricAcid: 'mg/dL',
  potassium: 'mmol/L',
  sodium: 'mmol/L',
  crp: 'mg/L',
  hba1c: '%',
  leukocytes: '/µL',
  thrombocytes: '/µL',
  age: '',
};

export const LabUploadScreen = (): React.JSX.Element => {
  const { t, i18n } = useTranslation();
  const navigation = useNavigation<LabUploadNavProp>();

  const [isProcessing, setIsProcessing] = useState(false);
  const [parsedValues, setParsedValues] = useState<LabValue[]>([]);
  const [ocrConfidence, setOcrConfidence] = useState<number | null>(null);
  const [selectedValues, setSelectedValues] = useState<Set<string>>(new Set());
  const [hasResult, setHasResult] = useState(false);

  const isSupported = supportsDocumentPicker && supportsOCR;

  const toggleValue = useCallback((type: string) => {
    setSelectedValues(prev => {
      const next = new Set(prev);
      if (next.has(type)) {
        next.delete(type);
      } else {
        next.add(type);
      }
      return next;
    });
  }, []);

  const handlePickFile = useCallback(async () => {
    const documentPicker = getDocumentPicker();
    if (!documentPicker) {
      Alert.alert(
        t('common.error', { defaultValue: 'Fehler' }),
        t('labUpload.notSupported', { defaultValue: 'Dateiauswahl wird auf dieser Plattform nicht unterstützt.' }),
      );
      return;
    }

    try {
      const pickerResult = await documentPicker.pick({
        type: [
          documentPicker.types.images,
          documentPicker.types.pdf,
        ],
      });

      const file = pickerResult[0];
      if (!file?.uri) return;

      setIsProcessing(true);
      setParsedValues([]);
      setSelectedValues(new Set());
      setHasResult(false);
      setOcrConfidence(null);

      const filePath = file.uri.replace('file://', '');
      const ocrService = new TesseractOCRService();

      const result = await uploadLabReport(
        {
          filePath,
          fileName: file.name ?? 'lab_report',
          mimeType: file.type ?? 'image/jpeg',
          fileSize: file.size ?? 0,
          patientId: '00000000-0000-0000-0000-000000000000', // Placeholder — not persisted
          language: i18n.language,
        },
        ocrService,
        true, // OCR consent checked at screen level
      );

      setParsedValues(result.parseResult.values);
      setOcrConfidence(result.parseResult.ocrConfidence);
      setHasResult(true);

      // Pre-select all calculator-mappable values
      const calculatorTypes = new Set(
        result.parseResult.values
          .filter(v => LAB_TO_CALCULATOR_MAP[v.type as keyof typeof LAB_TO_CALCULATOR_MAP])
          .map(v => v.type),
      );
      setSelectedValues(calculatorTypes);
    } catch (error) {
      const picker = getDocumentPicker();
      if (picker?.isCancel(error)) return;

      const errorMessage = error instanceof Error ? error.message : 'unknown';

      if (errorMessage === 'OCR_CONSENT_REQUIRED') {
        Alert.alert(
          t('common.error', { defaultValue: 'Fehler' }),
          t('labUpload.ocrRequired', { defaultValue: 'OCR-Zustimmung erforderlich' }),
        );
      } else if (errorMessage === 'OCR_NOT_AVAILABLE') {
        Alert.alert(
          t('common.error', { defaultValue: 'Fehler' }),
          t('labUpload.ocrNotAvailable', { defaultValue: 'OCR ist auf diesem Gerät nicht verfügbar.' }),
        );
      } else {
        Alert.alert(
          t('common.error', { defaultValue: 'Fehler' }),
          t('labUpload.processingError', { defaultValue: 'Fehler bei der Verarbeitung des Laborberichts.' }),
        );
      }
    } finally {
      setIsProcessing(false);
    }
  }, [t, i18n.language]);

  const handleImport = useCallback(() => {
    const valuesToImport: Record<string, string> = {};
    for (const val of parsedValues) {
      if (!selectedValues.has(val.type)) continue;
      const calcKey = LAB_TO_CALCULATOR_MAP[val.type as keyof typeof LAB_TO_CALCULATOR_MAP];
      if (calcKey) {
        valuesToImport[calcKey] = String(val.value);
      }
    }

    if (Object.keys(valuesToImport).length === 0) {
      Alert.alert(
        t('common.info', { defaultValue: 'Info' }),
        t('labUpload.noImportableValues', { defaultValue: 'Keine importierbaren Werte ausgewählt.' }),
      );
      return;
    }

    // Navigate to Calculator with lab values as params
    navigation.navigate('Calculator', { labValues: valuesToImport });
  }, [parsedValues, selectedValues, navigation, t]);

  const importableCount = parsedValues.filter(
    v => LAB_TO_CALCULATOR_MAP[v.type as keyof typeof LAB_TO_CALCULATOR_MAP],
  ).length;

  const selectedImportableCount = parsedValues.filter(
    v => selectedValues.has(v.type) && LAB_TO_CALCULATOR_MAP[v.type as keyof typeof LAB_TO_CALCULATOR_MAP],
  ).length;

  if (!isSupported) {
    return (
      <ScreenContainer testID="lab-upload-screen" accessibilityLabel="Lab Upload">
      <View style={styles.container} testID="lab-upload-unsupported">
        <View style={styles.centeredContent}>
          <AppText style={styles.unsupportedText}>
            {t('labUpload.notSupported', {
              defaultValue: 'Laborbericht-Upload ist auf dieser Plattform nicht verfügbar.',
            })}
          </AppText>
          <AppText style={styles.unsupportedHint}>
            {t('labUpload.mobilOnly', {
              defaultValue: 'Diese Funktion ist nur auf iOS und Android verfügbar.',
            })}
          </AppText>
        </View>
      </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer testID="lab-upload-screen" accessibilityLabel="Lab Upload">
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
      {/* Upload Button */}
      <View style={styles.uploadSection}>
        <AppText style={styles.description}>
          {t('labUpload.description', {
            defaultValue:
              'Laden Sie einen Laborbericht hoch (Bild oder PDF). Die Werte werden lokal per OCR erkannt und können in den Rechner übernommen werden.',
          })}
        </AppText>

        <AppButton
          title={t('labUpload.selectFile', { defaultValue: 'Datei auswählen' })}
          onPress={handlePickFile}
          disabled={isProcessing}
          testID="lab-upload-pick-button"
        />
      </View>

      {/* Processing Indicator */}
      {isProcessing && (
        <View style={styles.processingSection} testID="lab-upload-processing">
          <ActivityIndicator size="large" color={colors.primary} />
          <AppText style={styles.processingText}>
            {t('labUpload.processing', { defaultValue: 'Wird analysiert...' })}
          </AppText>
        </View>
      )}

      {/* Results */}
      {hasResult && !isProcessing && (
        <View style={styles.resultsSection} testID="lab-upload-results">
          {/* Confidence */}
          {ocrConfidence !== null && (
            <AppText style={styles.confidenceText}>
              {t('labUpload.confidence', {
                defaultValue: 'OCR-Konfidenz: {{percent}}%',
                percent: Math.round(ocrConfidence * 100),
              })}
            </AppText>
          )}

          {parsedValues.length === 0 ? (
            /* No Values Found */
            <View style={styles.emptyResult} testID="lab-upload-no-values">
              <AppText style={styles.noValuesText}>
                {t('labUpload.noValues', { defaultValue: 'Keine Werte erkannt' })}
              </AppText>
              <AppText style={styles.noValuesHint}>
                {t('labUpload.noValuesHint', {
                  defaultValue: 'Versuchen Sie ein schärferes Bild oder einen anderen Laborbericht.',
                })}
              </AppText>
            </View>
          ) : (
            /* Values Found */
            <>
              <AppText style={styles.valuesHeader}>
                {t('labUpload.valuesFound', {
                  defaultValue: '{{count}} Werte erkannt',
                  count: parsedValues.length,
                })}
              </AppText>

              {parsedValues.map(val => {
                const isImportable = !!LAB_TO_CALCULATOR_MAP[val.type as keyof typeof LAB_TO_CALCULATOR_MAP];
                const isSelected = selectedValues.has(val.type);
                const unit = UNIT_LABELS[val.type] ?? val.unit;

                return (
                  <View
                    key={val.type}
                    style={[
                      styles.valueRow,
                      isImportable && styles.valueRowImportable,
                      isSelected && styles.valueRowSelected,
                    ]}
                    testID={`lab-value-${val.type}`}
                    accessible
                    accessibilityRole={isImportable ? 'checkbox' : 'text'}
                    accessibilityState={isImportable ? { checked: isSelected } : undefined}
                  >
                    {/* Checkbox area for importable values */}
                    {isImportable && (
                      <View
                        style={[styles.checkbox, isSelected && styles.checkboxChecked]}
                        onTouchEnd={() => toggleValue(val.type)}
                        testID={`lab-value-checkbox-${val.type}`}
                      />
                    )}

                    <View style={styles.valueContent}>
                      <AppText style={styles.valueName}>
                        {t(`labUpload.valueLabel.${val.type}`, { defaultValue: val.type })}
                      </AppText>
                      <AppText style={styles.valueResult}>
                        {val.value} {unit}
                      </AppText>
                    </View>

                    {val.referenceRange && (
                      <AppText style={styles.valueRef}>
                        {t('labUpload.refRange', { defaultValue: 'Ref: {{range}}', range: val.referenceRange })}
                      </AppText>
                    )}

                    {/* Confidence badge */}
                    <View
                      style={[
                        styles.confidenceBadge,
                        val.confidence >= 0.8
                          ? styles.confidenceHigh
                          : val.confidence >= 0.5
                            ? styles.confidenceMedium
                            : styles.confidenceLow,
                      ]}
                    >
                      <AppText style={styles.confidenceBadgeText}>
                        {Math.round(val.confidence * 100)}%
                      </AppText>
                    </View>
                  </View>
                );
              })}

              {/* Import button */}
              {importableCount > 0 && (
                <View style={styles.importSection}>
                  <AppText style={styles.importHint}>
                    {t('labUpload.importHint', {
                      defaultValue: '{{count}} Werte können in den Rechner übernommen werden.',
                      count: importableCount,
                    })}
                  </AppText>
                  <AppButton
                    title={t('labUpload.importValues', {
                      defaultValue: 'Werte übernehmen ({{count}})',
                      count: selectedImportableCount,
                    })}
                    onPress={handleImport}
                    disabled={selectedImportableCount === 0}
                    testID="lab-upload-import-button"
                  />
                </View>
              )}

              {importableCount === 0 && (
                <AppText style={styles.noImportableHint}>
                  {t('labUpload.noImportableHint', {
                    defaultValue: 'Keine der erkannten Werte kann automatisch in den Rechner übernommen werden.',
                  })}
                </AppText>
              )}
            </>
          )}
        </View>
      )}
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
  },
  centeredContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  uploadSection: {
    marginBottom: spacing.xl,
  },
  description: {
    fontSize: 15,
    color: colors.textSecondary,
    lineHeight: 22,
    marginBottom: spacing.lg,
  },
  processingSection: {
    alignItems: 'center',
    padding: spacing.xl,
  },
  processingText: {
    marginTop: spacing.md,
    fontSize: 16,
    color: colors.textSecondary,
  },
  resultsSection: {
    marginTop: spacing.md,
  },
  confidenceText: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  valuesHeader: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.md,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    marginBottom: spacing.sm,
    minHeight: 44,
  },
  valueRowImportable: {
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  valueRowSelected: {
    backgroundColor: colors.infoSurface,
  },
  valueContent: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  valueName: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  valueResult: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  valueRef: {
    fontSize: 12,
    color: colors.textSecondary,
    marginRight: spacing.sm,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: radius.sm,
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  confidenceBadge: {
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: radius.sm,
    minWidth: 40,
    alignItems: 'center',
  },
  confidenceHigh: {
    backgroundColor: colors.successSurface ?? '#e8f5e9',
  },
  confidenceMedium: {
    backgroundColor: colors.warningSurface ?? '#fff3e0',
  },
  confidenceLow: {
    backgroundColor: colors.dangerSurface,
  },
  confidenceBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.text,
  },
  importSection: {
    marginTop: spacing.lg,
  },
  importHint: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  noImportableHint: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: spacing.md,
    fontStyle: 'italic',
  },
  emptyResult: {
    alignItems: 'center',
    padding: spacing.xl,
  },
  noValuesText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  noValuesHint: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  unsupportedText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textSecondary,
    textAlign: 'center',
  },
  unsupportedHint: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
});
