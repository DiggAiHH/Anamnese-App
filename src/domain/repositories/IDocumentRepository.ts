/**
 * Repository Interface für Document Entity
 */

import { DocumentEntity } from '../entities/Document';

export interface IDocumentRepository {
  /**
   * Dokument speichern
   */
  save(document: DocumentEntity): Promise<void>;

  /**
   * Dokument anhand ID finden
   */
  findById(id: string): Promise<DocumentEntity | null>;

  /**
   * Dokumente für einen Patienten finden
   */
  findByPatientId(patientId: string): Promise<DocumentEntity[]>;

  /**
   * Dokumente für einen Fragebogen finden
   */
  findByQuestionnaireId(questionnaireId: string): Promise<DocumentEntity[]>;

  /**
   * Dokument löschen (inkl. Datei)
   */
  delete(id: string): Promise<void>;

  /**
   * Alle Dokumente eines Patienten löschen
   */
  deleteByPatientId(patientId: string): Promise<void>;

  /**
   * Dateipfad zu Dokument abrufen (verschlüsselt)
   */
  getFilePath(id: string): Promise<string | null>;

  /**
   * Speicherplatz-Statistiken
   */
  getStorageStats(patientId: string): Promise<{
    totalFiles: number;
    totalSize: number; // in bytes
    fileTypes: Record<string, number>; // MIME type -> count
  }>;
}
