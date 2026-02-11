/**
 * LocalStorageAppointmentRepository Tests
 */

import { LocalStorageAppointmentRepository } from '../../../src/infrastructure/persistence/LocalStorageAppointmentRepository';
import { createAppointment } from '../../../src/domain/entities/Appointment';

const mockStorage = new Map<string, string>();
const mockLocalStorage = {
  getItem: jest.fn((key: string) => mockStorage.get(key) ?? null),
  setItem: jest.fn((key: string, value: string) => { mockStorage.set(key, value); }),
  removeItem: jest.fn((key: string) => { mockStorage.delete(key); }),
  clear: jest.fn(() => { mockStorage.clear(); }),
  get length() { return mockStorage.size; },
  key: jest.fn((_: number) => null),
};

Object.defineProperty(globalThis, 'localStorage', { value: mockLocalStorage, writable: true });

describe('LocalStorageAppointmentRepository', () => {
  let repo: LocalStorageAppointmentRepository;

  beforeEach(() => {
    mockStorage.clear();
    jest.clearAllMocks();
    repo = new LocalStorageAppointmentRepository();
  });

  describe('save + findById', () => {
    it('should save and retrieve appointment', async () => {
      // createAppointment(therapistId, patientId, startTime, type, durationMinutes)
      const apt = createAppointment('t1', 'p1', '2026-02-08T10:00:00Z', 'follow_up', 50);
      await repo.save(apt);

      const found = await repo.findById(apt.id);
      expect(found).not.toBeNull();
      expect(found!.therapistId).toBe('t1');
      expect(found!.patientId).toBe('p1');
      expect(found!.durationMinutes).toBe(50);
    });

    it('should return null for non-existent ID', async () => {
      expect(await repo.findById('nope')).toBeNull();
    });
  });

  describe('findByTherapist', () => {
    it('should filter by therapist and sort by startTime', async () => {
      await repo.save(createAppointment('t1', 'p1', '2026-02-08T14:00:00Z', 'follow_up', 50));
      await repo.save(createAppointment('t1', 'p1', '2026-02-08T09:00:00Z', 'follow_up', 50));
      await repo.save(createAppointment('t2', 'p2', '2026-02-08T10:00:00Z', 'follow_up', 50));

      const results = await repo.findByTherapist('t1');
      expect(results).toHaveLength(2);
      expect(results[0].startTime).toBe('2026-02-08T09:00:00Z');
      expect(results[1].startTime).toBe('2026-02-08T14:00:00Z');
    });

    it('should filter by date range', async () => {
      await repo.save(createAppointment('t1', 'p1', '2026-02-07T10:00:00Z', 'follow_up', 50));
      await repo.save(createAppointment('t1', 'p1', '2026-02-08T10:00:00Z', 'follow_up', 50));
      await repo.save(createAppointment('t1', 'p1', '2026-02-09T10:00:00Z', 'follow_up', 50));

      const results = await repo.findByTherapist('t1', '2026-02-08T00:00:00Z', '2026-02-09T00:00:00Z');
      expect(results).toHaveLength(1);
      expect(results[0].startTime).toBe('2026-02-08T10:00:00Z');
    });
  });

  describe('findByPatient', () => {
    it('should filter by patient ID', async () => {
      await repo.save(createAppointment('t1', 'p1', '2026-02-08T10:00:00Z', 'follow_up', 50));
      await repo.save(createAppointment('t1', 'p2', '2026-02-08T11:00:00Z', 'follow_up', 50));

      const results = await repo.findByPatient('p1');
      expect(results).toHaveLength(1);
      expect(results[0].patientId).toBe('p1');
    });
  });

  describe('findByStatus', () => {
    it('should filter by status', async () => {
      const apt1 = createAppointment('t1', 'p1', '2026-02-08T10:00:00Z', 'follow_up', 50);
      apt1.status = 'confirmed';
      const apt2 = createAppointment('t1', 'p2', '2026-02-08T11:00:00Z', 'follow_up', 50);
      apt2.status = 'cancelled';

      await repo.save(apt1);
      await repo.save(apt2);

      const confirmed = await repo.findByStatus('confirmed');
      expect(confirmed).toHaveLength(1);
      expect(confirmed[0].status).toBe('confirmed');
    });
  });

  describe('update', () => {
    it('should update appointment status', async () => {
      const apt = createAppointment('t1', 'p1', '2026-02-08T10:00:00Z', 'follow_up', 50);
      await repo.save(apt);

      apt.status = 'completed';
      await repo.update(apt);

      const found = await repo.findById(apt.id);
      expect(found!.status).toBe('completed');
    });
  });

  describe('delete', () => {
    it('should remove appointment', async () => {
      const apt = createAppointment('t1', 'p1', '2026-02-08T10:00:00Z', 'follow_up', 50);
      await repo.save(apt);
      await repo.delete(apt.id);

      expect(await repo.findById(apt.id)).toBeNull();
    });
  });

  describe('corrupt data handling', () => {
    it('should return empty array for invalid JSON', async () => {
      mockStorage.set('anamnese_appointments', '{broken');
      const results = await repo.findByTherapist('t1');
      expect(results).toEqual([]);
    });
  });
});
