/**
 * LocalAnalyticsService - GDPR-Compliant Local Event Tracking
 *
 * @description Tracks anonymous usage events locally on device.
 *              NO cloud transmission, NO PII collection, NO costs.
 *
 * @security Art. 25 GDPR - Privacy by Design:
 *   - All data stays on device
 *   - Session IDs are random UUIDs (no device fingerprinting)
 *   - Event data contains NO personal information
 *   - Auto-purge after retention period (30 days default)
 *
 * @example
 * ```typescript
 * const analytics = LocalAnalyticsService.getInstance();
 * analytics.trackEvent('screen_view', { screen: 'HomeScreen' });
 * analytics.trackEvent('action', { action: 'export_pdf' });
 * const summary = await analytics.getEventSummary();
 * ```
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type EventCategory =
  | 'screen_view'
  | 'action'
  | 'error'
  | 'performance'
  | 'feature_usage';

export interface AnalyticsEvent {
  /** Random UUID per session (not persistent) */
  sessionId: string;
  /** Event category */
  category: EventCategory;
  /** Event name/action */
  name: string;
  /** Anonymous metadata (NO PII allowed) */
  metadata?: Record<string, string | number | boolean>;
  /** ISO timestamp */
  timestamp: string;
}

export interface EventSummary {
  totalEvents: number;
  eventsByCategory: Record<EventCategory, number>;
  topActions: Array<{ name: string; count: number }>;
  firstEventDate: string | null;
  lastEventDate: string | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const STORAGE_KEY = '@anamnese_local_analytics';
const MAX_EVENTS = 1000; // Prevent unbounded growth
const RETENTION_DAYS = 30;

// ─────────────────────────────────────────────────────────────────────────────
// Helper: Generate UUID v4
// ─────────────────────────────────────────────────────────────────────────────

function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Service Implementation
// ─────────────────────────────────────────────────────────────────────────────

export class LocalAnalyticsService {
  private static instance: LocalAnalyticsService | null = null;
  private sessionId: string;
  private events: AnalyticsEvent[] = [];
  private initialized = false;
  private enabled = true;

  private constructor() {
    // Generate new session ID for each app session (privacy-preserving)
    this.sessionId = generateUUID();
  }

  /**
   * Get singleton instance
   */
  static getInstance(): LocalAnalyticsService {
    if (!LocalAnalyticsService.instance) {
      LocalAnalyticsService.instance = new LocalAnalyticsService();
    }
    return LocalAnalyticsService.instance;
  }

  /**
   * Reset instance (for testing)
   */
  static resetInstance(): void {
    LocalAnalyticsService.instance = null;
  }

  /**
   * Initialize service - load persisted events
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as AnalyticsEvent[];
        this.events = this.purgeOldEvents(parsed);
      }
      this.initialized = true;
    } catch {
      // Silent fail - analytics should never break the app
      this.events = [];
      this.initialized = true;
    }
  }

  /**
   * Enable/disable analytics tracking
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  /**
   * Check if analytics is enabled
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Track an event
   *
   * @security Never pass PII (name, email, device ID) in metadata!
   */
  async trackEvent(
    category: EventCategory,
    name: string,
    metadata?: Record<string, string | number | boolean>,
  ): Promise<void> {
    if (!this.enabled) return;
    if (!this.initialized) await this.initialize();

    // Sanitize metadata - strip any potential PII patterns
    const sanitizedMetadata = metadata
      ? this.sanitizeMetadata(metadata)
      : undefined;

    const event: AnalyticsEvent = {
      sessionId: this.sessionId,
      category,
      name,
      metadata: sanitizedMetadata,
      timestamp: new Date().toISOString(),
    };

    this.events.push(event);

    // Enforce max events limit (FIFO)
    if (this.events.length > MAX_EVENTS) {
      this.events = this.events.slice(-MAX_EVENTS);
    }

    await this.persist();
  }

  /**
   * Track screen view (convenience method)
   */
  async trackScreenView(screenName: string): Promise<void> {
    await this.trackEvent('screen_view', screenName);
  }

  /**
   * Track action (convenience method)
   */
  async trackAction(actionName: string, metadata?: Record<string, string | number | boolean>): Promise<void> {
    await this.trackEvent('action', actionName, metadata);
  }

  /**
   * Track error (convenience method)
   *
   * @security Only track error type/code, NEVER stack traces with file paths
   */
  async trackError(errorType: string, errorCode?: string): Promise<void> {
    await this.trackEvent('error', errorType, errorCode ? { code: errorCode } : undefined);
  }

  /**
   * Track performance metric
   */
  async trackPerformance(metric: string, durationMs: number): Promise<void> {
    await this.trackEvent('performance', metric, { durationMs });
  }

  /**
   * Track feature usage
   */
  async trackFeatureUsage(feature: string): Promise<void> {
    await this.trackEvent('feature_usage', feature);
  }

  /**
   * Get all events (for debugging/export)
   */
  getEvents(): AnalyticsEvent[] {
    return [...this.events];
  }

  /**
   * Get event summary for dashboard display
   */
  async getEventSummary(): Promise<EventSummary> {
    if (!this.initialized) await this.initialize();

    const eventsByCategory: Record<EventCategory, number> = {
      screen_view: 0,
      action: 0,
      error: 0,
      performance: 0,
      feature_usage: 0,
    };

    const actionCounts: Record<string, number> = {};

    for (const event of this.events) {
      eventsByCategory[event.category]++;
      if (event.category === 'action') {
        actionCounts[event.name] = (actionCounts[event.name] || 0) + 1;
      }
    }

    const topActions = Object.entries(actionCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const sortedEvents = [...this.events].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
    );

    return {
      totalEvents: this.events.length,
      eventsByCategory,
      topActions,
      firstEventDate: sortedEvents[0]?.timestamp ?? null,
      lastEventDate: sortedEvents[sortedEvents.length - 1]?.timestamp ?? null,
    };
  }

  /**
   * Clear all analytics data (GDPR Art. 17 - Right to Erasure)
   */
  async clearAllData(): Promise<void> {
    this.events = [];
    this.sessionId = generateUUID(); // New session after clear
    await AsyncStorage.removeItem(STORAGE_KEY);
  }

  /**
   * Export data for user (GDPR Art. 20 - Data Portability)
   */
  async exportData(): Promise<string> {
    if (!this.initialized) await this.initialize();
    return JSON.stringify(this.events, null, 2);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Private Methods
  // ───────────────────────────────────────────────────────────────────────────

  /**
   * Sanitize metadata to prevent accidental PII logging
   */
  private sanitizeMetadata(
    metadata: Record<string, string | number | boolean>,
  ): Record<string, string | number | boolean> {
    const sanitized: Record<string, string | number | boolean> = {};
    const piiPatterns = [
      /email/i,
      /name/i,
      /phone/i,
      /address/i,
      /ip/i,
      /device/i,
      /user/i,
      /patient/i,
      /ssn/i,
      /birth/i,
    ];

    for (const [key, value] of Object.entries(metadata)) {
      // Skip keys that might contain PII
      const isPiiKey = piiPatterns.some(pattern => pattern.test(key));
      if (isPiiKey) continue;

      // Skip string values that look like emails or IDs
      if (typeof value === 'string') {
        if (value.includes('@') || value.length > 50) continue;
      }

      sanitized[key] = value;
    }

    return sanitized;
  }

  /**
   * Remove events older than retention period
   */
  private purgeOldEvents(events: AnalyticsEvent[]): AnalyticsEvent[] {
    const cutoff = Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000;
    return events.filter(e => new Date(e.timestamp).getTime() > cutoff);
  }

  /**
   * Persist events to storage
   */
  private async persist(): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(this.events));
    } catch {
      // Silent fail - never break app for analytics
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Export singleton instance for convenience
// ─────────────────────────────────────────────────────────────────────────────

export const localAnalytics = LocalAnalyticsService.getInstance();
