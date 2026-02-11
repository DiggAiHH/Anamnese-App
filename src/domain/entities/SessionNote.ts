/**
 * SessionNote Entity - Encrypted Therapist Notes
 *
 * @security Notes encrypted with AES-256-GCM. Only therapist can decrypt.
 * @gdpr Art. 9: Health data requires explicit consent. Crypto-shredding ready.
 */

import { z } from 'zod';

export const SessionNoteSchema = z.object({
  id: z.string().uuid(),
  /** Appointment ID this note belongs to */
  appointmentId: z.string().uuid(),
  /** Therapist who authored the note */
  therapistId: z.string().uuid(),
  /** Patient surrogate key (no PII) */
  patientId: z.string().uuid(),
  /** AES-256-GCM encrypted content — only decryptable by therapist */
  encryptedContent: z.string(),
  /** IV used for encryption (hex-encoded) */
  encryptionIV: z.string(),
  /** Timestamp of the session */
  sessionDate: z.string(),
  /** Tags for filtering (e.g. 'anxiety', 'progress', 'medication') */
  tags: z.array(z.string()).default([]),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type SessionNoteEntity = z.infer<typeof SessionNoteSchema>;

export const createSessionNote = (
  appointmentId: string,
  therapistId: string,
  patientId: string,
  encryptedContent: string,
  encryptionIV: string,
  sessionDate: string,
  tags: string[] = [],
): SessionNoteEntity => ({
  id: crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`,
  appointmentId,
  therapistId,
  patientId,
  encryptedContent,
  encryptionIV,
  sessionDate,
  tags,
  createdAt: new Date(),
  updatedAt: new Date(),
});
