/**
 * Appointment Repository Interface
 *
 * @gdpr Patient references via surrogate UUID only.
 */

import type { AppointmentEntity, AppointmentStatus } from '../entities/Appointment';

export interface IAppointmentRepository {
  findById(id: string): Promise<AppointmentEntity | null>;
  findByTherapist(therapistId: string, from?: string, to?: string): Promise<AppointmentEntity[]>;
  findByPatient(patientId: string, from?: string, to?: string): Promise<AppointmentEntity[]>;
  findByStatus(status: AppointmentStatus): Promise<AppointmentEntity[]>;
  save(appointment: AppointmentEntity): Promise<void>;
  update(appointment: AppointmentEntity): Promise<void>;
  delete(id: string): Promise<void>;
}
