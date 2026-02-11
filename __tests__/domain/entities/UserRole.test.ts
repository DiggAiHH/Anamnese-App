/**
 * UserRole Domain Entity - Unit Tests
 *
 * Tests for role types, type guards, capabilities, and i18n key mapping.
 */

import {
  UserRole,
  SessionLocation,
  isValidUserRole,
  isValidSessionLocation,
  getRoleCapabilities,
  getRoleLabelKey,
} from '../../../src/domain/entities/UserRole';

describe('UserRole Entity', () => {
  describe('UserRole enum', () => {
    it('should have DOCTOR and PATIENT values', () => {
      expect(UserRole.DOCTOR).toBe('doctor');
      expect(UserRole.PATIENT).toBe('patient');
    });

    it('should have exactly 2 values', () => {
      const values = Object.values(UserRole);
      expect(values).toHaveLength(2);
      expect(values).toContain('doctor');
      expect(values).toContain('patient');
    });
  });

  describe('SessionLocation enum', () => {
    it('should have PRACTICE and PRIVATE values', () => {
      expect(SessionLocation.PRACTICE).toBe('practice');
      expect(SessionLocation.PRIVATE).toBe('private');
    });
  });

  describe('isValidUserRole', () => {
    it('should return true for valid roles', () => {
      expect(isValidUserRole('doctor')).toBe(true);
      expect(isValidUserRole('patient')).toBe(true);
    });

    it('should return true for UserRole enum values', () => {
      expect(isValidUserRole(UserRole.DOCTOR)).toBe(true);
      expect(isValidUserRole(UserRole.PATIENT)).toBe(true);
    });

    it('should return false for invalid values', () => {
      expect(isValidUserRole('admin')).toBe(false);
      expect(isValidUserRole('nurse')).toBe(false);
      expect(isValidUserRole('')).toBe(false);
      expect(isValidUserRole(null)).toBe(false);
      expect(isValidUserRole(undefined)).toBe(false);
      expect(isValidUserRole(42)).toBe(false);
      expect(isValidUserRole({})).toBe(false);
    });
  });

  describe('isValidSessionLocation', () => {
    it('should return true for valid locations', () => {
      expect(isValidSessionLocation('practice')).toBe(true);
      expect(isValidSessionLocation('private')).toBe(true);
    });

    it('should return false for invalid values', () => {
      expect(isValidSessionLocation('home')).toBe(false);
      expect(isValidSessionLocation('clinic')).toBe(false);
      expect(isValidSessionLocation(null)).toBe(false);
      expect(isValidSessionLocation(undefined)).toBe(false);
    });
  });

  describe('getRoleCapabilities', () => {
    it('should return full capabilities for DOCTOR', () => {
      const caps = getRoleCapabilities(UserRole.DOCTOR);
      expect(caps.canViewAllAnamneses).toBe(true);
      expect(caps.canUploadDocuments).toBe(true);
      expect(caps.canAccessDashboard).toBe(true);
      expect(caps.requiresGDPRConsent).toBe(true);
      expect(caps.canAccessCalculators).toBe(true);
      expect(caps.canManageData).toBe(true);
    });

    it('should return restricted capabilities for PATIENT', () => {
      const caps = getRoleCapabilities(UserRole.PATIENT);
      expect(caps.canViewAllAnamneses).toBe(false);
      expect(caps.canUploadDocuments).toBe(false);
      expect(caps.canAccessDashboard).toBe(false);
      expect(caps.requiresGDPRConsent).toBe(true);
      expect(caps.canAccessCalculators).toBe(false);
      expect(caps.canManageData).toBe(false);
    });

    it('should return minimal capabilities for null role', () => {
      const caps = getRoleCapabilities(null);
      expect(caps.canViewAllAnamneses).toBe(false);
      expect(caps.canUploadDocuments).toBe(false);
      expect(caps.canAccessDashboard).toBe(false);
      expect(caps.requiresGDPRConsent).toBe(true);
      expect(caps.canAccessCalculators).toBe(false);
      expect(caps.canManageData).toBe(false);
    });

    it('should require GDPR consent for all roles', () => {
      expect(getRoleCapabilities(UserRole.DOCTOR).requiresGDPRConsent).toBe(true);
      expect(getRoleCapabilities(UserRole.PATIENT).requiresGDPRConsent).toBe(true);
      expect(getRoleCapabilities(null).requiresGDPRConsent).toBe(true);
    });
  });

  describe('getRoleLabelKey', () => {
    it('should return correct i18n key for DOCTOR', () => {
      expect(getRoleLabelKey(UserRole.DOCTOR)).toBe('role.doctor');
    });

    it('should return correct i18n key for PATIENT', () => {
      expect(getRoleLabelKey(UserRole.PATIENT)).toBe('role.patient');
    });
  });
});
