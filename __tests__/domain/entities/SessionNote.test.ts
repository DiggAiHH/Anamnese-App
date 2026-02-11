/**
 * Unit Tests: SessionNote Entity
 * @security Validates schema, factory.
 */
import {
  createSessionNote,
  SessionNoteSchema,
} from '../../../src/domain/entities/SessionNote';

describe('SessionNote Entity', () => {
  describe('SessionNoteSchema', () => {
    it('validates a correct session note', () => {
      const note = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        appointmentId: '660e8400-e29b-41d4-a716-446655440000',
        therapistId: '770e8400-e29b-41d4-a716-446655440000',
        patientId: '880e8400-e29b-41d4-a716-446655440000',
        encryptedContent: 'abc123ciphertext',
        encryptionIV: 'deadbeef',
        sessionDate: '2026-02-08',
        tags: ['progress', 'anxiety'],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const result = SessionNoteSchema.safeParse(note);
      expect(result.success).toBe(true);
    });

    it('validates with empty tags array', () => {
      const note = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        appointmentId: '660e8400-e29b-41d4-a716-446655440000',
        therapistId: '770e8400-e29b-41d4-a716-446655440000',
        patientId: '880e8400-e29b-41d4-a716-446655440000',
        encryptedContent: 'ciphertext',
        encryptionIV: 'iv-hex',
        sessionDate: '2026-02-08',
        tags: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const result = SessionNoteSchema.safeParse(note);
      expect(result.success).toBe(true);
    });
  });

  describe('createSessionNote', () => {
    it('creates note with correct defaults', () => {
      const note = createSessionNote(
        'appt-1',
        'therapist-1',
        'patient-1',
        'encrypted-content',
        'iv-hex',
        '2026-02-08',
        ['progress'],
      );
      expect(note.appointmentId).toBe('appt-1');
      expect(note.therapistId).toBe('therapist-1');
      expect(note.patientId).toBe('patient-1');
      expect(note.encryptedContent).toBe('encrypted-content');
      expect(note.encryptionIV).toBe('iv-hex');
      expect(note.tags).toEqual(['progress']);
      expect(note.id).toBeDefined();
      expect(note.createdAt).toBeInstanceOf(Date);
    });

    it('defaults tags to empty array', () => {
      const note = createSessionNote(
        'a1', 't1', 'p1', 'enc', 'iv', '2026-01-01',
      );
      expect(note.tags).toEqual([]);
    });

    it('generates unique IDs', () => {
      const n1 = createSessionNote('a1', 't1', 'p1', 'e1', 'iv1', '2026-01-01');
      const n2 = createSessionNote('a2', 't1', 'p1', 'e2', 'iv2', '2026-01-02');
      expect(n1.id).not.toBe(n2.id);
    });
  });
});
