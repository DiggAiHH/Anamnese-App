/**
 * In-Memory Appointment Repository
 */

import type { IAppointmentRepository } from '../../domain/repositories/IAppointmentRepository';
import type { AppointmentEntity, AppointmentStatus } from '../../domain/entities/Appointment';

export class InMemoryAppointmentRepository implements IAppointmentRepository {
  private appointments = new Map<string, AppointmentEntity>();

  async findById(id: string): Promise<AppointmentEntity | null> {
    return this.appointments.get(id) ?? null;
  }

  async findByTherapist(therapistId: string, from?: string, to?: string): Promise<AppointmentEntity[]> {
    return this.filterByDateRange(
      Array.from(this.appointments.values()).filter(a => a.therapistId === therapistId),
      from,
      to,
    );
  }

  async findByPatient(patientId: string, from?: string, to?: string): Promise<AppointmentEntity[]> {
    return this.filterByDateRange(
      Array.from(this.appointments.values()).filter(a => a.patientId === patientId),
      from,
      to,
    );
  }

  async findByStatus(status: AppointmentStatus): Promise<AppointmentEntity[]> {
    return Array.from(this.appointments.values()).filter(a => a.status === status);
  }

  async save(appointment: AppointmentEntity): Promise<void> {
    this.appointments.set(appointment.id, { ...appointment });
  }

  async update(appointment: AppointmentEntity): Promise<void> {
    if (!this.appointments.has(appointment.id)) {
      throw new Error(`Appointment ${appointment.id} not found`);
    }
    this.appointments.set(appointment.id, { ...appointment, updatedAt: new Date() });
  }

  async delete(id: string): Promise<void> {
    this.appointments.delete(id);
  }

  private filterByDateRange(
    appointments: AppointmentEntity[],
    from?: string,
    to?: string,
  ): AppointmentEntity[] {
    let result = appointments;
    if (from) {
      const fromMs = new Date(from).getTime();
      result = result.filter(a => new Date(a.startTime).getTime() >= fromMs);
    }
    if (to) {
      const toMs = new Date(to).getTime();
      result = result.filter(a => new Date(a.startTime).getTime() <= toMs);
    }
    return result.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  }
}
