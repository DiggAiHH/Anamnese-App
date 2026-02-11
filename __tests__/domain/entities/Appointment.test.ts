/**
 * Unit Tests: Appointment Entity
 * @security Validates schema, factory, overlap detection.
 */
import {
  createAppointment,
  getAppointmentEndTime,
  appointmentsOverlap,
  AppointmentSchema,
  type AppointmentEntity,
} from '../../../src/domain/entities/Appointment';

describe('Appointment Entity', () => {
  const futureDate = new Date(Date.now() + 86400000).toISOString(); // tomorrow

  describe('AppointmentSchema', () => {
    it('validates a correct appointment', () => {
      const appt: AppointmentEntity = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        therapistId: '660e8400-e29b-41d4-a716-446655440000',
        patientId: '770e8400-e29b-41d4-a716-446655440000',
        startTime: futureDate,
        durationMinutes: 50,
        status: 'scheduled',
        type: 'initial_session',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const result = AppointmentSchema.safeParse(appt);
      expect(result.success).toBe(true);
    });

    it('rejects duration below 15 minutes', () => {
      const bad = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        therapistId: '660e8400-e29b-41d4-a716-446655440000',
        patientId: '770e8400-e29b-41d4-a716-446655440000',
        startTime: futureDate,
        durationMinutes: 10,
        status: 'scheduled' as const,
        type: 'follow_up' as const,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const result = AppointmentSchema.safeParse(bad);
      expect(result.success).toBe(false);
    });

    it('rejects duration above 180 minutes', () => {
      const bad = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        therapistId: '660e8400-e29b-41d4-a716-446655440000',
        patientId: '770e8400-e29b-41d4-a716-446655440000',
        startTime: futureDate,
        durationMinutes: 200,
        status: 'scheduled' as const,
        type: 'follow_up' as const,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const result = AppointmentSchema.safeParse(bad);
      expect(result.success).toBe(false);
    });

    it('rejects invalid status', () => {
      const bad = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        therapistId: '660e8400-e29b-41d4-a716-446655440000',
        patientId: '770e8400-e29b-41d4-a716-446655440000',
        startTime: futureDate,
        durationMinutes: 50,
        status: 'pending',
        type: 'follow_up',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const result = AppointmentSchema.safeParse(bad);
      expect(result.success).toBe(false);
    });
  });

  describe('createAppointment', () => {
    it('creates appointment with correct defaults', () => {
      const appt = createAppointment(
        'therapist-1',
        'patient-1',
        futureDate,
        'initial_session',
      );
      expect(appt.therapistId).toBe('therapist-1');
      expect(appt.patientId).toBe('patient-1');
      expect(appt.status).toBe('scheduled');
      expect(appt.durationMinutes).toBe(50);
      expect(appt.id).toBeDefined();
    });

    it('respects custom duration', () => {
      const appt = createAppointment('t1', 'p1', futureDate, 'crisis', 30);
      expect(appt.durationMinutes).toBe(30);
    });
  });

  describe('getAppointmentEndTime', () => {
    it('calculates end time correctly for 50-minute session', () => {
      const start = '2026-02-08T10:00:00.000Z';
      const appt = createAppointment('t1', 'p1', start, 'follow_up', 50);
      const end = getAppointmentEndTime(appt);
      expect(end.toISOString()).toBe('2026-02-08T10:50:00.000Z');
    });

    it('calculates end time for 90-minute session', () => {
      const start = '2026-02-08T14:00:00.000Z';
      const appt = createAppointment('t1', 'p1', start, 'group', 90);
      const end = getAppointmentEndTime(appt);
      expect(end.toISOString()).toBe('2026-02-08T15:30:00.000Z');
    });
  });

  describe('appointmentsOverlap', () => {
    it('detects overlapping appointments', () => {
      const a = createAppointment('t1', 'p1', '2026-02-08T10:00:00.000Z', 'follow_up', 50);
      const b = createAppointment('t1', 'p2', '2026-02-08T10:30:00.000Z', 'follow_up', 50);
      expect(appointmentsOverlap(a, b)).toBe(true);
    });

    it('returns false for non-overlapping appointments', () => {
      const a = createAppointment('t1', 'p1', '2026-02-08T10:00:00.000Z', 'follow_up', 50);
      const b = createAppointment('t1', 'p2', '2026-02-08T11:00:00.000Z', 'follow_up', 50);
      expect(appointmentsOverlap(a, b)).toBe(false);
    });

    it('returns false for exactly adjacent appointments', () => {
      const a = createAppointment('t1', 'p1', '2026-02-08T10:00:00.000Z', 'follow_up', 60);
      const b = createAppointment('t1', 'p2', '2026-02-08T11:00:00.000Z', 'follow_up', 60);
      expect(appointmentsOverlap(a, b)).toBe(false);
    });

    it('detects containment (one inside the other)', () => {
      const a = createAppointment('t1', 'p1', '2026-02-08T09:00:00.000Z', 'follow_up', 180);
      const b = createAppointment('t1', 'p2', '2026-02-08T10:00:00.000Z', 'follow_up', 30);
      expect(appointmentsOverlap(a, b)).toBe(true);
    });
  });
});
