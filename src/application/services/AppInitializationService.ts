/**
 * AppInitializationService
 *
 * Runs startup tasks that must complete before the app is fully usable:
 * 1. Template → QuestionUniverse migration (version-aware, idempotent)
 *
 * DESIGN:
 * - Singleton-ish: intended to be called once during app startup (App.tsx / RootNavigator).
 * - Guards against double-initialization via `initialized` flag.
 * - Errors are caught and logged — the app can still function without QuestionUniverse.
 *
 * @security No PII processed. Migration is structural metadata only.
 */

import { TemplateMigrationService } from '../../infrastructure/services/TemplateMigrationService';
import { logInfo, logError } from '../../shared/logger';

let initialized = false;

/**
 * Run all startup initialization tasks.
 * Safe to call multiple times — subsequent calls are no-ops.
 *
 * @returns true if initialization succeeded (or was already done), false on error.
 */
export async function initializeApp(): Promise<boolean> {
  if (initialized) return true;

  try {
    logInfo('[AppInit] Starting initialization...');

    // 1. Migrate template → QuestionUniverse (version-aware, idempotent)
    const migration = new TemplateMigrationService();
    const questionCount = await migration.migrate();
    logInfo(`[AppInit] QuestionUniverse: ${questionCount} questions ready.`);

    initialized = true;
    logInfo('[AppInit] Initialization complete.');
    return true;
  } catch (error) {
    logError('[AppInit] Initialization failed', error);
    // Don't rethrow — app can still function without QuestionUniverse.
    return false;
  }
}

/**
 * Reset initialization state (for testing only).
 */
export function resetInitialization(): void {
  initialized = false;
}

/**
 * Check whether the app has been initialized.
 */
export function isAppInitialized(): boolean {
  return initialized;
}
