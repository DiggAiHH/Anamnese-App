/**
 * Unit Tests: InMemoryAppointmentRepository
 */
import { InMemoryAppointmentRepository } from '../../../src/infrastructure/persistence/InMemoryAppointmentRepository';
import { createAppointment } from '../../../src/domain/entities/Appointment';

describe('InMemoryAppointmentRepository', () => {
  let repo: InMemoryAppointmentRepository;

  beforeEach(() => {
    repo = new InMemoryAppointmentRepository();
  });

  it('saves and retrieves an appointment by ID', async () => {
    const appt = createAppointment('t1', 'p1', '2026-03-01T10:00:00Z', 'follow_up', 50);
    await repo.save(appt);
    const found = await repo.findById(appt.id);
    expect(found).toBeDefined();
    expect(found!.therapistId).toBe('t1');
  });

  it('finds appointments by therapist within date range', async () => {
    await repo.save(createAppointment('t1', 'p1', '2026-03-01T10:00:00Z', 'follow_up'));
    await repo.save(createAppointment('t1', 'p2', '2026-03-01T14:00:00Z', 'initial_session'));
    await repo.save(createAppointment('t1', 'p3', '2026-03-05T10:00:00Z', 'follow_up'));
    await repo.save(createAppointment('t2', 'p1', '2026-03-01T10:00:00Z', 'follow_up'));

    const results = await repo.findByTherapist(
      't1',
      '2026-03-01T00:00:00Z',
      '2026-03-01T23:59:59Z',
    );
    expect(results).toHaveLength(2);
  });

  it('finds appointments by patient', async () => {
    await repo.save(createAppointment('t1', 'patient-A', '2026-03-01T10:00:00Z', 'follow_up'));
    await repo.save(createAppointment('t2', 'patient-A', '2026-03-02T10:00:00Z', 'follow_up'));
    await repo.save(createAppointment('t1', 'patient-B', '2026-03-01T10:00:00Z', 'follow_up'));

    const results = await repo.findByPatient('patient-A');
    expect(results).toHaveLength(2);
  });

  it('finds appointments by status', async () => {
    const a1 = createAppointment('t1', 'p1', '2026-03-01T10:00:00Z', 'follow_up');
    const a2 = createAppointment('t1', 'p2', '2026-03-01T14:00:00Z', 'follow_up');
    a2.status = 'cancelled';
    await repo.save(a1);
    await repo.save(a2);

    const scheduled = await repo.findByStatus('scheduled');
    expect(scheduled).toHaveLength(1);

    const cancelled = await repo.findByStatus('cancelled');
    expect(cancelled).toHaveLength(1);
  });

  it('updates an appointment', async () => {
    const appt = createAppointment('t1', 'p1', '2026-03-01T10:00:00Z', 'follow_up');
    await repo.save(appt);

    appt.status = 'confirmed';
    await repo.update(appt);

    const found = await repo.findById(appt.id);
    expect(found!.status).toBe('confirmed');
  });

  it('deletes an appointment', async () => {
    const appt = createAppointment('t1', 'p1', '2026-03-01T10:00:00Z', 'follow_up');
    await repo.save(appt);
    await repo.delete(appt.id);
    expect(await repo.findById(appt.id)).toBeNull();
  });

  it('returns sorted by startTime', async () => {
    await repo.save(createAppointment('t1', 'p1', '2026-03-01T14:00:00Z', 'follow_up'));
    await repo.save(createAppointment('t1', 'p2', '2026-03-01T09:00:00Z', 'follow_up'));
    await repo.save(createAppointment('t1', 'p3', '2026-03-01T11:00:00Z', 'follow_up'));

    const results = await repo.findByTherapist('t1', '2026-03-01T00:00:00Z', '2026-03-01T23:59:59Z');
    expect(results[0].startTime).toBe('2026-03-01T09:00:00Z');
    expect(results[2].startTime).toBe('2026-03-01T14:00:00Z');
  });
});
