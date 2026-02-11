/**
 * AppointmentService - Terminmanagement Use Cases
 *
 * @security Only therapists can create/modify appointments.
 * @gdpr Patient referenced by UUID only.
 */

import {
  createAppointment,
  appointmentsOverlap,
  type AppointmentEntity,
  type AppointmentType,
  type AppointmentStatus,
} from '../../domain/entities/Appointment';
import type { IAppointmentRepository } from '../../domain/repositories/IAppointmentRepository';
import { logDebug, logError } from '../../shared/logger';

export interface BookingResult {
  success: boolean;
  appointment?: AppointmentEntity;
  error?: string;
}

export class AppointmentService {
  constructor(private readonly appointmentRepo: IAppointmentRepository) {}

  /**
   * Book a new appointment
   * Checks for conflicts before saving.
   */
  async book(
    therapistId: string,
    patientId: string,
    startTime: string,
    type: AppointmentType,
    durationMinutes: number = 50,
  ): Promise<BookingResult> {
    try {
      // Validate start time is in the future
      if (new Date(startTime) < new Date()) {
        return { success: false, error: 'appointments.pastDate' };
      }

      // Check for conflicts with existing appointments
      const candidate = createAppointment(therapistId, patientId, startTime, type, durationMinutes);

      const dayStart = new Date(startTime);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(startTime);
      dayEnd.setHours(23, 59, 59, 999);

      const existing = await this.appointmentRepo.findByTherapist(
        therapistId,
        dayStart.toISOString(),
        dayEnd.toISOString(),
      );

      const activeAppointments = existing.filter(
        a => a.status !== 'cancelled' && a.status !== 'completed',
      );

      const conflict = activeAppointments.find(a => appointmentsOverlap(a, candidate));
      if (conflict) {
        return { success: false, error: 'appointments.conflict' };
      }

      await this.appointmentRepo.save(candidate);
      logDebug('[AppointmentService] Appointment booked');
      return { success: true, appointment: candidate };
    } catch (error) {
      logError('[AppointmentService] Booking failed', error);
      return { success: false, error: 'appointments.bookingFailed' };
    }
  }

  /**
   * Reschedule an appointment
   */
  async reschedule(appointmentId: string, newStartTime: string): Promise<BookingResult> {
    try {
      const appointment = await this.appointmentRepo.findById(appointmentId);
      if (!appointment) {
        return { success: false, error: 'appointments.notFound' };
      }

      if (appointment.status === 'cancelled' || appointment.status === 'completed') {
        return { success: false, error: 'appointments.cannotReschedule' };
      }

      if (new Date(newStartTime) < new Date()) {
        return { success: false, error: 'appointments.pastDate' };
      }

      // Check conflicts at new time
      const testAppt = { ...appointment, startTime: newStartTime };
      const dayStart = new Date(newStartTime);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(newStartTime);
      dayEnd.setHours(23, 59, 59, 999);

      const existing = await this.appointmentRepo.findByTherapist(
        appointment.therapistId,
        dayStart.toISOString(),
        dayEnd.toISOString(),
      );

      const conflict = existing
        .filter(a => a.id !== appointmentId && a.status !== 'cancelled')
        .find(a => appointmentsOverlap(a, testAppt));

      if (conflict) {
        return { success: false, error: 'appointments.conflict' };
      }

      appointment.startTime = newStartTime;
      appointment.updatedAt = new Date();
      await this.appointmentRepo.update(appointment);

      logDebug('[AppointmentService] Appointment rescheduled');
      return { success: true, appointment };
    } catch (error) {
      logError('[AppointmentService] Reschedule failed', error);
      return { success: false, error: 'appointments.rescheduleFailed' };
    }
  }

  /**
   * Cancel an appointment
   */
  async cancel(appointmentId: string, reason?: string): Promise<BookingResult> {
    try {
      const appointment = await this.appointmentRepo.findById(appointmentId);
      if (!appointment) {
        return { success: false, error: 'appointments.notFound' };
      }

      appointment.status = 'cancelled';
      appointment.cancellationReason = reason;
      appointment.updatedAt = new Date();
      await this.appointmentRepo.update(appointment);

      logDebug('[AppointmentService] Appointment cancelled');
      return { success: true, appointment };
    } catch (error) {
      logError('[AppointmentService] Cancel failed', error);
      return { success: false, error: 'appointments.cancelFailed' };
    }
  }

  /**
   * Update appointment status
   */
  async updateStatus(appointmentId: string, status: AppointmentStatus): Promise<BookingResult> {
    try {
      const appointment = await this.appointmentRepo.findById(appointmentId);
      if (!appointment) {
        return { success: false, error: 'appointments.notFound' };
      }

      appointment.status = status;
      appointment.updatedAt = new Date();
      await this.appointmentRepo.update(appointment);

      return { success: true, appointment };
    } catch (error) {
      logError('[AppointmentService] Status update failed', error);
      return { success: false, error: 'appointments.updateFailed' };
    }
  }

  /**
   * Get therapist's schedule for a date range
   */
  async getTherapistSchedule(
    therapistId: string,
    from: string,
    to: string,
  ): Promise<AppointmentEntity[]> {
    return this.appointmentRepo.findByTherapist(therapistId, from, to);
  }

  /**
   * Get patient's appointments
   */
  async getPatientAppointments(
    patientId: string,
    from?: string,
    to?: string,
  ): Promise<AppointmentEntity[]> {
    return this.appointmentRepo.findByPatient(patientId, from, to);
  }
}
