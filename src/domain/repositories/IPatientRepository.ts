/**
 * Repository Interface für Patient Entity
 * 
 * Hinweis: Dies ist nur das Interface (Domain Layer)
 * Die tatsächliche Implementierung erfolgt im Infrastructure Layer
 */

import { PatientEntity } from '../entities/Patient';

export interface IPatientRepository {
  /**
   * Patient speichern
   */
  save(patient: PatientEntity): Promise<void>;

  /**
   * Patient anhand ID finden
   */
  findById(id: string): Promise<PatientEntity | null>;

  /**
   * Alle Patienten abrufen
   */
  findAll(): Promise<PatientEntity[]>;

  /**
   * Patient löschen (DSGVO Art. 17 - Recht auf Löschung)
   */
  delete(id: string): Promise<void>;

  /**
   * Patient existiert?
   */
  exists(id: string): Promise<boolean>;

  /**
   * Patienten suchen (z.B. nach Namen - verschlüsselt!)
   * Achtung: Suche in verschlüsselten Daten ist limitiert
   */
  search(query: string): Promise<PatientEntity[]>;
}
