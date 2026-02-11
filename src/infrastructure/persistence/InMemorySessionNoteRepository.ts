/**
 * In-Memory Session Note Repository
 *
 * @security Stores encrypted content only. No plaintext notes in memory.
 */

import type { ISessionNoteRepository } from '../../domain/repositories/ISessionNoteRepository';
import type { SessionNoteEntity } from '../../domain/entities/SessionNote';

export class InMemorySessionNoteRepository implements ISessionNoteRepository {
  private notes = new Map<string, SessionNoteEntity>();

  async findById(id: string): Promise<SessionNoteEntity | null> {
    return this.notes.get(id) ?? null;
  }

  async findByAppointment(appointmentId: string): Promise<SessionNoteEntity[]> {
    return Array.from(this.notes.values())
      .filter(n => n.appointmentId === appointmentId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async findByTherapistAndPatient(therapistId: string, patientId: string): Promise<SessionNoteEntity[]> {
    return Array.from(this.notes.values())
      .filter(n => n.therapistId === therapistId && n.patientId === patientId)
      .sort((a, b) => new Date(b.sessionDate).getTime() - new Date(a.sessionDate).getTime());
  }

  async findByTherapist(therapistId: string): Promise<SessionNoteEntity[]> {
    return Array.from(this.notes.values())
      .filter(n => n.therapistId === therapistId)
      .sort((a, b) => new Date(b.sessionDate).getTime() - new Date(a.sessionDate).getTime());
  }

  async save(note: SessionNoteEntity): Promise<void> {
    this.notes.set(note.id, { ...note });
  }

  async update(note: SessionNoteEntity): Promise<void> {
    if (!this.notes.has(note.id)) {
      throw new Error(`SessionNote ${note.id} not found`);
    }
    this.notes.set(note.id, { ...note, updatedAt: new Date() });
  }

  async delete(id: string): Promise<void> {
    this.notes.delete(id);
  }

  async deleteByPatient(patientId: string): Promise<void> {
    for (const [id, note] of this.notes) {
      if (note.patientId === patientId) {
        this.notes.delete(id);
      }
    }
  }
}
