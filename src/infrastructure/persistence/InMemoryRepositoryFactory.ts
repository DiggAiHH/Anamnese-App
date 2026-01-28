/**
 * In-Memory Repository Factory
 *
 * Testing implementation of IRepositoryFactory using in-memory repositories.
 * Provides deterministic, isolated behavior for unit and integration tests.
 *
 * @security TEST ONLY - Never use in production.
 *
 * @example
 * ```ts
 * const factory = new InMemoryRepositoryFactory();
 * const patientRepo = factory.getPatientRepository();
 * await patientRepo.save(patient);
 *
 * // After test - clear all data
 * await factory.clearAll();
 * ```
 */

import { IRepositoryFactory } from '@domain/repositories/IRepositoryFactory';
import { IPatientRepository } from '@domain/repositories/IPatientRepository';
import { IAnswerRepository } from '@domain/repositories/IAnswerRepository';
import { IQuestionnaireRepository } from '@domain/repositories/IQuestionnaireRepository';
import { IGDPRConsentRepository } from '@domain/repositories/IGDPRConsentRepository';
import { IDocumentRepository } from '@domain/repositories/IDocumentRepository';

import { InMemoryPatientRepository } from './InMemoryPatientRepository';
import { InMemoryAnswerRepository } from './InMemoryAnswerRepository';
import { InMemoryQuestionnaireRepository } from './InMemoryQuestionnaireRepository';
import { InMemoryGDPRConsentRepository } from './InMemoryGDPRConsentRepository';
import { InMemoryDocumentRepository } from './InMemoryDocumentRepository';

/**
 * Factory for creating in-memory repository instances.
 * All repositories are pre-initialized and ready for use.
 */
export class InMemoryRepositoryFactory implements IRepositoryFactory {
  private patientRepo = new InMemoryPatientRepository();
  private answerRepo = new InMemoryAnswerRepository();
  private questionnaireRepo = new InMemoryQuestionnaireRepository();
  private gdprConsentRepo = new InMemoryGDPRConsentRepository();
  private documentRepo = new InMemoryDocumentRepository();
  private initialized = true; // Always ready

  getPatientRepository(): IPatientRepository {
    return this.patientRepo;
  }

  getAnswerRepository(): IAnswerRepository {
    return this.answerRepo;
  }

  getQuestionnaireRepository(): IQuestionnaireRepository {
    return this.questionnaireRepo;
  }

  getGDPRConsentRepository(): IGDPRConsentRepository {
    return this.gdprConsentRepo;
  }

  getDocumentRepository(): IDocumentRepository {
    return this.documentRepo;
  }

  async initialize(): Promise<void> {
    // No-op for in-memory repositories
    this.initialized = true;
  }

  async clearAll(): Promise<void> {
    this.patientRepo.clear();
    this.answerRepo.clear();
    this.questionnaireRepo.clear();
    this.gdprConsentRepo.clear();
    this.documentRepo.clear();
  }

  isReady(): boolean {
    return this.initialized;
  }

  // Test utility methods

  /**
   * Get the underlying patient repository for test assertions.
   */
  getPatientRepositoryImpl(): InMemoryPatientRepository {
    return this.patientRepo;
  }

  /**
   * Get the underlying answer repository for test assertions.
   */
  getAnswerRepositoryImpl(): InMemoryAnswerRepository {
    return this.answerRepo;
  }

  /**
   * Get the underlying questionnaire repository for test assertions.
   */
  getQuestionnaireRepositoryImpl(): InMemoryQuestionnaireRepository {
    return this.questionnaireRepo;
  }

  /**
   * Get the underlying GDPR consent repository for test assertions.
   */
  getGDPRConsentRepositoryImpl(): InMemoryGDPRConsentRepository {
    return this.gdprConsentRepo;
  }

  /**
   * Get the underlying document repository for test assertions.
   */
  getDocumentRepositoryImpl(): InMemoryDocumentRepository {
    return this.documentRepo;
  }
}
