/**
 * In-Memory GDPR Consent Repository
 *
 * Deterministic implementation for testing purposes.
 *
 * @security TEST ONLY - Never use in production.
 */

import { GDPRConsentEntity, GDPRConsent } from '@domain/entities/GDPRConsent';
import { IGDPRConsentRepository } from '@domain/repositories/IGDPRConsentRepository';

// Type for raw consent data
type GDPRConsentData = ReturnType<GDPRConsentEntity['toJSON']>;

export class InMemoryGDPRConsentRepository implements IGDPRConsentRepository {
  private consents = new Map<string, GDPRConsentData>();

  async save(consent: GDPRConsentEntity): Promise<void> {
    const json = consent.toJSON();
    this.consents.set(json.id, json);
  }

  async findById(id: string): Promise<GDPRConsentEntity | null> {
    const data = this.consents.get(id);
    if (!data) {
      return null;
    }
    return GDPRConsentEntity.fromJSON(data);
  }

  async findByPatientId(patientId: string): Promise<GDPRConsentEntity[]> {
    const results: GDPRConsentEntity[] = [];
    for (const data of this.consents.values()) {
      if (data.patientId === patientId) {
        results.push(GDPRConsentEntity.fromJSON(data));
      }
    }
    return results;
  }

  async findByPatientIdAndType(
    patientId: string,
    type: GDPRConsent['type'],
  ): Promise<GDPRConsentEntity | null> {
    // Find most recent consent of this type for patient
    let newest: GDPRConsentData | null = null;
    let newestTime = 0;

    for (const data of this.consents.values()) {
      if (data.patientId === patientId && data.type === type) {
        const grantedTime = data.grantedAt?.getTime() ?? 0;
        if (grantedTime > newestTime) {
          newest = data;
          newestTime = grantedTime;
        }
      }
    }

    if (!newest) {
      return null;
    }
    return GDPRConsentEntity.fromJSON(newest);
  }

  async hasActiveConsent(patientId: string, type: GDPRConsent['type']): Promise<boolean> {
    for (const data of this.consents.values()) {
      if (
        data.patientId === patientId &&
        data.type === type &&
        data.granted &&
        !data.revokedAt
      ) {
        return true;
      }
    }
    return false;
  }

  async deleteByPatientId(patientId: string): Promise<void> {
    const toDelete: string[] = [];
    for (const [id, data] of this.consents.entries()) {
      if (data.patientId === patientId) {
        toDelete.push(id);
      }
    }
    for (const id of toDelete) {
      this.consents.delete(id);
    }
  }

  async getAllActiveConsents(): Promise<GDPRConsentEntity[]> {
    const results: GDPRConsentEntity[] = [];
    for (const data of this.consents.values()) {
      if (data.granted && !data.revokedAt) {
        results.push(GDPRConsentEntity.fromJSON(data));
      }
    }
    return results;
  }

  async getConsentHistory(
    patientId: string,
    type?: GDPRConsent['type'],
  ): Promise<GDPRConsentEntity[]> {
    const results: GDPRConsentEntity[] = [];
    for (const data of this.consents.values()) {
      if (data.patientId === patientId) {
        if (!type || data.type === type) {
          results.push(GDPRConsentEntity.fromJSON(data));
        }
      }
    }
    // Sort by grantedAt descending (newest first)
    return results.sort((a, b) => {
      const timeA = a.grantedAt?.getTime() ?? 0;
      const timeB = b.grantedAt?.getTime() ?? 0;
      return timeB - timeA;
    });
  }

  // Test utility methods
  clear(): void {
    this.consents.clear();
  }

  size(): number {
    return this.consents.size;
  }

  getAll(): GDPRConsentData[] {
    return Array.from(this.consents.values());
  }
}
