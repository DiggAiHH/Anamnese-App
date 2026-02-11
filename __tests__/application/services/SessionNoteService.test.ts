/**
 * Unit Tests: SessionNoteService
 * @security Tests encryption, GDPR deletion, note lifecycle.
 */
import { SessionNoteService } from '../../../src/application/services/SessionNoteService';
import { InMemorySessionNoteRepository } from '../../../src/infrastructure/persistence/InMemorySessionNoteRepository';

// Mock encryptionService — returns EncryptedDataVO-like objects
jest.mock('../../../src/infrastructure/encryption/encryptionService', () => ({
  encryptionService: {
    encrypt: jest.fn((data: string, _key: string) => {
      const serialized = JSON.stringify({
        ciphertext: `enc-${data}`,
        iv: 'mock-iv-hex',
        authTag: 'mock-auth-tag',
        salt: 'mock-salt',
        algorithm: 'aes-256-gcm',
        kdf: { name: 'pbkdf2', iterations: 600000, hash: 'sha256' },
        encryptedAt: new Date().toISOString(),
      });
      const b64 = Buffer.from(serialized).toString('base64');
      return Promise.resolve({
        ciphertext: `enc-${data}`,
        iv: 'mock-iv-hex',
        authTag: 'mock-auth-tag',
        salt: 'mock-salt',
        toString: () => b64,
      });
    }),
    decrypt: jest.fn((_data: unknown, _key: string) => {
      return Promise.resolve('decrypted-content');
    }),
    deriveKey: jest.fn((input: string) => Promise.resolve({ key: `derived:${input}`, salt: 'mock-salt' })),
  },
}));

describe('SessionNoteService', () => {
  let service: SessionNoteService;
  let repo: InMemorySessionNoteRepository;

  beforeEach(() => {
    repo = new InMemorySessionNoteRepository();
    service = new SessionNoteService(repo);
  });

  describe('createNote', () => {
    it('creates an encrypted note', async () => {
      const result = await service.createNote(
        'appt-1', 't1', 'p1', 'Patient shows improvement',
        'enc-key-123', '2026-02-08', ['progress'],
      );
      expect(result.success).toBe(true);
      expect(result.note).toBeDefined();
      expect(result.note!.encryptedContent).not.toBe('Patient shows improvement');
      expect(result.note!.tags).toEqual(['progress']);
    });

    it('rejects empty content', async () => {
      const result = await service.createNote(
        'appt-1', 't1', 'p1', '   ', 'key', '2026-02-08',
      );
      expect(result.success).toBe(false);
      expect(result.error).toBe('notes.emptyContent');
    });

    it('stores encryption IV separately', async () => {
      const result = await service.createNote(
        'appt-1', 't1', 'p1', 'Test note', 'key', '2026-02-08',
      );
      expect(result.note!.encryptionIV).toBeDefined();
      expect(result.note!.encryptionIV.length).toBeGreaterThan(0);
    });
  });

  describe('readNote', () => {
    it('reads and decrypts a note', async () => {
      const created = await service.createNote(
        'appt-1', 't1', 'p1', 'Secret therapy note',
        'enc-key', '2026-02-08',
      );
      const result = await service.readNote(created.note!.id, 'enc-key');
      expect(result.success).toBe(true);
      expect(result.decryptedContent).toBeDefined();
    });

    it('returns error for non-existent note', async () => {
      const result = await service.readNote('fake-id', 'key');
      expect(result.success).toBe(false);
      expect(result.error).toBe('notes.notFound');
    });
  });

  describe('updateNote', () => {
    it('updates note content', async () => {
      const created = await service.createNote(
        'appt-1', 't1', 'p1', 'Original', 'key', '2026-02-08',
      );
      const result = await service.updateNote(
        created.note!.id, 'Updated content', 'key', ['anxiety', 'goals'],
      );
      expect(result.success).toBe(true);
      expect(result.note!.tags).toEqual(['anxiety', 'goals']);
    });

    it('returns error for non-existent note', async () => {
      const result = await service.updateNote('fake-id', 'content', 'key');
      expect(result.success).toBe(false);
      expect(result.error).toBe('notes.notFound');
    });
  });

  describe('getPatientNotes', () => {
    it('returns all notes for therapist-patient pair', async () => {
      await service.createNote('a1', 't1', 'p1', 'Note 1', 'key', '2026-02-08');
      await service.createNote('a2', 't1', 'p1', 'Note 2', 'key', '2026-02-09');
      await service.createNote('a3', 't1', 'p2', 'Note 3', 'key', '2026-02-10');

      const notes = await service.getPatientNotes('t1', 'p1');
      expect(notes).toHaveLength(2);
    });
  });

  describe('deleteNote', () => {
    it('deletes a note', async () => {
      const created = await service.createNote(
        'a1', 't1', 'p1', 'Temp note', 'key', '2026-02-08',
      );
      const result = await service.deleteNote(created.note!.id);
      expect(result.success).toBe(true);

      const check = await service.readNote(created.note!.id, 'key');
      expect(check.success).toBe(false);
    });
  });

  describe('deleteAllPatientNotes (GDPR Art. 17)', () => {
    it('deletes all notes for a patient', async () => {
      await service.createNote('a1', 't1', 'patient-X', 'Note 1', 'key', '2026-02-08');
      await service.createNote('a2', 't1', 'patient-X', 'Note 2', 'key', '2026-02-09');
      await service.createNote('a3', 't1', 'patient-Y', 'Note 3', 'key', '2026-02-10');

      const result = await service.deleteAllPatientNotes('patient-X');
      expect(result.success).toBe(true);

      const remaining = await service.getPatientNotes('t1', 'patient-X');
      expect(remaining).toHaveLength(0);

      const yNotes = await service.getPatientNotes('t1', 'patient-Y');
      expect(yNotes).toHaveLength(1);
    });
  });
});
