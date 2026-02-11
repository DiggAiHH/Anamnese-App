/**
 * Unit Tests: AppointmentService
 * @security Validates booking, conflict detection, status management.
 */
import { AppointmentService } from '../../../src/application/services/AppointmentService';
import { InMemoryAppointmentRepository } from '../../../src/infrastructure/persistence/InMemoryAppointmentRepository';

describe('AppointmentService', () => {
  let service: AppointmentService;
  let repo: InMemoryAppointmentRepository;

  // Future date for valid bookings
  const tomorrow = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(10, 0, 0, 0);
    return d.toISOString();
  };

  const tomorrowPlus = (hours: number) => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(10 + hours, 0, 0, 0);
    return d.toISOString();
  };

  beforeEach(() => {
    repo = new InMemoryAppointmentRepository();
    service = new AppointmentService(repo);
  });

  describe('book', () => {
    it('successfully books an appointment', async () => {
      const result = await service.book('t1', 'p1', tomorrow(), 'follow_up', 50);
      expect(result.success).toBe(true);
      expect(result.appointment).toBeDefined();
      expect(result.appointment!.status).toBe('scheduled');
    });

    it('rejects past date', async () => {
      const pastDate = '2020-01-01T10:00:00Z';
      const result = await service.book('t1', 'p1', pastDate, 'follow_up');
      expect(result.success).toBe(false);
      expect(result.error).toBe('appointments.pastDate');
    });

    it('detects scheduling conflict', async () => {
      await service.book('t1', 'p1', tomorrow(), 'follow_up', 50);
      const result = await service.book('t1', 'p2', tomorrow(), 'follow_up', 50);
      expect(result.success).toBe(false);
      expect(result.error).toBe('appointments.conflict');
    });

    it('allows non-overlapping bookings', async () => {
      await service.book('t1', 'p1', tomorrow(), 'follow_up', 50);
      const result = await service.book('t1', 'p2', tomorrowPlus(1), 'follow_up', 50);
      expect(result.success).toBe(true);
    });

    it('ignores cancelled appointments for conflict check', async () => {
      const first = await service.book('t1', 'p1', tomorrow(), 'follow_up', 50);
      await service.cancel(first.appointment!.id);

      const result = await service.book('t1', 'p2', tomorrow(), 'follow_up', 50);
      expect(result.success).toBe(true);
    });
  });

  describe('reschedule', () => {
    it('reschedules an appointment', async () => {
      const booking = await service.book('t1', 'p1', tomorrow(), 'follow_up');
      const newTime = tomorrowPlus(3);
      const result = await service.reschedule(booking.appointment!.id, newTime);
      expect(result.success).toBe(true);
      expect(result.appointment!.startTime).toBe(newTime);
    });

    it('rejects rescheduling cancelled appointment', async () => {
      const booking = await service.book('t1', 'p1', tomorrow(), 'follow_up');
      await service.cancel(booking.appointment!.id);
      const result = await service.reschedule(booking.appointment!.id, tomorrowPlus(2));
      expect(result.success).toBe(false);
      expect(result.error).toBe('appointments.cannotReschedule');
    });

    it('rejects rescheduling to past date', async () => {
      const booking = await service.book('t1', 'p1', tomorrow(), 'follow_up');
      const result = await service.reschedule(booking.appointment!.id, '2020-01-01T10:00:00Z');
      expect(result.success).toBe(false);
      expect(result.error).toBe('appointments.pastDate');
    });

    it('returns not found for invalid id', async () => {
      const result = await service.reschedule('fake-id', tomorrow());
      expect(result.success).toBe(false);
      expect(result.error).toBe('appointments.notFound');
    });
  });

  describe('cancel', () => {
    it('cancels an appointment', async () => {
      const booking = await service.book('t1', 'p1', tomorrow(), 'follow_up');
      const result = await service.cancel(booking.appointment!.id, 'Patient request');
      expect(result.success).toBe(true);
      expect(result.appointment!.status).toBe('cancelled');
      expect(result.appointment!.cancellationReason).toBe('Patient request');
    });

    it('returns not found for invalid id', async () => {
      const result = await service.cancel('fake-id');
      expect(result.success).toBe(false);
      expect(result.error).toBe('appointments.notFound');
    });
  });

  describe('updateStatus', () => {
    it('updates to confirmed', async () => {
      const booking = await service.book('t1', 'p1', tomorrow(), 'follow_up');
      const result = await service.updateStatus(booking.appointment!.id, 'confirmed');
      expect(result.success).toBe(true);
      expect(result.appointment!.status).toBe('confirmed');
    });

    it('updates to completed', async () => {
      const booking = await service.book('t1', 'p1', tomorrow(), 'follow_up');
      const result = await service.updateStatus(booking.appointment!.id, 'completed');
      expect(result.success).toBe(true);
      expect(result.appointment!.status).toBe('completed');
    });
  });

  describe('getTherapistSchedule / getPatientAppointments', () => {
    it('returns therapist schedule for date range', async () => {
      await service.book('t1', 'p1', tomorrow(), 'follow_up');
      await service.book('t1', 'p2', tomorrowPlus(2), 'initial_session');

      const d = new Date();
      d.setDate(d.getDate() + 1);
      const from = new Date(d.setHours(0, 0, 0, 0)).toISOString();
      const to = new Date(d.setHours(23, 59, 59, 999)).toISOString();

      const schedule = await service.getTherapistSchedule('t1', from, to);
      expect(schedule).toHaveLength(2);
    });

    it('returns patient appointments', async () => {
      await service.book('t1', 'p1', tomorrow(), 'follow_up');
      await service.book('t2', 'p1', tomorrowPlus(3), 'online');

      const appts = await service.getPatientAppointments('p1');
      expect(appts).toHaveLength(2);
    });
  });
});
