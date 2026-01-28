/**
 * Repository Factory Interface
 *
 * Provides dependency injection for repository implementations.
 * Allows switching between SQLite (production) and InMemory (testing) repositories.
 *
 * Usage:
 * - Production: Use SQLiteRepositoryFactory
 * - Testing: Use InMemoryRepositoryFactory
 *
 * @example
 * ```ts
 * const factory = new SQLiteRepositoryFactory();
 * const patientRepo = factory.getPatientRepository();
 * await patientRepo.save(patient);
 * ```
 */

import { IPatientRepository } from './IPatientRepository';
import { IAnswerRepository } from './IAnswerRepository';
import { IQuestionnaireRepository } from './IQuestionnaireRepository';
import { IGDPRConsentRepository } from './IGDPRConsentRepository';
import { IDocumentRepository } from './IDocumentRepository';

export interface IRepositoryFactory {
  /**
   * Get patient repository instance.
   * Handles encrypted patient data storage.
   */
  getPatientRepository(): IPatientRepository;

  /**
   * Get answer repository instance.
   * Handles questionnaire answer storage.
   */
  getAnswerRepository(): IAnswerRepository;

  /**
   * Get questionnaire repository instance.
   * Handles questionnaire templates and instances.
   */
  getQuestionnaireRepository(): IQuestionnaireRepository;

  /**
   * Get GDPR consent repository instance.
   * Handles consent management (DSGVO Art. 7).
   */
  getGDPRConsentRepository(): IGDPRConsentRepository;

  /**
   * Get document repository instance.
   * Handles file/document storage.
   */
  getDocumentRepository(): IDocumentRepository;

  /**
   * Initialize all repositories.
   * Creates database tables/indexes if needed.
   */
  initialize(): Promise<void>;

  /**
   * Clear all data (for testing or GDPR Art. 17).
   * @security This operation is irreversible.
   */
  clearAll(): Promise<void>;

  /**
   * Check if repositories are ready for use.
   */
  isReady(): boolean;
}
