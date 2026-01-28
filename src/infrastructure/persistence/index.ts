/**
 * Persistence Module Exports
 *
 * Central export point for all persistence-related classes.
 */

// Database connection
export { DatabaseConnection, database, DB_NAME, DB_VERSION } from './DatabaseConnection';
export type { SQLiteDatabase, SQLiteTransaction, SQLiteExecuteResult } from './DatabaseConnection';

// SQLite Repositories (Production)
export { SQLitePatientRepository } from './SQLitePatientRepository';
export { SQLiteAnswerRepository } from './SQLiteAnswerRepository';
export { SQLiteQuestionnaireRepository } from './SQLiteQuestionnaireRepository';
export { SQLiteGDPRConsentRepository } from './SQLiteGDPRConsentRepository';
export { SQLiteDocumentRepository } from './SQLiteDocumentRepository';

// In-Memory Repositories (Testing)
export { InMemoryPatientRepository } from './InMemoryPatientRepository';
export { InMemoryAnswerRepository } from './InMemoryAnswerRepository';
export { InMemoryQuestionnaireRepository } from './InMemoryQuestionnaireRepository';
export { InMemoryGDPRConsentRepository } from './InMemoryGDPRConsentRepository';
export { InMemoryDocumentRepository } from './InMemoryDocumentRepository';

// Repository Factories
export { SQLiteRepositoryFactory, repositoryFactory } from './SQLiteRepositoryFactory';
export { InMemoryRepositoryFactory } from './InMemoryRepositoryFactory';
