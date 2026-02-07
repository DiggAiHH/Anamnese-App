/**
 * Seed Data Utility - Test/Demo data for development
 *
 * @description Provides pre-defined patient and questionnaire data for testing
 * @security NO PII - all data is fictional and anonymized
 * @usage Development and Demo modes only
 */

import { PatientEntity } from '../domain/entities/Patient';

/**
 * Demo patient data - completely fictional, no real PII
 */
export interface SeedPatient {
  firstName: string;
  lastName: string;
  birthDate: string;
  gender: 'male' | 'female' | 'other';
  language:
    | 'de'
    | 'en'
    | 'fr'
    | 'es'
    | 'it'
    | 'pt'
    | 'nl'
    | 'pl'
    | 'tr'
    | 'ru'
    | 'ar'
    | 'fa'
    | 'zh'
    | 'ja'
    | 'ko'
    | 'vi'
    | 'uk'
    | 'ro'
    | 'el';
}

/**
 * Fictional demo patients for testing various scenarios
 * All names are generated and do not represent real persons
 */
export const SEED_PATIENTS: SeedPatient[] = [
  // German patients
  {
    firstName: 'Max',
    lastName: 'Mustermann',
    birthDate: '1985-06-15',
    gender: 'male',
    language: 'de',
  },
  {
    firstName: 'Erika',
    lastName: 'Musterfrau',
    birthDate: '1990-03-22',
    gender: 'female',
    language: 'de',
  },
  // English patient
  {
    firstName: 'John',
    lastName: 'Doe',
    birthDate: '1978-11-08',
    gender: 'male',
    language: 'en',
  },
  // French patient
  {
    firstName: 'Marie',
    lastName: 'Dupont',
    birthDate: '1995-01-30',
    gender: 'female',
    language: 'fr',
  },
  // Spanish patient
  {
    firstName: 'Carlos',
    lastName: 'García',
    birthDate: '1982-07-12',
    gender: 'male',
    language: 'es',
  },
  // Turkish patient
  {
    firstName: 'Ayşe',
    lastName: 'Yılmaz',
    birthDate: '1988-04-25',
    gender: 'female',
    language: 'tr',
  },
  // Arabic patient
  {
    firstName: 'أحمد',
    lastName: 'محمد',
    birthDate: '1975-09-18',
    gender: 'male',
    language: 'ar',
  },
  // Chinese patient
  {
    firstName: '小明',
    lastName: '王',
    birthDate: '1992-12-05',
    gender: 'male',
    language: 'zh',
  },
  // Japanese patient
  {
    firstName: '花子',
    lastName: '田中',
    birthDate: '1998-02-14',
    gender: 'female',
    language: 'ja',
  },
  // Diverse/Other gender example
  {
    firstName: 'Alex',
    lastName: 'Schmidt',
    birthDate: '2000-08-20',
    gender: 'other',
    language: 'de',
  },
];

/**
 * Sample questionnaire answers for testing
 */
export const SEED_ANSWERS: Record<string, string | boolean | string[]> = {
  // Basisdaten
  '0000': 'Mustermann',
  '0001': 'Max',
  '0002': 'männlich',
  '0003': '1985-06-15',

  // Aktuelle Beschwerden
  '1000': 'true', // Haben Sie aktuelle Beschwerden?
  '1001': 'Leichte Kopfschmerzen seit 2 Tagen',
  '1002': 'false', // Fieber
  '1003': 'false', // Husten
  '1004': 'false', // Durchfall
  '1005': 'false', // Erbrechen
  '1006': 'MRT', // Untersuchung

  // Körpermaße
  '4000': '178', // Körpergröße
  '4001': '75', // Körpergewicht
  '4002': 'nein', // Rauchen

  // Diabetes
  '5000': 'nein', // Diabetes

  // Mobilität & Implantate
  '6000': 'ja', // Selbstständig mobil
  '6001': 'nein', // Metallische Implantate
  '6006': 'nein', // Allergien

  // Vorerkrankungen
  '8000': 'nein', // Herzerkrankungen
  '8001': 'nein', // Lungenerkrankungen
};

/**
 * Create a PatientEntity from seed data
 *
 * @param seed - Seed patient data
 * @returns PatientEntity with GDPR consents already granted
 */
export function createSeedPatient(seed: SeedPatient): PatientEntity {
  const patient = PatientEntity.create({
    firstName: seed.firstName,
    lastName: seed.lastName,
    birthDate: seed.birthDate,
    gender: seed.gender,
    language: seed.language,
  });

  // Add required GDPR consents for demo
  let updated = patient;
  updated = updated.addConsent('data_processing', true, '1.0.0');
  updated = updated.addConsent('data_storage', true, '1.0.0');
  updated = updated.addConsent('gdt_export', true, '1.0.0');

  return updated;
}

/**
 * Get a random seed patient
 */
export function getRandomSeedPatient(): SeedPatient {
  const index = Math.floor(Math.random() * SEED_PATIENTS.length);
  return SEED_PATIENTS[index];
}

/**
 * Get seed patient by language
 *
 * @param language - ISO language code
 */
export function getSeedPatientByLanguage(language: string): SeedPatient | undefined {
  return SEED_PATIENTS.find(p => p.language === language);
}

/**
 * Check if running in development mode
 */
export function isDevelopment(): boolean {
  return __DEV__ === true;
}

/**
 * Export all seed data for tests
 */
export const SeedData = {
  patients: SEED_PATIENTS,
  answers: SEED_ANSWERS,
  createPatient: createSeedPatient,
  getRandom: getRandomSeedPatient,
  getByLanguage: getSeedPatientByLanguage,
  isDev: isDevelopment,
} as const;

export default SeedData;
