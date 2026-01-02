import { DatabaseConnection } from './DatabaseConnection';
import { IGDPRConsentRepository } from '@domain/repositories/IGDPRConsentRepository';
import { GDPRConsentEntity, GDPRConsent } from '@domain/entities/GDPRConsent';

/**
 * SQLite implementation of GDPR Consent Repository
 * Handles storage and retrieval of GDPR consents (Art. 7 DSGVO)
 */
export class SQLiteGDPRConsentRepository implements IGDPRConsentRepository {
  constructor(private db: DatabaseConnection) {}

  /**
   * Save GDPR consent to database
   */
  async save(consent: GDPRConsentEntity): Promise<void> {
    const query = `
      INSERT OR REPLACE INTO gdpr_consents (
        id, patient_id, type, granted, granted_at, revoked_at,
        privacy_policy_version, legal_basis, purpose,
        data_categories, recipients, retention_period, audit_log
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      consent.id,
      consent.patientId,
      consent.type,
      consent.granted ? 1 : 0,
      consent.grantedAt?.getTime() || null,
      consent.revokedAt?.getTime() || null,
      consent.privacyPolicyVersion,
      consent.legalBasis,
      consent.purpose,
      JSON.stringify(consent.dataCategories),
      consent.recipients ? JSON.stringify(consent.recipients) : null,
      consent.retentionPeriod,
      JSON.stringify(consent.auditLog),
    ];

    await this.db.executeSql(query, params);
  }

  /**
   * Find consent by ID
   */
  async findById(id: string): Promise<GDPRConsentEntity | null> {
    const query = 'SELECT * FROM gdpr_consents WHERE id = ?';
    const results = await this.db.executeSql(query, [id]);

    if (results.rows.length === 0) {
      return null;
    }

    return this.mapRowToEntity(results.rows.item(0));
  }

  /**
   * Find all consents for a patient
   */
  async findByPatientId(patientId: string): Promise<GDPRConsentEntity[]> {
    const query = 'SELECT * FROM gdpr_consents WHERE patient_id = ? ORDER BY granted_at DESC';
    const results = await this.db.executeSql(query, [patientId]);

    const consents: GDPRConsentEntity[] = [];
    for (let i = 0; i < results.rows.length; i++) {
      consents.push(this.mapRowToEntity(results.rows.item(i)));
    }

    return consents;
  }

  /**
   * Find specific consent by patient and type
   */
  async findByPatientAndType(patientId: string, type: string): Promise<GDPRConsentEntity | null> {
    const query = `
      SELECT * FROM gdpr_consents
      WHERE patient_id = ? AND type = ?
      ORDER BY granted_at DESC
      LIMIT 1
    `;
    const results = await this.db.executeSql(query, [patientId, type]);

    if (results.rows.length === 0) {
      return null;
    }

    return this.mapRowToEntity(results.rows.item(0));
  }

  /**
   * Find all granted consents for a patient
   */
  async findGrantedConsents(patientId: string): Promise<GDPRConsentEntity[]> {
    const query = `
      SELECT * FROM gdpr_consents
      WHERE patient_id = ? AND granted = 1 AND revoked_at IS NULL
      ORDER BY granted_at DESC
    `;
    const results = await this.db.executeSql(query, [patientId]);

    const consents: GDPRConsentEntity[] = [];
    for (let i = 0; i < results.rows.length; i++) {
      consents.push(this.mapRowToEntity(results.rows.item(i)));
    }

    return consents;
  }

  /**
   * Find all revoked consents for a patient
   */
  async findRevokedConsents(patientId: string): Promise<GDPRConsentEntity[]> {
    const query = `
      SELECT * FROM gdpr_consents
      WHERE patient_id = ? AND granted = 0 AND revoked_at IS NOT NULL
      ORDER BY revoked_at DESC
    `;
    const results = await this.db.executeSql(query, [patientId]);

    const consents: GDPRConsentEntity[] = [];
    for (let i = 0; i < results.rows.length; i++) {
      consents.push(this.mapRowToEntity(results.rows.item(i)));
    }

    return consents;
  }

  /**
   * Check if specific consent is granted and active
   */
  async isConsentGranted(patientId: string, type: string): Promise<boolean> {
    const query = `
      SELECT COUNT(*) as count FROM gdpr_consents
      WHERE patient_id = ? AND type = ? AND granted = 1 AND revoked_at IS NULL
    `;
    const results = await this.db.executeSql(query, [patientId, type]);

    if (results.rows.length === 0) {
      return false;
    }

    return results.rows.item(0).count > 0;
  }

  /**
   * Delete consent by ID
   */
  async delete(id: string): Promise<void> {
    const query = 'DELETE FROM gdpr_consents WHERE id = ?';
    await this.db.executeSql(query, [id]);
  }

  /**
   * Delete all consents for a patient (for GDPR right to deletion)
   */
  async deleteByPatientId(patientId: string): Promise<void> {
    const query = 'DELETE FROM gdpr_consents WHERE patient_id = ?';
    await this.db.executeSql(query, [patientId]);
  }

  async findByPatientIdAndType(patientId: string, type: GDPRConsent['type']): Promise<GDPRConsentEntity | null> {
    return this.findByPatientAndType(patientId, type);
  }

  async hasActiveConsent(patientId: string, type: GDPRConsent['type']): Promise<boolean> {
    return this.isConsentGranted(patientId, type);
  }

  async getAllActiveConsents(): Promise<GDPRConsentEntity[]> {
    const query = `
      SELECT * FROM gdpr_consents
      WHERE granted = 1 AND revoked_at IS NULL
      ORDER BY granted_at DESC
    `;
    const results = await this.db.executeSql(query, []);

    const consents: GDPRConsentEntity[] = [];
    for (let i = 0; i < results.rows.length; i++) {
      consents.push(this.mapRowToEntity(results.rows.item(i)));
    }
    return consents;
  }

  async getConsentHistory(patientId: string, type?: GDPRConsent['type']): Promise<GDPRConsentEntity[]> {
    const query = type
      ? `SELECT * FROM gdpr_consents WHERE patient_id = ? AND type = ? ORDER BY granted_at DESC`
      : `SELECT * FROM gdpr_consents WHERE patient_id = ? ORDER BY granted_at DESC`;

    const params = type ? [patientId, type] : [patientId];
    const results = await this.db.executeSql(query, params);

    const consents: GDPRConsentEntity[] = [];
    for (let i = 0; i < results.rows.length; i++) {
      consents.push(this.mapRowToEntity(results.rows.item(i)));
    }
    return consents;
  }

  /**
   * Get consent statistics for a patient
   */
  async getConsentStatistics(patientId: string): Promise<{
    total: number;
    granted: number;
    revoked: number;
    pending: number;
  }> {
    const query = `
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN granted = 1 AND revoked_at IS NULL THEN 1 ELSE 0 END) as granted,
        SUM(CASE WHEN granted = 0 AND revoked_at IS NOT NULL THEN 1 ELSE 0 END) as revoked,
        SUM(CASE WHEN granted = 0 AND revoked_at IS NULL THEN 1 ELSE 0 END) as pending
      FROM gdpr_consents
      WHERE patient_id = ?
    `;
    const results = await this.db.executeSql(query, [patientId]);

    if (results.rows.length === 0) {
      return { total: 0, granted: 0, revoked: 0, pending: 0 };
    }

    const row = results.rows.item(0);
    return {
      total: row.total || 0,
      granted: row.granted || 0,
      revoked: row.revoked || 0,
      pending: row.pending || 0,
    };
  }

  /**
   * Find consents expiring soon (based on retention period)
   */
  async findExpiringSoon(daysThreshold: number = 30): Promise<GDPRConsentEntity[]> {
    const query = `
      SELECT * FROM gdpr_consents
      WHERE granted = 1 AND revoked_at IS NULL
      ORDER BY granted_at ASC
    `;
    const results = await this.db.executeSql(query, []);

    const consents: GDPRConsentEntity[] = [];
    const now = new Date();

    for (let i = 0; i < results.rows.length; i++) {
      const consent = this.mapRowToEntity(results.rows.item(i));
      const expirationDate = consent.calculateExpirationDate();

      if (expirationDate) {
        const daysUntilExpiration = Math.floor(
          (expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        );

        if (daysUntilExpiration <= daysThreshold && daysUntilExpiration >= 0) {
          consents.push(consent);
        }
      }
    }

    return consents;
  }

  /**
   * Map database row to GDPRConsentEntity
   */
  private mapRowToEntity(row: any): GDPRConsentEntity {
    return GDPRConsentEntity.fromJSON({
      id: row.id,
      patientId: row.patient_id,
      type: row.type,
      granted: row.granted === 1,
      grantedAt: row.granted_at ? new Date(row.granted_at) : undefined,
      revokedAt: row.revoked_at ? new Date(row.revoked_at) : undefined,
      privacyPolicyVersion: row.privacy_policy_version,
      legalBasis: row.legal_basis,
      purpose: row.purpose,
      dataCategories: JSON.parse(row.data_categories),
      recipients: row.recipients ? JSON.parse(row.recipients) : undefined,
      retentionPeriod: row.retention_period,
      auditLog: JSON.parse(row.audit_log),
    });
  }
}
