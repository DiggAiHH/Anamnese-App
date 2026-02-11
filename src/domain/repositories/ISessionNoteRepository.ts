/**
 * Session Note Repository Interface
 *
 * @security Notes are encrypted. Repository stores ciphertext only.
 * @gdpr Art. 17: delete() enables right to erasure via crypto-shredding.
 */

import type { SessionNoteEntity } from '../entities/SessionNote';

export interface ISessionNoteRepository {
  findById(id: string): Promise<SessionNoteEntity | null>;
  findByAppointment(appointmentId: string): Promise<SessionNoteEntity[]>;
  findByTherapistAndPatient(therapistId: string, patientId: string): Promise<SessionNoteEntity[]>;
  findByTherapist(therapistId: string): Promise<SessionNoteEntity[]>;
  save(note: SessionNoteEntity): Promise<void>;
  update(note: SessionNoteEntity): Promise<void>;
  delete(id: string): Promise<void>;
  deleteByPatient(patientId: string): Promise<void>;
}
