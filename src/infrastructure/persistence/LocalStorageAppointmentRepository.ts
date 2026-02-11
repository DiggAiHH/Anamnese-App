/**
 * LocalStorageAppointmentRepository - Web-compatible appointment persistence
 *
 * @security No PII in storage keys.
 * @gdpr Art. 17 - deleteByPatient not needed here (handled via cascade in user deletion).
 */

import type { AppointmentEntity, AppointmentStatus } from '../../domain/entities/Appointment';
import type { IAppointmentRepository } from '../../domain/repositories/IAppointmentRepository';

const STORAGE_KEY = 'anamnese_appointments';

export class LocalStorageAppointmentRepository implements IAppointmentRepository {
  private getAll(): AppointmentEntity[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  private saveAll(appointments: AppointmentEntity[]): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(appointments));
  }

  async findById(id: string): Promise<AppointmentEntity | null> {
    return this.getAll().find(a => a.id === id) ?? null;
  }

  async findByTherapist(
    therapistId: string,
    from?: string,
    to?: string,
  ): Promise<AppointmentEntity[]> {
    let results = this.getAll().filter(a => a.therapistId === therapistId);
    if (from) results = results.filter(a => a.startTime >= from);
    if (to) results = results.filter(a => a.startTime < to);
    return results.sort((a, b) => a.startTime.localeCompare(b.startTime));
  }

  async findByPatient(patientId: string): Promise<AppointmentEntity[]> {
    return this.getAll()
      .filter(a => a.patientId === patientId)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  }

  async findByStatus(status: AppointmentStatus): Promise<AppointmentEntity[]> {
    return this.getAll().filter(a => a.status === status);
  }

  async save(appointment: AppointmentEntity): Promise<void> {
    const all = this.getAll();
    all.push(appointment);
    this.saveAll(all);
  }

  async update(appointment: AppointmentEntity): Promise<void> {
    const all = this.getAll();
    const idx = all.findIndex(a => a.id === appointment.id);
    if (idx !== -1) {
      all[idx] = appointment;
      this.saveAll(all);
    }
  }

  async delete(id: string): Promise<void> {
    const all = this.getAll().filter(a => a.id !== id);
    this.saveAll(all);
  }
}
