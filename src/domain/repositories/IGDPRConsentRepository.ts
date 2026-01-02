/**
 * Repository Interface für GDPR Consent
 */

import { GDPRConsentEntity } from '../entities/GDPRConsent';
import { GDPRConsent } from '../entities/GDPRConsent';

export interface IGDPRConsentRepository {
  /**
   * Consent speichern
   */
  save(consent: GDPRConsentEntity): Promise<void>;

  /**
   * Consent anhand ID finden
   */
  findById(id: string): Promise<GDPRConsentEntity | null>;

  /**
   * Alle Consents für einen Patienten finden
   */
  findByPatientId(patientId: string): Promise<GDPRConsentEntity[]>;

  /**
   * Spezifischen Consent-Type für Patienten finden (neueste Version)
   */
  findByPatientIdAndType(
    patientId: string,
    type: GDPRConsent['type'],
  ): Promise<GDPRConsentEntity | null>;

  /**
   * Prüft ob Patient spezifischen Consent erteilt hat
   */
  hasActiveConsent(
    patientId: string,
    type: GDPRConsent['type'],
  ): Promise<boolean>;

  /**
   * Alle Consents eines Patienten löschen
   */
  deleteByPatientId(patientId: string): Promise<void>;

  /**
   * Audit: Alle erteilten Consents abrufen (für DSGVO Art. 30)
   */
  getAllActiveConsents(): Promise<GDPRConsentEntity[]>;

  /**
   * Audit: Consent-Historie für Patienten abrufen
   */
  getConsentHistory(
    patientId: string,
    type?: GDPRConsent['type'],
  ): Promise<GDPRConsentEntity[]>;
}
