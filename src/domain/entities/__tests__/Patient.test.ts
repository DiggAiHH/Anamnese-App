import { PatientEntity } from '../Patient';

describe('PatientEntity', () => {
  const baseParams = {
    firstName: 'Max',
    lastName: 'Mustermann',
    birthDate: '1990-01-01',
    language: 'de' as const,
  };

  it('creates a patient with required fields', () => {
    const patient = PatientEntity.create(baseParams);

    expect(patient.id).toBeDefined();
    expect(patient.language).toBe('de');
    expect(patient.gdprConsents).toHaveLength(0);
    expect(patient.auditLog[0].action).toBe('created');
  });

  it('adds GDPR consents and checks latest state', () => {
    const patient = PatientEntity.create(baseParams);
    const withConsent = patient.addConsent('data_processing', true, '1.0.0');
    const withStorage = withConsent.addConsent('data_storage', false, '1.0.0');

    expect(withStorage.gdprConsents).toHaveLength(2);
    expect(withStorage.hasConsent('data_processing')).toBe(true);
    expect(withStorage.hasConsent('data_storage')).toBe(false);
    // Audit log contains at least the initial "created" entry
    expect(withStorage.auditLog.length).toBeGreaterThanOrEqual(1);
  });

  it('changes language immutably', () => {
    const patient = PatientEntity.create(baseParams);
    const updated = patient.changeLanguage('en');

    expect(updated.language).toBe('en');
    expect(patient.language).toBe('de');
    expect(updated.updatedAt.getTime()).toBeGreaterThanOrEqual(patient.updatedAt.getTime());
  });

  it('serializes and deserializes with dates intact', () => {
    const patient = PatientEntity.create(baseParams).addConsent('gdt_export', true, '1.0.0');
    const json = patient.toJSON();
    const restored = PatientEntity.fromJSON(json);

    expect(restored.id).toBe(patient.id);
    expect(restored.createdAt).toBeInstanceOf(Date);
    expect(restored.gdprConsents[0].timestamp).toBeInstanceOf(Date);
  });
});
