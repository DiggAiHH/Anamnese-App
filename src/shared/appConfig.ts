/**
 * App-wide configuration constants.
 *
 * @description Centralized config for values that may change between
 *   environments or releases. No PII / secrets here — those belong
 *   in environment variables.
 *
 * @security DSGVO Art. 25 — no credentials or PII in source.
 */

/** Developer / support contact email for feedback submissions. */
export const SUPPORT_EMAIL = 'laith.alshdaifat@hotmail.com';

/** Maximum attachment size for lab uploads (bytes). */
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // 10 MB

/** Session timeout duration (milliseconds). */
export const SESSION_TIMEOUT_MS = 15 * 60 * 1000; // 15 min
