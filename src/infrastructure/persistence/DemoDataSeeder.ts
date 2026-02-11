/**
 * Demo Data Seeder - Populates app with sample therapist + appointments for testing
 *
 * Only runs once (checks localStorage flag on web, memory flag on native).
 * Creates a demo therapist account and sample appointments.
 *
 * @security Demo credentials use PBKDF2 hashing — same as production.
 * @gdpr No real PII. All data is synthetic.
 */

import { Platform } from 'react-native';
import { createUser } from '../../domain/entities/User';
import { createAppointment } from '../../domain/entities/Appointment';
import type { IUserRepository } from '../../domain/repositories/IUserRepository';
import type { IAppointmentRepository } from '../../domain/repositories/IAppointmentRepository';
import { encryptionService } from '../encryption/encryptionService';
import { logDebug } from '../../shared/logger';

const SEED_FLAG = 'anamnese_demo_seeded';

/** Demo therapist credentials for testing */
export const DEMO_CREDENTIALS = {
  email: 'demo@therapie.de',
  password: 'Demo1234!',
  displayName: 'Dr. Demo Therapeut',
} as const;

let _memorySeeded = false;

export async function seedDemoData(
  userRepo: IUserRepository,
  appointmentRepo: IAppointmentRepository,
): Promise<void> {
  // Check if already seeded
  if (Platform.OS === 'web') {
    if (localStorage.getItem(SEED_FLAG)) return;
  } else {
    if (_memorySeeded) return;
  }

  try {
    // Check if demo user already exists
    const existing = await userRepo.findByEmail(DEMO_CREDENTIALS.email);
    if (existing) {
      markSeeded();
      return;
    }

    // Create demo therapist
    const derived = await encryptionService.deriveKey(DEMO_CREDENTIALS.password);
    const therapist = createUser(
      'therapist',
      DEMO_CREDENTIALS.email,
      derived.key,
      DEMO_CREDENTIALS.displayName,
    );
    await userRepo.save(therapist);

    // Create demo patient user
    const patientDerived = await encryptionService.deriveKey('Patient123!');
    const patient = createUser('patient', 'patient@demo.de', patientDerived.key, 'Max Mustermann');
    await userRepo.save(patient);

    // Create sample appointments for today and this week
    const today = new Date();
    const appointments = [
      {
        patientId: patient.id,
        type: 'initial_session' as const,
        startTime: setTime(today, 9, 0),
        duration: 60,
        status: 'confirmed' as const,
        patientName: 'Max Mustermann',
      },
      {
        patientId: patient.id,
        type: 'follow_up' as const,
        startTime: setTime(today, 11, 0),
        duration: 50,
        status: 'scheduled' as const,
        patientName: 'Max Mustermann',
      },
      {
        patientId: 'patient-002',
        type: 'crisis' as const,
        startTime: setTime(today, 14, 0),
        duration: 50,
        status: 'scheduled' as const,
        patientName: 'Erika Musterfrau',
      },
      {
        patientId: 'patient-003',
        type: 'crisis' as const,
        startTime: setTime(addDays(today, 1), 10, 0),
        duration: 90,
        status: 'scheduled' as const,
        patientName: 'Jan Beispiel',
      },
      {
        patientId: patient.id,
        type: 'follow_up' as const,
        startTime: setTime(addDays(today, 2), 15, 0),
        duration: 50,
        status: 'scheduled' as const,
        patientName: 'Max Mustermann',
      },
    ];

    for (const apt of appointments) {
      const entity = createAppointment(
        therapist.id,
        apt.patientId,
        apt.startTime.toISOString(),
        apt.type,
        apt.duration,
      );
      entity.status = apt.status;
      entity.encryptedNotes = `Termin mit ${apt.patientName}`;
      await appointmentRepo.save(entity);
    }

    markSeeded();
    logDebug(`[DemoSeeder] Demo data created: therapist=${therapist.id}, ${appointments.length} appointments`);
  } catch (error) {
    logDebug('[DemoSeeder] Seeding failed (non-critical)');
  }
}

function markSeeded(): void {
  if (Platform.OS === 'web') {
    localStorage.setItem(SEED_FLAG, 'true');
  }
  _memorySeeded = true;
}

function setTime(date: Date, hours: number, minutes: number): Date {
  const d = new Date(date);
  d.setHours(hours, minutes, 0, 0);
  return d;
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}
