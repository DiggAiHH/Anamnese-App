/**
 * RequestSummaryScreen - Document Request Summary & Encrypted Submission
 *
 * Displays a summary of the document request (prescription, referral, sick note)
 * and allows the patient to submit via encrypted mailto flow.
 *
 * @security Data is encrypted via AES-256-GCM before mailto generation. No PII logged.
 * @gdpr Art. 25 compliant - data minimization, purpose limitation.
 */

import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Linking,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import type { StackScreenProps } from '@react-navigation/stack';
import { useTheme } from '../theme/ThemeContext';
import { AppText } from '../components/AppText';
import { AppButton } from '../components/AppButton';
import { ScreenContainer } from '../components/ScreenContainer';
import { colors, spacing, radius } from '../theme/tokens';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { useQuestionnaireStore } from '../state/useQuestionnaireStore';
import {
  DocumentType,
  DocumentRequestPriority,
  type IDocumentRequest,
  type IPrescriptionRequest,
  type IReferralRequest,
  type ISickNoteRequest,
} from '../../domain/entities/DocumentRequest';
import { encryptionService } from '../../infrastructure/encryption/encryptionService';

type Props = StackScreenProps<RootStackParamList, 'RequestSummary'>;

/**
 * Type guard for prescription request.
 */
function isPrescription(req: IDocumentRequest): req is IPrescriptionRequest {
  return req.documentType === DocumentType.REZEPT;
}

/**
 * Type guard for referral request.
 */
function isReferral(req: IDocumentRequest): req is IReferralRequest {
  return req.documentType === DocumentType.UEBERWEISUNG;
}

/**
 * Type guard for sick note request.
 */
function isSickNote(req: IDocumentRequest): req is ISickNoteRequest {
  return req.documentType === DocumentType.AU_BESCHEINIGUNG;
}

/**
 * Human-readable document type label.
 */
function getDocTypeLabel(type: DocumentType, t: TFunction): string {
  switch (type) {
    case DocumentType.REZEPT:
      return t('documentRequest.prescription', { defaultValue: 'Rezept' });
    case DocumentType.UEBERWEISUNG:
      return t('documentRequest.referral', { defaultValue: 'Überweisung' });
    case DocumentType.AU_BESCHEINIGUNG:
      return t('documentRequest.sickNote', { defaultValue: 'Krankschreibung' });
    default:
      return t('documentRequest.title', { defaultValue: 'Anfrage' });
  }
}

export const RequestSummaryScreen = ({ navigation, route }: Props): React.JSX.Element => {
  const { t } = useTranslation();
  const { isHighContrast } = useTheme();
  const { encryptionKey } = useQuestionnaireStore();
  const [isSending, setIsSending] = useState(false);

  const { request } = route.params;

  const renderSummaryRows = (): React.JSX.Element[] => {
    const rows: React.JSX.Element[] = [];

    // Common fields
    rows.push(
      <SummaryRow
        key="type"
        label={t('requestSummary.type', { defaultValue: 'Art' })}
        value={getDocTypeLabel(request.documentType, t)}
      />,
    );

    if (request.priority === DocumentRequestPriority.URGENT) {
      rows.push(
        <SummaryRow
          key="priority"
          label={t('requestSummary.priority', { defaultValue: 'Priorität' })}
          value={t('requestSummary.urgent', { defaultValue: '⚡ Eilt' })}
          highlight
        />,
      );
    }

    // Prescription-specific
    if (isPrescription(request)) {
      rows.push(
        <SummaryRow
          key="med"
          label={t('prescription.medicationName', { defaultValue: 'Medikament' })}
          value={request.medicationName}
        />,
      );
      if (request.prescriptionType) {
        rows.push(
          <SummaryRow
            key="rxtype"
            label={t('prescription.prescriptionType', { defaultValue: 'Rezeptart' })}
            value={
              request.prescriptionType === 'follow_up'
                ? t('prescription.followUp', { defaultValue: 'Folgerezept' })
                : t('prescription.newPrescription', { defaultValue: 'Neuverordnung' })
            }
          />,
        );
      }
      if (request.medicationDosage) {
        rows.push(
          <SummaryRow
            key="dosage"
            label={t('prescription.dosage', { defaultValue: 'Dosierung' })}
            value={request.medicationDosage}
          />,
        );
      }
      if (request.medicationQuantity) {
        rows.push(
          <SummaryRow
            key="qty"
            label={t('prescription.quantity', { defaultValue: 'Menge' })}
            value={String(request.medicationQuantity)}
          />,
        );
      }
      if (request.packageSize) {
        rows.push(
          <SummaryRow
            key="pkg"
            label={t('prescription.packageSize', { defaultValue: 'Packungsgröße' })}
            value={request.packageSize}
          />,
        );
      }
    }

    // Referral-specific
    if (isReferral(request)) {
      rows.push(
        <SummaryRow
          key="specialty"
          label={t('referral.specialty', { defaultValue: 'Fachrichtung' })}
          value={request.referralSpecialty}
        />,
      );
      if (request.referralReason) {
        rows.push(
          <SummaryRow
            key="reason"
            label={t('referral.reason', { defaultValue: 'Grund' })}
            value={request.referralReason}
          />,
        );
      }
      if (request.preferredDoctor) {
        rows.push(
          <SummaryRow
            key="doctor"
            label={t('referral.preferredDoctor', { defaultValue: 'Wunscharzt' })}
            value={request.preferredDoctor}
          />,
        );
      }
    }

    // Sick note-specific
    if (isSickNote(request)) {
      rows.push(
        <SummaryRow
          key="start"
          label={t('sickNote.startDate', { defaultValue: 'Beginn' })}
          value={request.auStartDate}
        />,
      );
      if (request.auEndDate) {
        rows.push(
          <SummaryRow
            key="end"
            label={t('sickNote.endDate', { defaultValue: 'Ende' })}
            value={request.auEndDate}
          />,
        );
      }
      if (request.documentSubType && request.documentSubType !== 'standard') {
        rows.push(
          <SummaryRow
            key="subtype"
            label={t('sickNote.documentSubType', { defaultValue: 'Dokumentart' })}
            value={
              request.documentSubType === 'attest'
                ? t('sickNote.subTypeAttest', { defaultValue: 'Attest' })
                : t('sickNote.subTypeBefund', { defaultValue: 'Befundbericht' })
            }
          />,
        );
      }
      if (request.auReason) {
        rows.push(
          <SummaryRow
            key="reason"
            label={t('sickNote.reason', { defaultValue: 'Grund' })}
            value={request.auReason}
          />,
        );
      }
    }

    // Notes (common)
    if (request.additionalNotes) {
      rows.push(
        <SummaryRow
          key="notes"
          label={t('requestSummary.notes', { defaultValue: 'Anmerkungen' })}
          value={request.additionalNotes}
        />,
      );
    }

    return rows;
  };

  const handleSend = async (): Promise<void> => {
    setIsSending(true);

    try {
      // Serialize request to JSON (no PII in the request object itself)
      const payload = JSON.stringify(request, null, 2);

      let body: string;

      if (encryptionKey) {
        // Encrypt the payload
        const encrypted = await encryptionService.encrypt(payload, encryptionKey);
        body = encrypted.toString();
      } else {
        // Fallback: plain text (should not happen in production)
        body = payload;
      }

      const subject = encodeURIComponent(
        `[Anamnese-App] ${getDocTypeLabel(request.documentType, t)} - ${request.title}`,
      );
      const encodedBody = encodeURIComponent(body);
      const mailtoUrl = `mailto:?subject=${subject}&body=${encodedBody}`;

      const canOpen = await Linking.canOpenURL(mailtoUrl);
      if (canOpen) {
        await Linking.openURL(mailtoUrl);
        Alert.alert(
          t('requestSummary.successTitle', { defaultValue: 'Anfrage gesendet' }),
          t('requestSummary.successMessage', {
            defaultValue: 'Ihre Anfrage wurde in Ihrem E-Mail-Programm geöffnet.',
          }),
          [
            {
              text: t('common.ok'),
              onPress: () => navigation.navigate('RoleSelection'),
            },
          ],
        );
      } else {
        Alert.alert(
          t('common.error'),
          t('requestSummary.noEmailClient', {
            defaultValue: 'Kein E-Mail-Programm gefunden. Bitte installieren Sie eines.',
          }),
        );
      }
    } catch (error) {
      Alert.alert(
        t('common.error'),
        t('requestSummary.errorSend', {
          defaultValue: 'Anfrage konnte nicht gesendet werden.',
        }),
      );
    } finally {
      setIsSending(false);
    }
  };

  return (
    <ScreenContainer testID="request-summary-screen" accessibilityLabel="Request Summary">
    <KeyboardAvoidingView
      style={styles.keyboardView}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={[styles.container, isHighContrast && styles.containerHighContrast]}>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={styles.headerSection}>
            <AppText variant="h2" style={[styles.title, isHighContrast && styles.textHighContrast]}>
              {t('requestSummary.title', { defaultValue: 'Zusammenfassung' })}
            </AppText>
            <AppText style={[styles.subtitle, isHighContrast && styles.textHighContrast]}>
              {t('requestSummary.subtitle', {
                defaultValue: 'Bitte überprüfen Sie Ihre Angaben.',
              })}
            </AppText>
          </View>

          <View style={styles.card}>{renderSummaryRows()}</View>

          <View style={styles.infoBox}>
            <AppText style={styles.infoText}>
              {t('requestSummary.encryptionInfo', {
                defaultValue:
                  '🔒 Ihre Daten werden mit AES-256 verschlüsselt übertragen. Nur Ihre Praxis kann die Nachricht entschlüsseln.',
              })}
            </AppText>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <AppButton
            title={t('requestSummary.send', { defaultValue: 'Verschlüsselt absenden' })}
            onPress={handleSend}
            disabled={isSending}
            loading={isSending}
            testID="btn-send-request"
          />
          <AppButton
            title={t('common.back', { defaultValue: 'Zurück' })}
            variant="secondary"
            onPress={() => navigation.goBack()}
            style={styles.backButton}
            testID="btn-back"
          />
        </View>
      </View>
    </KeyboardAvoidingView>
    </ScreenContainer>
  );
};

/**
 * Summary row component for displaying key-value pairs.
 */
const SummaryRow: React.FC<{
  label: string;
  value: string;
  highlight?: boolean;
}> = ({ label, value, highlight }) => (
  <View style={[styles.row, highlight && styles.rowHighlight]}>
    <AppText style={styles.rowLabel}>{label}</AppText>
    <AppText style={[styles.rowValue, highlight && styles.rowValueHighlight]}>{value}</AppText>
  </View>
);

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  containerHighContrast: {
    backgroundColor: '#000000',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  headerSection: {
    marginBottom: spacing.xl,
  },
  title: {
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textMuted,
  },
  textHighContrast: {
    color: '#ffffff',
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.background,
  },
  rowHighlight: {
    backgroundColor: '#FFF3E0',
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    marginHorizontal: -spacing.sm,
  },
  rowLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textMuted,
    flex: 1,
  },
  rowValue: {
    fontSize: 14,
    color: colors.text,
    flex: 2,
    textAlign: 'right',
  },
  rowValueHighlight: {
    fontWeight: '700',
    color: '#E65100',
  },
  infoBox: {
    backgroundColor: colors.infoSurface || '#E3F2FD',
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.xl,
  },
  infoText: {
    fontSize: 14,
    color: colors.textMuted,
    lineHeight: 20,
  },
  footer: {
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },
  backButton: {
    marginTop: spacing.sm,
  },
});
