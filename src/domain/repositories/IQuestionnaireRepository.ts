/**
 * Repository Interface für Questionnaire Entity
 */

import { QuestionnaireEntity, Section } from '../entities/Questionnaire';

export interface IQuestionnaireRepository {
  /**
   * Fragebogen speichern
   */
  save(questionnaire: QuestionnaireEntity): Promise<void>;

  /**
   * Fragebogen anhand ID finden
   */
  findById(id: string): Promise<QuestionnaireEntity | null>;

  /**
   * Fragebögen für einen Patienten finden
   */
  findByPatientId(patientId: string): Promise<QuestionnaireEntity[]>;

  /**
   * Fragebogen löschen
   */
  delete(id: string): Promise<void>;

  /**
   * Fragebogen-Template laden (Standard-Sektionen & Fragen)
   */
  loadTemplate(version?: string): Promise<Section[]>;

  /**
   * Neueste Version des Templates abrufen
   */
  getLatestTemplateVersion(): Promise<string>;
}
