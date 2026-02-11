/**
 * UserRole - Domain Entity for application user roles
 *
 * Defines the role-based access model for the Anamnese-App:
 * - DOCTOR: Practice/clinic use — full access to saved anamneses, upload, analysis
 * - PATIENT: Self-service use — guided flow, GDPR-first, own data only
 *
 * @security No PII. Role is UI state only (persisted in AsyncStorage, not SQLite).
 * @compliance DSGVO Art. 25 - Privacy by Design: Patient role enforces GDPR consent before data input.
 */

/**
 * Primary user roles in the application
 */
export enum UserRole {
  DOCTOR = 'doctor',
  PATIENT = 'patient',
}

/**
 * Extended type including null for "no role selected" state
 */
export type UserRoleOrNull = UserRole | null;

/**
 * Location context for the anamnesis session
 */
export enum SessionLocation {
  PRACTICE = 'practice',
  PRIVATE = 'private',
}

/**
 * Type guard: checks if a string is a valid UserRole
 */
export function isValidUserRole(value: unknown): value is UserRole {
  return value === UserRole.DOCTOR || value === UserRole.PATIENT;
}

/**
 * Type guard: checks if a string is a valid SessionLocation
 */
export function isValidSessionLocation(value: unknown): value is SessionLocation {
  return value === SessionLocation.PRACTICE || value === SessionLocation.PRIVATE;
}

/**
 * Role capabilities - defines what each role can do
 */
export interface RoleCapabilities {
  /** Can view all saved anamneses (not just own) */
  canViewAllAnamneses: boolean;
  /** Can upload external documents */
  canUploadDocuments: boolean;
  /** Can access analysis dashboard */
  canAccessDashboard: boolean;
  /** Must complete GDPR consent before data input */
  requiresGDPRConsent: boolean;
  /** Can access clinical calculators */
  canAccessCalculators: boolean;
  /** Can manage data (backup/restore) */
  canManageData: boolean;
}

/**
 * Returns the capabilities for a given role
 */
export function getRoleCapabilities(role: UserRoleOrNull): RoleCapabilities {
  switch (role) {
    case UserRole.DOCTOR:
      return {
        canViewAllAnamneses: true,
        canUploadDocuments: true,
        canAccessDashboard: true,
        requiresGDPRConsent: true, // Still required for patient data
        canAccessCalculators: true,
        canManageData: true,
      };
    case UserRole.PATIENT:
      return {
        canViewAllAnamneses: false, // Own data only
        canUploadDocuments: false,
        canAccessDashboard: false,
        requiresGDPRConsent: true,
        canAccessCalculators: false,
        canManageData: false,
      };
    default:
      // No role selected — minimal capabilities
      return {
        canViewAllAnamneses: false,
        canUploadDocuments: false,
        canAccessDashboard: false,
        requiresGDPRConsent: true,
        canAccessCalculators: false,
        canManageData: false,
      };
  }
}

/**
 * i18n key for a role's display label
 */
export function getRoleLabelKey(role: UserRole): string {
  switch (role) {
    case UserRole.DOCTOR:
      return 'role.doctor';
    case UserRole.PATIENT:
      return 'role.patient';
  }
}
