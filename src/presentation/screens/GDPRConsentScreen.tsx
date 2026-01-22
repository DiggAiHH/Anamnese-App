/**
 * GDPRConsentScreen - minimal consent collection for demo flow
 */

import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  Modal,
  Platform,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { useQuestionnaireStore } from '../state/useQuestionnaireStore';
import { Card } from '../components/Card';
import { AppButton } from '../components/AppButton';
import { colors, spacing, radius } from '../theme/tokens';
import { logError, logDebug } from '@shared/logger';
import { SQLitePatientRepository } from '@infrastructure/persistence/SQLitePatientRepository';
import { SQLiteGDPRConsentRepository } from '@infrastructure/persistence/SQLiteGDPRConsentRepository';
import { database } from '@infrastructure/persistence/DatabaseConnection';
import { GDPRConsentEntity } from '@domain/entities/GDPRConsent';

type Props = NativeStackScreenProps<RootStackParamList, 'GDPRConsent'>;

/**
 * @security DSGVO Art. 13/14 compliant privacy policy text
 * This is embedded directly to ensure offline availability
 */
const PRIVACY_POLICY_TEXT = `
1. Verantwortlicher
Die Datenverarbeitung erfolgt durch die Arztpraxis, in der diese App eingesetzt wird.

2. Zweck der Datenverarbeitung
Erfassung medizinischer Anamnese-Daten zur Vorbereitung von Untersuchungen und Behandlungen.

3. Rechtsgrundlage
Art. 6 Abs. 1 lit. a DSGVO (Einwilligung) und Art. 9 Abs. 2 lit. a DSGVO (Gesundheitsdaten).

4. Datenkategorien
- Stammdaten (Name, Geburtsdatum, Geschlecht)
- Kontaktdaten (E-Mail, Telefon - optional)
- Gesundheitsdaten (Anamnese-Antworten)

5. Speicherung
Alle Daten werden lokal auf dem Gerät gespeichert. AES-256 Verschlüsselung. Keine Übertragung an externe Server.

6. Speicherdauer
Die Daten werden bis zur aktiven Löschung durch den Nutzer gespeichert.

7. Ihre Rechte
- Auskunft (Art. 15 DSGVO)
- Berichtigung (Art. 16 DSGVO)
- Löschung (Art. 17 DSGVO)
- Einschränkung (Art. 18 DSGVO)
- Datenübertragbarkeit (Art. 20 DSGVO)
- Widerruf der Einwilligung (Art. 7 Abs. 3 DSGVO)

8. Kontakt Datenschutz
Bei Fragen wenden Sie sich an die Arztpraxis, die diese App einsetzt.
`;

type ConsentState = {
  dataProcessing: boolean;
  dataStorage: boolean;
  gdtExport: boolean;
  ocrProcessing: boolean;
  voiceRecognition: boolean;
};

export const GDPRConsentScreen = ({ navigation }: Props): React.JSX.Element => {
  const { t } = useTranslation();
  const { patient, setPatient } = useQuestionnaireStore();

  const [consents, setConsents] = useState<ConsentState>({
    dataProcessing: false,
    dataStorage: false,
    gdtExport: false,
    ocrProcessing: false,
    voiceRecognition: false,
  });

  const [isWorking, setIsWorking] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const isWindows = Platform.OS === 'windows';

  const canContinue = useMemo(() => {
    return consents.dataProcessing && consents.dataStorage;
  }, [consents.dataProcessing, consents.dataStorage]);

  const toggle = (key: keyof ConsentState): void => {
    setConsents(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const createConsent = (
    patientId: string,
    type: Parameters<typeof GDPRConsentEntity.create>[0]['type'],
  ): GDPRConsentEntity => {
    const base = {
      patientId,
      type,
      privacyPolicyVersion: '1.0.0',
      legalBasis: 'consent' as const,
      recipients: undefined,
      retentionPeriod: '3 years',
    };

    switch (type) {
      case 'data_processing':
        return GDPRConsentEntity.create({
          ...base,
          purpose: 'Verarbeitung personenbezogener Gesundheitsdaten',
          dataCategories: ['Gesundheitsdaten', 'Kontaktdaten'],
        });
      case 'data_storage':
        return GDPRConsentEntity.create({
          ...base,
          purpose: 'Speicherung der Anamnese-Daten',
          dataCategories: ['Anamnese-Antworten'],
        });
      case 'gdt_export':
        return GDPRConsentEntity.create({
          ...base,
          purpose: 'Export der Anamnese als GDT für Praxissysteme',
          dataCategories: ['Anamnese-Antworten', 'Stammdaten'],
        });
      case 'ocr_processing':
        return GDPRConsentEntity.create({
          ...base,
          purpose: 'OCR-Verarbeitung hochgeladener Dokumente',
          dataCategories: ['Dokumenten-Scans'],
        });
      case 'voice_recognition':
        return GDPRConsentEntity.create({
          ...base,
          purpose: 'Spracherkennung für Antwort-Eingabe',
          dataCategories: ['Sprachaufnahmen'],
        });
      default:
        return GDPRConsentEntity.create({
          ...base,
          purpose: 'Einwilligung',
          dataCategories: [],
        });
    }
  };

  const handleContinue = async (): Promise<void> => {
    if (!patient) {
      Alert.alert(t('common.error'), t('gdpr.missingPatient'));
      navigation.goBack();
      return;
    }

    if (!canContinue) {
      Alert.alert(t('gdpr.requiredTitle'), t('gdpr.requiredMessage'));
      return;
    }

    setIsWorking(true);

    try {
      const gdprRepo = new SQLiteGDPRConsentRepository(database);
      const patientRepo = new SQLitePatientRepository();

      let updated = patient;
      updated = updated.addConsent('data_processing', consents.dataProcessing, '1.0.0');
      updated = updated.addConsent('data_storage', consents.dataStorage, '1.0.0');

      if (consents.gdtExport) updated = updated.addConsent('gdt_export', true, '1.0.0');
      if (consents.ocrProcessing) updated = updated.addConsent('ocr_processing', true, '1.0.0');
      if (consents.voiceRecognition)
        updated = updated.addConsent('voice_recognition', true, '1.0.0');

      await patientRepo.save(updated);

      // Save per-consent audit records
      await gdprRepo.save(createConsent(updated.id, 'data_processing').grant());
      await gdprRepo.save(createConsent(updated.id, 'data_storage').grant());
      if (consents.gdtExport) {
        await gdprRepo.save(createConsent(updated.id, 'gdt_export').grant());
      }
      if (consents.ocrProcessing) {
        await gdprRepo.save(createConsent(updated.id, 'ocr_processing').grant());
      }
      if (consents.voiceRecognition) {
        await gdprRepo.save(createConsent(updated.id, 'voice_recognition').grant());
      }

      setPatient(updated);

      navigation.replace('Questionnaire');
    } catch (error) {
      Alert.alert(
        t('common.error'),
        error instanceof Error ? error.message : t('gdpr.saveFailed'),
      );
    } finally {
      setIsWorking(false);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      testID="gdpr-consent-screen">
      <Text style={styles.title}>{t('gdpr.title')}</Text>
      <Text style={styles.subtitle}>{t('gdpr.subtitle')}</Text>

      {/* Privacy Policy Link - with error handling for Windows */}
      <TouchableOpacity
        style={styles.privacyLinkContainer}
        onPress={() => {
          try {
            logDebug('[GDPRConsentScreen] Privacy link pressed, Platform.OS=' + Platform.OS);
            setShowPrivacyModal(true);
          } catch (err) {
            logError('[GDPRConsentScreen] Failed to open privacy modal', err);
            Alert.alert('Error', 'Could not open privacy policy.');
          }
        }}
        testID="btn-privacy-policy"
        accessibilityRole="button">
        <Text style={styles.privacyLinkText}>
          {t('gdpr.privacyPolicyLink', { defaultValue: 'Datenschutzerklärung lesen' })}
        </Text>
      </TouchableOpacity>

      <Card style={styles.card}>
        {/* Legend for required/optional */}
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.badge, styles.badgeRequired]}>
              <Text style={styles.badgeText}>{t('gdpr.requiredLabel', { defaultValue: 'Pflicht' })}</Text>
            </View>
            <Text style={styles.legendText}>{t('gdpr.requiredExplanation', { defaultValue: 'Diese Einwilligungen sind für die App-Nutzung erforderlich' })}</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.badge, styles.badgeOptional]}>
              <Text style={styles.badgeTextOptional}>{t('gdpr.optionalLabel', { defaultValue: 'Optional' })}</Text>
            </View>
            <Text style={styles.legendText}>{t('gdpr.optionalExplanation', { defaultValue: 'Diese Funktionen können bei Bedarf aktiviert werden' })}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <ConsentRow
          title={t('gdpr.consents.dataProcessing.title')}
          description={t('gdpr.consents.dataProcessing.description')}
          value={consents.dataProcessing}
          onToggle={() => toggle('dataProcessing')}
          required={true}
        />
        <ConsentRow
          title={t('gdpr.consents.dataStorage.title')}
          description={t('gdpr.consents.dataStorage.description')}
          value={consents.dataStorage}
          onToggle={() => toggle('dataStorage')}
          required={true}
        />

        <View style={styles.divider} />

        <ConsentRow
          title={t('gdpr.consents.gdtExport.title')}
          description={t('gdpr.consents.gdtExport.description')}
          value={consents.gdtExport}
          onToggle={() => toggle('gdtExport')}
          required={false}
        />
        <ConsentRow
          title={t('gdpr.consents.ocrProcessing.title')}
          description={t('gdpr.consents.ocrProcessing.description')}
          value={consents.ocrProcessing}
          onToggle={() => toggle('ocrProcessing')}
          required={false}
        />
        <ConsentRow
          title={t('gdpr.consents.voiceRecognition.title')}
          description={t('gdpr.consents.voiceRecognition.description')}
          value={consents.voiceRecognition}
          onToggle={() => toggle('voiceRecognition')}
          required={false}
        />

        <AppButton
          title={t('gdpr.continue')}
          onPress={() => {
            handleContinue();
          }}
          disabled={!canContinue || isWorking}
          loading={isWorking}
          testID="btn-consent-continue"
          style={styles.primaryButton}
        />
      </Card>

      {/* Privacy Policy Overlay - avoid Modal on Windows */}
      {isWindows ? (
        showPrivacyModal ? (
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <ScrollView style={styles.modalScroll}>
                <Text style={styles.modalTitle}>
                  {t('gdpr.privacyPolicyTitle', { defaultValue: 'Datenschutzerklärung' })}
                </Text>
                <Text style={styles.modalText}>
                  {t('gdpr.privacyPolicyFullText', { defaultValue: PRIVACY_POLICY_TEXT })}
                </Text>
              </ScrollView>
              <AppButton
                label={t('common.ok', { defaultValue: 'OK' })}
                onPress={() => setShowPrivacyModal(false)}
                testID="btn-close-privacy-modal"
                style={styles.modalCloseButton}
              />
            </View>
          </View>
        ) : null
      ) : (
        <Modal
          visible={showPrivacyModal}
          animationType="slide"
          transparent={true}
          statusBarTranslucent={false}
          onRequestClose={() => {
            try {
              setShowPrivacyModal(false);
            } catch (err) {
              logError('[GDPRConsentScreen] Modal close failed', err);
            }
          }}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <ScrollView style={styles.modalScroll}>
                <Text style={styles.modalTitle}>
                  {t('gdpr.privacyPolicyTitle', { defaultValue: 'Datenschutzerklärung' })}
                </Text>
                <Text style={styles.modalText}>
                  {t('gdpr.privacyPolicyFullText', { defaultValue: PRIVACY_POLICY_TEXT })}
                </Text>
              </ScrollView>
              <AppButton
                label={t('common.ok', { defaultValue: 'OK' })}
                onPress={() => setShowPrivacyModal(false)}
                testID="btn-close-privacy-modal"
                style={styles.modalCloseButton}
              />
            </View>
          </View>
        </Modal>
      )}
    </ScrollView>
  );
};

const ConsentRow = (props: {
  title: string;
  description: string;
  value: boolean;
  onToggle: () => void;
  required: boolean;
}): React.JSX.Element => {
  return (
    <TouchableOpacity
      style={[
        styles.consentRow,
        props.required && !props.value && styles.consentRowMissing,
      ]}
      onPress={props.onToggle}
      testID={`consent-${props.title}`}
      accessibilityRole="button">
      <View style={[
        styles.checkbox,
        props.required && styles.checkboxRequired,
      ]}>
        {props.value ? <View style={styles.checkboxSelected} /> : null}
      </View>
      <View style={styles.consentText}>
        <View style={styles.titleRow}>
          <Text style={styles.consentTitle}>{props.title}</Text>
          {props.required && (
            <View style={[styles.badge, styles.badgeRequiredSmall]}>
              <Text style={styles.badgeTextSmall}>*</Text>
            </View>
          )}
        </View>
        <Text style={styles.consentDescription}>{props.description}</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.xl,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
    lineHeight: 20,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.lg,
  },
  legend: {
    marginBottom: spacing.md,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  legendText: {
    flex: 1,
    fontSize: 12,
    color: colors.textSecondary,
    marginLeft: spacing.sm,
  },
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  badgeRequired: {
    backgroundColor: colors.primary,
  },
  badgeOptional: {
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.onPrimary,
  },
  badgeTextOptional: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  badgeRequiredSmall: {
    backgroundColor: colors.danger,
    marginLeft: spacing.xs,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
  },
  badgeTextSmall: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.onPrimary,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.md,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  consentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: spacing.md,
  },
  consentRowMissing: {
    backgroundColor: 'rgba(244, 67, 54, 0.05)',
    marginHorizontal: -spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.sm,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderWidth: 2,
    borderColor: colors.primary,
    borderRadius: radius.sm,
    marginRight: spacing.md,
    marginTop: spacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxRequired: {
    borderColor: colors.danger,
  },
  checkboxSelected: {
    width: 12,
    height: 12,
    backgroundColor: colors.primary,
    borderRadius: 3,
  },
  consentText: {
    flex: 1,
  },
  consentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  consentDescription: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  primaryButton: {
    marginTop: spacing.md,
  },
  privacyLinkContainer: {
    marginBottom: spacing.lg,
    alignItems: 'center',
  },
  privacyLinkText: {
    color: colors.primary,
    fontSize: 15,
    textDecorationLine: 'underline',
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    maxHeight: '80%',
    width: '100%',
    maxWidth: 600,
    padding: spacing.xl,
  },
  modalScroll: {
    maxHeight: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  modalText: {
    fontSize: 14,
    color: colors.mutedText,
    lineHeight: 22,
  },
  modalCloseButton: {
    marginTop: spacing.lg,
  },
});
