/**
 * Appointment Entity - Terminmanagement
 *
 * @security Appointment data encrypted at rest.
 * @gdpr Patient references via surrogate key (UUID) only.
 */

import { z } from 'zod';

export type AppointmentStatus = 'scheduled' | 'confirmed' | 'cancelled' | 'completed' | 'no_show';
export type AppointmentType = 'initial_session' | 'follow_up' | 'crisis' | 'group' | 'online';

export const AppointmentSchema = z.object({
  id: z.string().uuid(),
  /** Therapist user ID */
  therapistId: z.string().uuid(),
  /** Patient user ID (surrogate key — no PII) */
  patientId: z.string().uuid(),
  /** ISO 8601 datetime */
  startTime: z.string(),
  /** Duration in minutes */
  durationMinutes: z.number().min(15).max(180).default(50),
  status: z.enum(['scheduled', 'confirmed', 'cancelled', 'completed', 'no_show']),
  type: z.enum(['initial_session', 'follow_up', 'crisis', 'group', 'online']),
  /** Optional video room ID for online sessions */
  videoRoomId: z.string().optional(),
  /** Encrypted notes visible only to therapist */
  encryptedNotes: z.string().optional(),
  /** Cancellation reason (optional) */
  cancellationReason: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type AppointmentEntity = z.infer<typeof AppointmentSchema>;

export const createAppointment = (
  therapistId: string,
  patientId: string,
  startTime: string,
  type: AppointmentType,
  durationMinutes: number = 50,
): AppointmentEntity => ({
  id: crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`,
  therapistId,
  patientId,
  startTime,
  durationMinutes,
  status: 'scheduled',
  type,
  createdAt: new Date(),
  updatedAt: new Date(),
});

/**
 * Get end time from appointment
 */
export const getAppointmentEndTime = (appt: AppointmentEntity): Date => {
  const start = new Date(appt.startTime);
  return new Date(start.getTime() + appt.durationMinutes * 60_000);
};

/**
 * Check if two appointments overlap
 */
export const appointmentsOverlap = (a: AppointmentEntity, b: AppointmentEntity): boolean => {
  const aStart = new Date(a.startTime).getTime();
  const aEnd = getAppointmentEndTime(a).getTime();
  const bStart = new Date(b.startTime).getTime();
  const bEnd = getAppointmentEndTime(b).getTime();
  return aStart < bEnd && aEnd > bStart;
};
