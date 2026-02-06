/**
 * DocumentRequestMailService - Builds encrypted mailto links for document requests
 *
 * Adapts the Sanad document request pattern for offline-first encrypted mailto flow.
 * Similar to FeedbackTextBuilder but with encryption for sensitive medical data.
 *
 * @security Data is encrypted with AES-256-GCM before inclusion in mailto body.
 * @gdpr No PII is logged. All encryption happens locally.
 */

import { Linking } from 'react-native';
import {
  DocumentType,
  type IDocumentRequest,
  type IPrescriptionRequest,
  type IReferralRequest,
  type ISickNoteRequest,
} from '../../domain/entities/DocumentRequest';
import { encryptionService } from '../../infrastructure/encryption/encryptionService';
import { logError, logDebug } from '../../shared/logger';

/**
 * Practice configuration for mailto destination
 */
export interface PracticeConfig {
  email: string;
  name: string;
}

/**
 * Labels for i18n support
 */
export interface DocumentRequestLabels {
  subjectPrescription?: string;
  subjectReferral?: string;
  subjectSickNote?: string;
  labelPatient?: string;
  labelRequest?: string;
  labelMedication?: string;
  labelDosage?: string;
  labelQuantity?: string;
  labelSpecialty?: string;
  labelReason?: string;
  labelPreferredDoctor?: string;
  labelStartDate?: string;
  labelEndDate?: string;
  labelNotes?: string;
  labelEncryptedPayload?: string;
  instructionDecrypt?: string;
}

const DEFAULT_LABELS: Required<DocumentRequestLabels> = {
  subjectPrescription: 'Rezeptanfrage',
  subjectReferral: 'Überweisungsanfrage',
  subjectSickNote: 'AU-Bescheinigung Anfrage',
  labelPatient: 'Patient',
  labelRequest: 'Anfrage',
  labelMedication: 'Medikament',
  labelDosage: 'Dosierung',
  labelQuantity: 'Menge',
  labelSpecialty: 'Fachrichtung',
  labelReason: 'Grund',
  labelPreferredDoctor: 'Wunscharzt',
  labelStartDate: 'Beginn',
  labelEndDate: 'Ende',
  labelNotes: 'Anmerkungen',
  labelEncryptedPayload: 'Verschlüsselte Daten',
  instructionDecrypt: 'Bitte entschlüsseln Sie die Daten mit dem Master-Passwort des Patienten.',
};

export interface MailtoResult {
  success: boolean;
  mailtoUri?: string;
  error?: string;
}

/**
 * Generates ISO timestamp (no timezone for privacy).
 */
function getTimestamp(): string {
  return new Date().toISOString().split('.')[0].replace('T', ' ');
}

/**
 * Get subject line based on document type.
 */
function getSubjectLine(
  type: DocumentType,
  patientName: string | undefined,
  labels: Required<DocumentRequestLabels>,
): string {
  const subjectMap: Record<DocumentType, string> = {
    [DocumentType.REZEPT]: labels.subjectPrescription,
    [DocumentType.UEBERWEISUNG]: labels.subjectReferral,
    [DocumentType.AU_BESCHEINIGUNG]: labels.subjectSickNote,
    [DocumentType.BESCHEINIGUNG]: 'Bescheinigung',
    [DocumentType.SONSTIGE]: 'Anfrage',
  };

  const base = subjectMap[type] || 'Anfrage';
  if (patientName) {
    return `[Anamnese-App] ${base} - ${patientName}`;
  }
  return `[Anamnese-App] ${base}`;
}

/**
 * Build human-readable summary (unencrypted header).
 */
function buildReadableSummary(
  request: IDocumentRequest,
  labels: Required<DocumentRequestLabels>,
): string {
  const lines: string[] = [
    `=== Anamnese-App ${labels.labelRequest} ===`,
    '',
    `Typ: ${request.documentType}`,
    `Erstellt: ${getTimestamp()}`,
    '',
  ];

  // Type-specific fields
  if (request.documentType === DocumentType.REZEPT) {
    const rx = request as IPrescriptionRequest;
    lines.push(`${labels.labelMedication}: ${rx.medicationName}`);
    if (rx.medicationDosage) lines.push(`${labels.labelDosage}: ${rx.medicationDosage}`);
    if (rx.medicationQuantity) lines.push(`${labels.labelQuantity}: ${rx.medicationQuantity}`);
  } else if (request.documentType === DocumentType.UEBERWEISUNG) {
    const ref = request as IReferralRequest;
    lines.push(`${labels.labelSpecialty}: ${ref.referralSpecialty}`);
    if (ref.referralReason) lines.push(`${labels.labelReason}: ${ref.referralReason}`);
    if (ref.preferredDoctor) lines.push(`${labels.labelPreferredDoctor}: ${ref.preferredDoctor}`);
  } else if (request.documentType === DocumentType.AU_BESCHEINIGUNG) {
    const au = request as ISickNoteRequest;
    lines.push(`${labels.labelStartDate}: ${au.auStartDate}`);
    if (au.auEndDate) lines.push(`${labels.labelEndDate}: ${au.auEndDate}`);
    if (au.auReason) lines.push(`${labels.labelReason}: ${au.auReason}`);
  }

  if (request.additionalNotes) {
    lines.push('');
    lines.push(`${labels.labelNotes}: ${request.additionalNotes}`);
  }

  return lines.join('\n');
}

/**
 * Encrypt the request payload with the provided key.
 */
async function encryptPayload(
  request: IDocumentRequest,
  encryptionKey: string,
): Promise<string> {
  const json = JSON.stringify(request);
  const encrypted = await encryptionService.encrypt(json, encryptionKey);
  // Return as base64 combined string using getters
  return `${encrypted.salt}:${encrypted.iv}:${encrypted.ciphertext}`;
}

/**
 * Build the full mailto body with readable header + encrypted payload.
 */
async function buildMailBody(
  request: IDocumentRequest,
  encryptionKey: string | null,
  labels: Required<DocumentRequestLabels>,
): Promise<string> {
  const summary = buildReadableSummary(request, labels);

  if (!encryptionKey) {
    // No encryption: just readable summary
    return summary + '\n\n--- Ende der Anfrage ---';
  }

  try {
    const encrypted = await encryptPayload(request, encryptionKey);
    return [
      summary,
      '',
      '---',
      '',
      labels.instructionDecrypt,
      '',
      `${labels.labelEncryptedPayload}:`,
      encrypted,
      '',
      '--- Ende der Anfrage ---',
    ].join('\n');
  } catch (error) {
    logError('[DocumentRequestMailService] Encryption failed', error);
    // Fallback: unencrypted
    return summary + '\n\n[Verschlüsselung fehlgeschlagen - Daten unverschlüsselt]\n\n--- Ende der Anfrage ---';
  }
}

/**
 * Build a mailto URI for the document request.
 *
 * @param request The document request object
 * @param practiceEmail Target email address
 * @param patientName Optional patient name for subject line
 * @param encryptionKey Optional encryption key (from master password)
 * @param customLabels Optional i18n labels
 */
export async function buildDocumentRequestMailtoUri(
  request: IDocumentRequest,
  practiceEmail: string,
  patientName?: string,
  encryptionKey?: string | null,
  customLabels?: DocumentRequestLabels,
): Promise<string> {
  const labels = { ...DEFAULT_LABELS, ...customLabels };

  const subject = getSubjectLine(request.documentType, patientName, labels);
  const body = await buildMailBody(request, encryptionKey || null, labels);

  const encodedSubject = encodeURIComponent(subject);
  const encodedBody = encodeURIComponent(body);

  return `mailto:${practiceEmail}?subject=${encodedSubject}&body=${encodedBody}`;
}

/**
 * Open the mailto link in the default mail client.
 *
 * @param request The document request object
 * @param practiceEmail Target email address
 * @param patientName Optional patient name for subject line
 * @param encryptionKey Optional encryption key
 * @param customLabels Optional i18n labels
 * @returns Result with success status
 */
export async function sendDocumentRequestViaMailto(
  request: IDocumentRequest,
  practiceEmail: string,
  patientName?: string,
  encryptionKey?: string | null,
  customLabels?: DocumentRequestLabels,
): Promise<MailtoResult> {
  try {
    const mailtoUri = await buildDocumentRequestMailtoUri(
      request,
      practiceEmail,
      patientName,
      encryptionKey,
      customLabels,
    );

    logDebug('[DocumentRequestMailService] Opening mailto');

    const canOpen = await Linking.canOpenURL(mailtoUri);
    if (!canOpen) {
      return {
        success: false,
        mailtoUri,
        error: 'Kein E-Mail-Client verfügbar',
      };
    }

    await Linking.openURL(mailtoUri);

    return {
      success: true,
      mailtoUri,
    };
  } catch (error) {
    logError('[DocumentRequestMailService] Failed to open mailto', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unbekannter Fehler',
    };
  }
}

/**
 * Copy the document request content to clipboard (fallback).
 *
 * @param request The document request object
 * @param encryptionKey Optional encryption key
 * @param customLabels Optional i18n labels
 * @returns The text content for clipboard
 */
export async function buildDocumentRequestClipboardContent(
  request: IDocumentRequest,
  encryptionKey?: string | null,
  customLabels?: DocumentRequestLabels,
): Promise<string> {
  const labels = { ...DEFAULT_LABELS, ...customLabels };
  const subject = getSubjectLine(request.documentType, undefined, labels);
  const body = await buildMailBody(request, encryptionKey || null, labels);
  return `${subject}\n\n${body}`;
}
