/**
 * @fileoverview Unit tests for LocalAnalyticsService
 * @security Ensures GDPR compliance - PII filtering, data erasure, export
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { LocalAnalyticsService } from '../../../src/infrastructure/analytics/LocalAnalyticsService';

describe('LocalAnalyticsService', () => {
  let service: LocalAnalyticsService;

  beforeEach(() => {
    jest.clearAllMocks();
    LocalAnalyticsService.resetInstance();
    service = LocalAnalyticsService.getInstance();
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
    (AsyncStorage.removeItem as jest.Mock).mockResolvedValue(undefined);
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = LocalAnalyticsService.getInstance();
      const instance2 = LocalAnalyticsService.getInstance();
      expect(instance1).toBe(instance2);
    });

    it('should create new instance after reset', () => {
      const instance1 = LocalAnalyticsService.getInstance();
      LocalAnalyticsService.resetInstance();
      const instance2 = LocalAnalyticsService.getInstance();
      expect(instance1).not.toBe(instance2);
    });
  });

  describe('Event Tracking', () => {
    it('should track events with correct structure', async () => {
      await service.trackEvent('action', 'test_action', { count: 5 });
      
      const events = service.getEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toMatchObject({
        category: 'action',
        name: 'test_action',
        metadata: { count: 5 },
      });
      expect(events[0].sessionId).toBeDefined();
      expect(events[0].timestamp).toBeDefined();
    });

    it('should track screen views', async () => {
      await service.trackScreenView('HomeScreen');
      
      const events = service.getEvents();
      expect(events[0]).toMatchObject({
        category: 'screen_view',
        name: 'HomeScreen',
      });
    });

    it('should track actions with metadata', async () => {
      await service.trackAction('export_pdf', { format: 'A4' });
      
      const events = service.getEvents();
      expect(events[0]).toMatchObject({
        category: 'action',
        name: 'export_pdf',
        metadata: { format: 'A4' },
      });
    });

    it('should track errors without stack traces', async () => {
      await service.trackError('network_error', '500');
      
      const events = service.getEvents();
      expect(events[0]).toMatchObject({
        category: 'error',
        name: 'network_error',
        metadata: { code: '500' },
      });
    });

    it('should track performance metrics', async () => {
      await service.trackPerformance('pdf_export', 1234);
      
      const events = service.getEvents();
      expect(events[0]).toMatchObject({
        category: 'performance',
        name: 'pdf_export',
        metadata: { durationMs: 1234 },
      });
    });

    it('should track feature usage', async () => {
      await service.trackFeatureUsage('voice_input');
      
      const events = service.getEvents();
      expect(events[0]).toMatchObject({
        category: 'feature_usage',
        name: 'voice_input',
      });
    });

    it('should not track when disabled', async () => {
      service.setEnabled(false);
      await service.trackEvent('action', 'test');
      
      expect(service.getEvents()).toHaveLength(0);
    });

    it('should resume tracking when re-enabled', async () => {
      service.setEnabled(false);
      await service.trackEvent('action', 'ignored');
      service.setEnabled(true);
      await service.trackEvent('action', 'tracked');
      
      expect(service.getEvents()).toHaveLength(1);
      expect(service.getEvents()[0].name).toBe('tracked');
    });
  });

  describe('GDPR Compliance - PII Filtering', () => {
    it('should filter out email-like metadata keys', async () => {
      await service.trackEvent('action', 'test', {
        email: 'user@example.com',
        validKey: 'value',
      });
      
      const events = service.getEvents();
      expect(events[0].metadata).toEqual({ validKey: 'value' });
    });

    it('should filter out name-related metadata keys', async () => {
      await service.trackEvent('action', 'test', {
        userName: 'John',
        patientName: 'Doe',
        count: 5,
      });
      
      const events = service.getEvents();
      expect(events[0].metadata).toEqual({ count: 5 });
    });

    it('should filter out values containing @ symbol', async () => {
      await service.trackEvent('action', 'test', {
        contact: 'test@email.com',
        count: 1,
      });
      
      const events = service.getEvents();
      expect(events[0].metadata).toEqual({ count: 1 });
    });

    it('should filter out suspiciously long strings', async () => {
      const longString = 'a'.repeat(100);
      await service.trackEvent('action', 'test', {
        description: longString,
        shortValue: 'ok',
      });
      
      const events = service.getEvents();
      expect(events[0].metadata).toEqual({ shortValue: 'ok' });
    });
  });

  describe('GDPR Compliance - Right to Erasure (Art. 17)', () => {
    it('should clear all data', async () => {
      await service.trackEvent('action', 'test1');
      await service.trackEvent('action', 'test2');
      expect(service.getEvents()).toHaveLength(2);
      
      await service.clearAllData();
      
      expect(service.getEvents()).toHaveLength(0);
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('@anamnese_local_analytics');
    });

    it('should generate new session ID after clear', async () => {
      await service.trackEvent('action', 'before');
      const oldSessionId = service.getEvents()[0].sessionId;
      
      await service.clearAllData();
      await service.trackEvent('action', 'after');
      const newSessionId = service.getEvents()[0].sessionId;
      
      expect(newSessionId).not.toBe(oldSessionId);
    });
  });

  describe('GDPR Compliance - Data Portability (Art. 20)', () => {
    it('should export data as JSON', async () => {
      await service.trackEvent('action', 'export_test');
      
      const exported = await service.exportData();
      const parsed = JSON.parse(exported);
      
      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed[0].name).toBe('export_test');
    });
  });

  describe('Event Summary', () => {
    it('should calculate correct event counts by category', async () => {
      await service.trackScreenView('Screen1');
      await service.trackScreenView('Screen2');
      await service.trackAction('action1');
      await service.trackError('error1');
      
      const summary = await service.getEventSummary();
      
      expect(summary.eventsByCategory.screen_view).toBe(2);
      expect(summary.eventsByCategory.action).toBe(1);
      expect(summary.eventsByCategory.error).toBe(1);
      expect(summary.totalEvents).toBe(4);
    });

    it('should return top actions sorted by count', async () => {
      await service.trackAction('common_action');
      await service.trackAction('common_action');
      await service.trackAction('common_action');
      await service.trackAction('rare_action');
      
      const summary = await service.getEventSummary();
      
      expect(summary.topActions[0]).toEqual({ name: 'common_action', count: 3 });
      expect(summary.topActions[1]).toEqual({ name: 'rare_action', count: 1 });
    });

    it('should return correct date range', async () => {
      await service.trackEvent('action', 'first');
      await service.trackEvent('action', 'last');
      
      const summary = await service.getEventSummary();
      
      expect(summary.firstEventDate).toBeDefined();
      expect(summary.lastEventDate).toBeDefined();
    });
  });

  describe('Storage Limits', () => {
    it('should enforce max events limit', async () => {
      // Track more than MAX_EVENTS (1000)
      for (let i = 0; i < 1005; i++) {
        await service.trackEvent('action', `action_${i}`);
      }
      
      const events = service.getEvents();
      expect(events.length).toBeLessThanOrEqual(1000);
      // Should keep most recent events
      expect(events[events.length - 1].name).toBe('action_1004');
    });
  });

  describe('Persistence', () => {
    it('should persist events to AsyncStorage', async () => {
      await service.trackEvent('action', 'persisted');
      
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        '@anamnese_local_analytics',
        expect.any(String),
      );
    });

    it('should load events from storage on initialize', async () => {
      const storedEvents = [
        {
          sessionId: 'old-session',
          category: 'action',
          name: 'restored',
          timestamp: new Date().toISOString(),
        },
      ];
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(storedEvents));
      
      LocalAnalyticsService.resetInstance();
      const newService = LocalAnalyticsService.getInstance();
      await newService.initialize();
      
      const events = newService.getEvents();
      expect(events).toHaveLength(1);
      expect(events[0].name).toBe('restored');
    });

    it('should purge events older than retention period', async () => {
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 35); // 35 days old
      
      const storedEvents = [
        {
          sessionId: 'old-session',
          category: 'action',
          name: 'old_event',
          timestamp: oldDate.toISOString(),
        },
        {
          sessionId: 'new-session',
          category: 'action',
          name: 'recent_event',
          timestamp: new Date().toISOString(),
        },
      ];
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(storedEvents));
      
      LocalAnalyticsService.resetInstance();
      const newService = LocalAnalyticsService.getInstance();
      await newService.initialize();
      
      const events = newService.getEvents();
      expect(events).toHaveLength(1);
      expect(events[0].name).toBe('recent_event');
    });
  });

  describe('Error Handling', () => {
    it('should not throw on storage read failure', async () => {
      (AsyncStorage.getItem as jest.Mock).mockRejectedValue(new Error('Storage error'));
      
      LocalAnalyticsService.resetInstance();
      const newService = LocalAnalyticsService.getInstance();
      
      await expect(newService.initialize()).resolves.not.toThrow();
    });

    it('should not throw on storage write failure', async () => {
      (AsyncStorage.setItem as jest.Mock).mockRejectedValue(new Error('Storage error'));
      
      await expect(service.trackEvent('action', 'test')).resolves.not.toThrow();
    });
  });
});
