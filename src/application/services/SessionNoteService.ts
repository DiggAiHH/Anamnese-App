/**
 * SessionNoteService - Encrypted therapist notes
 *
 * @security Notes encrypted with AES-256-GCM before storage.
 *           Only the therapist's encryption key can decrypt.
 * @gdpr Art. 9 health data. Crypto-shredding via key deletion.
 */

import {
  createSessionNote,
  type SessionNoteEntity,
} from '../../domain/entities/SessionNote';
import type { ISessionNoteRepository } from '../../domain/repositories/ISessionNoteRepository';
import { EncryptedDataVO } from '../../domain/value-objects/EncryptedData';
import { encryptionService } from '../../infrastructure/encryption/encryptionService';
import { logDebug, logError } from '../../shared/logger';

export interface NoteResult {
  success: boolean;
  note?: SessionNoteEntity;
  decryptedContent?: string;
  error?: string;
}

export class SessionNoteService {
  constructor(private readonly noteRepo: ISessionNoteRepository) {}

  /**
   * Create an encrypted session note
   * Content is encrypted before storage — only ciphertext persisted.
   */
  async createNote(
    appointmentId: string,
    therapistId: string,
    patientId: string,
    plainContent: string,
    encryptionKey: string,
    sessionDate: string,
    tags: string[] = [],
  ): Promise<NoteResult> {
    try {
      if (!plainContent.trim()) {
        return { success: false, error: 'notes.emptyContent' };
      }

      const encrypted = await encryptionService.encrypt(plainContent, encryptionKey);
      // EncryptedDataVO contains ciphertext, iv, authTag, salt
      const iv = encrypted.iv;
      const ciphertext = encrypted.ciphertext;

      const note = createSessionNote(
        appointmentId,
        therapistId,
        patientId,
        ciphertext,
        iv,
        sessionDate,
        tags,
      );

      // Store the full serialized EncryptedDataVO in encryptedContent for later decryption
      note.encryptedContent = encrypted.toString();

      await this.noteRepo.save(note);
      logDebug('[SessionNoteService] Note created successfully');
      return { success: true, note };
    } catch (error) {
      logError('[SessionNoteService] Create note failed', error);
      return { success: false, error: 'notes.createFailed' };
    }
  }

  /**
   * Read and decrypt a session note
   */
  async readNote(noteId: string, encryptionKey: string): Promise<NoteResult> {
    try {
      const note = await this.noteRepo.findById(noteId);
      if (!note) {
        return { success: false, error: 'notes.notFound' };
      }

      // Reconstruct EncryptedDataVO from stored string
      const encryptedVO = EncryptedDataVO.fromString(note.encryptedContent);
      const decryptedContent = await encryptionService.decrypt(encryptedVO, encryptionKey);

      return { success: true, note, decryptedContent };
    } catch (error) {
      logError('[SessionNoteService] Read note failed', error);
      return { success: false, error: 'notes.decryptFailed' };
    }
  }

  /**
   * Update an existing note
   */
  async updateNote(
    noteId: string,
    plainContent: string,
    encryptionKey: string,
    tags?: string[],
  ): Promise<NoteResult> {
    try {
      const note = await this.noteRepo.findById(noteId);
      if (!note) {
        return { success: false, error: 'notes.notFound' };
      }

      const encrypted = await encryptionService.encrypt(plainContent, encryptionKey);

      note.encryptedContent = encrypted.toString();
      note.encryptionIV = encrypted.iv;
      if (tags !== undefined) {
        note.tags = tags;
      }
      note.updatedAt = new Date();

      await this.noteRepo.update(note);
      logDebug('[SessionNoteService] Note updated');
      return { success: true, note };
    } catch (error) {
      logError('[SessionNoteService] Update note failed', error);
      return { success: false, error: 'notes.updateFailed' };
    }
  }

  /**
   * Get all notes for a patient (therapist view)
   */
  async getPatientNotes(therapistId: string, patientId: string): Promise<SessionNoteEntity[]> {
    return this.noteRepo.findByTherapistAndPatient(therapistId, patientId);
  }

  /**
   * Delete a note
   */
  async deleteNote(noteId: string): Promise<{ success: boolean; error?: string }> {
    try {
      await this.noteRepo.delete(noteId);
      return { success: true };
    } catch (error) {
      logError('[SessionNoteService] Delete note failed', error);
      return { success: false, error: 'notes.deleteFailed' };
    }
  }

  /**
   * Delete all notes for a patient (GDPR Art. 17 right to erasure)
   */
  async deleteAllPatientNotes(patientId: string): Promise<{ success: boolean; error?: string }> {
    try {
      await this.noteRepo.deleteByPatient(patientId);
      logDebug('[SessionNoteService] All patient notes deleted (GDPR Art. 17)');
      return { success: true };
    } catch (error) {
      logError('[SessionNoteService] Delete patient notes failed', error);
      return { success: false, error: 'notes.deleteAllFailed' };
    }
  }
}
