/**
 * LocalStorageSessionNoteRepository Tests
 */

import { LocalStorageSessionNoteRepository } from '../../../src/infrastructure/persistence/LocalStorageSessionNoteRepository';
import { createSessionNote } from '../../../src/domain/entities/SessionNote';

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

describe('LocalStorageSessionNoteRepository', () => {
  let repo: LocalStorageSessionNoteRepository;

  beforeEach(() => {
    mockStorage.clear();
    jest.clearAllMocks();
    repo = new LocalStorageSessionNoteRepository();
  });

  describe('save + findById', () => {
    it('should save and retrieve note', async () => {
      // createSessionNote(appointmentId, therapistId, patientId, encryptedContent, encryptionIV, sessionDate)
      const note = createSessionNote('a1', 't1', 'p1', 'encrypted-content', 'iv-hex', '2026-01-01T10:00:00Z');
      await repo.save(note);

      const found = await repo.findById(note.id);
      expect(found).not.toBeNull();
      expect(found!.therapistId).toBe('t1');
      expect(found!.encryptedContent).toBe('encrypted-content');
    });

    it('should return null for non-existent', async () => {
      expect(await repo.findById('nope')).toBeNull();
    });
  });

  describe('findByAppointment', () => {
    it('should filter by appointment ID and sort descending', async () => {
      const n1 = createSessionNote('a1', 't1', 'p1', 'c1', 'iv1', '2026-02-01T10:00:00Z');
      const n2 = createSessionNote('a1', 't1', 'p1', 'c2', 'iv2', '2026-02-08T10:00:00Z');
      const n3 = createSessionNote('a2', 't1', 'p1', 'c3', 'iv3', '2026-02-05T10:00:00Z');

      await repo.save(n1);
      await repo.save(n2);
      await repo.save(n3);

      const results = await repo.findByAppointment('a1');
      expect(results).toHaveLength(2);
      // Most recent first
      expect(results[0].sessionDate).toBe('2026-02-08T10:00:00Z');
    });
  });

  describe('findByTherapistAndPatient', () => {
    it('should filter by both therapist and patient', async () => {
      await repo.save(createSessionNote('a1', 't1', 'p1', 'c1', 'iv1', '2026-01-01T10:00:00Z'));
      await repo.save(createSessionNote('a2', 't1', 'p2', 'c2', 'iv2', '2026-01-02T10:00:00Z'));
      await repo.save(createSessionNote('a3', 't2', 'p1', 'c3', 'iv3', '2026-01-03T10:00:00Z'));

      const results = await repo.findByTherapistAndPatient('t1', 'p1');
      expect(results).toHaveLength(1);
      expect(results[0].therapistId).toBe('t1');
      expect(results[0].patientId).toBe('p1');
    });
  });

  describe('update', () => {
    it('should update note content', async () => {
      const note = createSessionNote('a1', 't1', 'p1', 'old-content', 'iv1', '2026-01-01T10:00:00Z');
      await repo.save(note);

      note.encryptedContent = 'new-encrypted-content';
      await repo.update(note);

      const found = await repo.findById(note.id);
      expect(found!.encryptedContent).toBe('new-encrypted-content');
    });
  });

  describe('delete', () => {
    it('should remove note by ID', async () => {
      const note = createSessionNote('a1', 't1', 'p1', 'c1', 'iv1', '2026-01-01T10:00:00Z');
      await repo.save(note);
      await repo.delete(note.id);

      expect(await repo.findById(note.id)).toBeNull();
    });
  });

  describe('deleteByPatient (GDPR Art. 17)', () => {
    it('should remove all notes for a patient', async () => {
      await repo.save(createSessionNote('a1', 't1', 'p1', 'c1', 'iv1', '2026-01-01T10:00:00Z'));
      await repo.save(createSessionNote('a2', 't1', 'p1', 'c2', 'iv2', '2026-01-02T10:00:00Z'));
      await repo.save(createSessionNote('a3', 't1', 'p2', 'c3', 'iv3', '2026-01-03T10:00:00Z'));

      await repo.deleteByPatient('p1');

      const p1Notes = await repo.findByTherapistAndPatient('t1', 'p1');
      expect(p1Notes).toHaveLength(0);

      // p2 notes should remain
      const p2Notes = await repo.findByTherapistAndPatient('t1', 'p2');
      expect(p2Notes).toHaveLength(1);
    });
  });

  describe('corrupt data', () => {
    it('should handle invalid JSON gracefully', async () => {
      mockStorage.set('anamnese_session_notes', '<<<invalid>>>');
      const found = await repo.findById('any');
      expect(found).toBeNull();
    });
  });
});
