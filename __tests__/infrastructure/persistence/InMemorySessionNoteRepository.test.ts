/**
 * Unit Tests: InMemorySessionNoteRepository
 */
import { InMemorySessionNoteRepository } from '../../../src/infrastructure/persistence/InMemorySessionNoteRepository';
import { createSessionNote } from '../../../src/domain/entities/SessionNote';

describe('InMemorySessionNoteRepository', () => {
  let repo: InMemorySessionNoteRepository;

  beforeEach(() => {
    repo = new InMemorySessionNoteRepository();
  });

  it('saves and retrieves a note by ID', async () => {
    const note = createSessionNote('a1', 't1', 'p1', 'encrypted', 'iv', '2026-02-08');
    await repo.save(note);
    const found = await repo.findById(note.id);
    expect(found).toBeDefined();
    expect(found!.therapistId).toBe('t1');
  });

  it('finds notes by appointment', async () => {
    await repo.save(createSessionNote('appt-1', 't1', 'p1', 'e1', 'iv1', '2026-02-08'));
    await repo.save(createSessionNote('appt-1', 't1', 'p1', 'e2', 'iv2', '2026-02-08'));
    await repo.save(createSessionNote('appt-2', 't1', 'p1', 'e3', 'iv3', '2026-02-09'));

    const results = await repo.findByAppointment('appt-1');
    expect(results).toHaveLength(2);
  });

  it('finds notes by therapist and patient', async () => {
    await repo.save(createSessionNote('a1', 't1', 'p1', 'e1', 'iv1', '2026-02-08'));
    await repo.save(createSessionNote('a2', 't1', 'p1', 'e2', 'iv2', '2026-02-09'));
    await repo.save(createSessionNote('a3', 't1', 'p2', 'e3', 'iv3', '2026-02-10'));
    await repo.save(createSessionNote('a4', 't2', 'p1', 'e4', 'iv4', '2026-02-11'));

    const results = await repo.findByTherapistAndPatient('t1', 'p1');
    expect(results).toHaveLength(2);
  });

  it('finds notes by therapist', async () => {
    await repo.save(createSessionNote('a1', 't1', 'p1', 'e1', 'iv1', '2026-02-08'));
    await repo.save(createSessionNote('a2', 't1', 'p2', 'e2', 'iv2', '2026-02-09'));
    await repo.save(createSessionNote('a3', 't2', 'p1', 'e3', 'iv3', '2026-02-10'));

    const results = await repo.findByTherapist('t1');
    expect(results).toHaveLength(2);
  });

  it('updates a note', async () => {
    const note = createSessionNote('a1', 't1', 'p1', 'old-enc', 'iv', '2026-02-08');
    await repo.save(note);

    note.encryptedContent = 'new-enc';
    note.tags = ['progress', 'goals'];
    await repo.update(note);

    const found = await repo.findById(note.id);
    expect(found!.encryptedContent).toBe('new-enc');
    expect(found!.tags).toEqual(['progress', 'goals']);
  });

  it('deletes a note', async () => {
    const note = createSessionNote('a1', 't1', 'p1', 'enc', 'iv', '2026-02-08');
    await repo.save(note);
    await repo.delete(note.id);
    expect(await repo.findById(note.id)).toBeNull();
  });

  it('deletes all notes by patient (GDPR Art. 17)', async () => {
    await repo.save(createSessionNote('a1', 't1', 'patient-X', 'e1', 'iv1', '2026-02-08'));
    await repo.save(createSessionNote('a2', 't1', 'patient-X', 'e2', 'iv2', '2026-02-09'));
    await repo.save(createSessionNote('a3', 't1', 'patient-Y', 'e3', 'iv3', '2026-02-10'));

    await repo.deleteByPatient('patient-X');

    const remaining = await repo.findByTherapist('t1');
    expect(remaining).toHaveLength(1);
    expect(remaining[0].patientId).toBe('patient-Y');
  });

  it('returns notes sorted by sessionDate descending', async () => {
    await repo.save(createSessionNote('a1', 't1', 'p1', 'e1', 'iv1', '2026-02-05'));
    await repo.save(createSessionNote('a2', 't1', 'p1', 'e2', 'iv2', '2026-02-10'));
    await repo.save(createSessionNote('a3', 't1', 'p1', 'e3', 'iv3', '2026-02-07'));

    const results = await repo.findByTherapist('t1');
    expect(results[0].sessionDate).toBe('2026-02-10');
    expect(results[2].sessionDate).toBe('2026-02-05');
  });
});
