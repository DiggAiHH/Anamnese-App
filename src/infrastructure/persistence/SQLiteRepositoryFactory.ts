/**
 * SQLite Repository Factory
 *
 * Production implementation of IRepositoryFactory using SQLite repositories.
 * All repositories share the same database connection.
 *
 * @security All data is encrypted at rest using AES-GCM.
 */

import { IRepositoryFactory } from '@domain/repositories/IRepositoryFactory';
import { IPatientRepository } from '@domain/repositories/IPatientRepository';
import { IAnswerRepository } from '@domain/repositories/IAnswerRepository';
import { IQuestionnaireRepository } from '@domain/repositories/IQuestionnaireRepository';
import { IGDPRConsentRepository } from '@domain/repositories/IGDPRConsentRepository';
import { IDocumentRepository } from '@domain/repositories/IDocumentRepository';

import { SQLitePatientRepository } from './SQLitePatientRepository';
import { SQLiteAnswerRepository } from './SQLiteAnswerRepository';
import { SQLiteQuestionnaireRepository } from './SQLiteQuestionnaireRepository';
import { SQLiteGDPRConsentRepository } from './SQLiteGDPRConsentRepository';
import { SQLiteDocumentRepository } from './SQLiteDocumentRepository';
import { database, DatabaseConnection } from './DatabaseConnection';

/**
 * Factory for creating SQLite-backed repository instances.
 * Uses singleton pattern for database connection.
 */
export class SQLiteRepositoryFactory implements IRepositoryFactory {
  private patientRepo: IPatientRepository | null = null;
  private answerRepo: IAnswerRepository | null = null;
  private questionnaireRepo: IQuestionnaireRepository | null = null;
  private gdprConsentRepo: IGDPRConsentRepository | null = null;
  private documentRepo: IDocumentRepository | null = null;
  private initialized = false;

  constructor(private db: DatabaseConnection = database) {}

  getPatientRepository(): IPatientRepository {
    if (!this.patientRepo) {
      this.patientRepo = new SQLitePatientRepository();
    }
    return this.patientRepo;
  }

  getAnswerRepository(): IAnswerRepository {
    if (!this.answerRepo) {
      this.answerRepo = new SQLiteAnswerRepository();
    }
    return this.answerRepo;
  }

  getQuestionnaireRepository(): IQuestionnaireRepository {
    if (!this.questionnaireRepo) {
      this.questionnaireRepo = new SQLiteQuestionnaireRepository();
    }
    return this.questionnaireRepo;
  }

  getGDPRConsentRepository(): IGDPRConsentRepository {
    if (!this.gdprConsentRepo) {
      this.gdprConsentRepo = new SQLiteGDPRConsentRepository(this.db);
    }
    return this.gdprConsentRepo;
  }

  getDocumentRepository(): IDocumentRepository {
    if (!this.documentRepo) {
      this.documentRepo = new SQLiteDocumentRepository(this.db);
    }
    return this.documentRepo;
  }

  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    // Connect to database (creates tables if needed)
    await this.db.connect();
    this.initialized = true;
  }

  async clearAll(): Promise<void> {
    await this.db.deleteAllData();
  }

  isReady(): boolean {
    return this.initialized;
  }
}

/**
 * Default singleton factory instance for production use.
 */
export const repositoryFactory = new SQLiteRepositoryFactory();
