/**
 * LocalStorageSessionNoteRepository - Web-compatible encrypted note persistence
 *
 * @security Encrypted content stored (ciphertext, not plaintext).
 * @gdpr Art. 17 - deleteByPatient for right to erasure / crypto-shredding.
 */

import type { SessionNoteEntity } from '../../domain/entities/SessionNote';
import type { ISessionNoteRepository } from '../../domain/repositories/ISessionNoteRepository';

const STORAGE_KEY = 'anamnese_session_notes';

export class LocalStorageSessionNoteRepository implements ISessionNoteRepository {
  private getAll(): SessionNoteEntity[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  private saveAll(notes: SessionNoteEntity[]): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
  }

  async findById(id: string): Promise<SessionNoteEntity | null> {
    return this.getAll().find(n => n.id === id) ?? null;
  }

  async findByAppointment(appointmentId: string): Promise<SessionNoteEntity[]> {
    return this.getAll()
      .filter(n => n.appointmentId === appointmentId)
      .sort((a, b) => b.sessionDate.localeCompare(a.sessionDate));
  }

  async findByTherapistAndPatient(
    therapistId: string,
    patientId: string,
  ): Promise<SessionNoteEntity[]> {
    return this.getAll()
      .filter(n => n.therapistId === therapistId && n.patientId === patientId)
      .sort((a, b) => b.sessionDate.localeCompare(a.sessionDate));
  }

  async save(note: SessionNoteEntity): Promise<void> {
    const all = this.getAll();
    all.push(note);
    this.saveAll(all);
  }

  async update(note: SessionNoteEntity): Promise<void> {
    const all = this.getAll();
    const idx = all.findIndex(n => n.id === note.id);
    if (idx !== -1) {
      all[idx] = note;
      this.saveAll(all);
    }
  }

  async delete(id: string): Promise<void> {
    const all = this.getAll().filter(n => n.id !== id);
    this.saveAll(all);
  }

  /** Find all notes by therapist */
  async findByTherapist(therapistId: string): Promise<SessionNoteEntity[]> {
    return this.getAll()
      .filter(n => n.therapistId === therapistId)
      .sort((a, b) => b.sessionDate.localeCompare(a.sessionDate));
  }

  /** GDPR Art. 17 - Delete all notes for a patient */
  async deleteByPatient(patientId: string): Promise<void> {
    const all = this.getAll().filter(n => n.patientId !== patientId);
    this.saveAll(all);
  }
}
