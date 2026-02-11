/**
 * QuestionUniverseLookupService
 *
 * Cached bridge between legacy template question IDs (e.g., "1000", "7000_freitext")
 * and QuestionUniverse entities (UUID-based, with rich metadata).
 *
 * USAGE:
 *   const lookup = new QuestionUniverseLookupService(repo);
 *   await lookup.initialize();          // populate cache once
 *   const entity = lookup.getByTemplateId("1000");
 *   const uuid   = lookup.getUniverseId("1000");
 *   const meta   = lookup.getMetadata("1000");
 *
 * DESIGN:
 * - In-memory Map keyed by legacy `templateId`.
 * - Populated once via `initialize()`, invalidated via `invalidate()`.
 * - Thread-safe: read-only after init; invalidate + re-init if template changes.
 *
 * @security No PII. Only structural metadata.
 */

import { QuestionUniverseEntity, QuestionUniverseMetadata } from '../../domain/entities/QuestionUniverse';
import { IQuestionUniverseRepository } from '../../domain/repositories/IQuestionUniverseRepository';

export class QuestionUniverseLookupService {
  /** templateId → QuestionUniverseEntity */
  private cache = new Map<string, QuestionUniverseEntity>();
  private initialized = false;

  constructor(private readonly repository: IQuestionUniverseRepository) {}

  // =============== Lifecycle ===============

  /**
   * Populate the cache from the repository.
   * Safe to call multiple times (idempotent after first load).
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    const all = await this.repository.findAll();
    this.cache.clear();

    for (const entity of all) {
      // templateId is the legacy question.id from questionnaire-template.json
      this.cache.set(entity.templateId, entity);
    }

    this.initialized = true;
  }

  /**
   * Force re-populate the cache (e.g., after migration).
   */
  async refresh(): Promise<void> {
    this.initialized = false;
    await this.initialize();
  }

  /**
   * Clear the cache. Next call to any getter will require re-initialization.
   */
  invalidate(): void {
    this.cache.clear();
    this.initialized = false;
  }

  /** Whether the cache has been populated. */
  get isInitialized(): boolean {
    return this.initialized;
  }

  /** Number of cached entries. */
  get size(): number {
    return this.cache.size;
  }

  // =============== Lookups ===============

  /**
   * Get QuestionUniverseEntity by legacy template question ID.
   * @returns Entity or undefined if not found.
   */
  getByTemplateId(templateId: string): QuestionUniverseEntity | undefined {
    return this.cache.get(templateId);
  }

  /**
   * Get the persistent UUID for a legacy template question ID.
   * @returns UUID string or undefined.
   */
  getUniverseId(templateId: string): string | undefined {
    return this.cache.get(templateId)?.id;
  }

  /**
   * Get metadata for a legacy template question ID.
   * @returns QuestionUniverseMetadata or undefined.
   */
  getMetadata(templateId: string): QuestionUniverseMetadata | undefined {
    return this.cache.get(templateId)?.metadata;
  }

  /**
   * Get ICD-10 codes for a legacy template question ID.
   * @returns Array of ICD-10 codes, or empty array.
   */
  getIcd10Codes(templateId: string): string[] {
    return this.cache.get(templateId)?.metadata.icd10Codes ?? [];
  }

  /**
   * Get statistic group for a legacy template question ID.
   * @returns Group name or undefined.
   */
  getStatisticGroup(templateId: string): string | undefined {
    return this.cache.get(templateId)?.metadata.statisticGroup;
  }

  /**
   * Get GDT field ID for a legacy template question ID.
   * @returns GDT field ID or undefined.
   */
  getGdtFieldId(templateId: string): string | undefined {
    return this.cache.get(templateId)?.metadata.gdtFieldId;
  }

  /**
   * Check if a legacy question is GDPR-related.
   */
  isGdprRelated(templateId: string): boolean {
    return this.cache.get(templateId)?.metadata.gdprRelated ?? false;
  }

  /**
   * Get all entities grouped by statistic group.
   */
  getByStatisticGroup(): Map<string, QuestionUniverseEntity[]> {
    const groups = new Map<string, QuestionUniverseEntity[]>();

    for (const entity of this.cache.values()) {
      const group = entity.metadata.statisticGroup ?? 'Ungrouped';
      const list = groups.get(group) ?? [];
      list.push(entity);
      groups.set(group, list);
    }

    return groups;
  }

  /**
   * Get all entities matching a research tag.
   */
  getByResearchTag(tag: string): QuestionUniverseEntity[] {
    const result: QuestionUniverseEntity[] = [];
    for (const entity of this.cache.values()) {
      if (entity.hasResearchTag(tag)) {
        result.push(entity);
      }
    }
    return result;
  }

  /**
   * Get all cached entities as an array.
   */
  getAll(): QuestionUniverseEntity[] {
    return Array.from(this.cache.values());
  }
}
