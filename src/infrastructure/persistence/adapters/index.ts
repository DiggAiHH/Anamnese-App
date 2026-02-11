/**
 * Database Adapters — Barrel Export
 *
 * Platform-agnostic persistence layer.
 * Use createDatabaseAdapter() to get the right adapter for the current platform.
 */

export type { IDatabaseAdapter, AdapterResultSet, AdapterTransaction } from './IDatabaseAdapter';
export { IndexedDBAdapter } from './IndexedDBAdapter';
export { AsyncStorageAdapter } from './AsyncStorageAdapter';
export { createDatabaseAdapter } from './createDatabaseAdapter';
export { parseSql } from './SqlParser';
export { executeOnStore, APP_TABLES } from './KVExecutor';
export type { KVStore, TableStore } from './KVExecutor';
