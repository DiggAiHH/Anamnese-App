/**
 * In-Memory Document Repository
 *
 * Deterministic implementation for testing purposes.
 *
 * @security TEST ONLY - Never use in production.
 */

import { DocumentEntity } from '@domain/entities/Document';
import { IDocumentRepository } from '@domain/repositories/IDocumentRepository';

// Type for raw document data
type DocumentData = ReturnType<DocumentEntity['toJSON']>;

export class InMemoryDocumentRepository implements IDocumentRepository {
  private documents = new Map<string, DocumentData>();

  async save(document: DocumentEntity): Promise<void> {
    const json = document.toJSON();
    this.documents.set(json.id, json);
  }

  async findById(id: string): Promise<DocumentEntity | null> {
    const data = this.documents.get(id);
    if (!data) {
      return null;
    }
    return DocumentEntity.fromJSON(data);
  }

  async findByPatientId(patientId: string): Promise<DocumentEntity[]> {
    const results: DocumentEntity[] = [];
    for (const data of this.documents.values()) {
      if (data.patientId === patientId) {
        results.push(DocumentEntity.fromJSON(data));
      }
    }
    return results;
  }

  async findByQuestionnaireId(questionnaireId: string): Promise<DocumentEntity[]> {
    const results: DocumentEntity[] = [];
    for (const data of this.documents.values()) {
      if (data.questionnaireId === questionnaireId) {
        results.push(DocumentEntity.fromJSON(data));
      }
    }
    return results;
  }

  async delete(id: string): Promise<void> {
    this.documents.delete(id);
  }

  async deleteByPatientId(patientId: string): Promise<void> {
    const toDelete: string[] = [];
    for (const [id, data] of this.documents.entries()) {
      if (data.patientId === patientId) {
        toDelete.push(id);
      }
    }
    for (const id of toDelete) {
      this.documents.delete(id);
    }
  }

  async getFilePath(id: string): Promise<string | null> {
    const data = this.documents.get(id);
    if (!data) {
      return null;
    }
    return data.encryptedFilePath;
  }

  async getStorageStats(
    patientId: string,
  ): Promise<{ totalFiles: number; totalSize: number; fileTypes: Record<string, number> }> {
    let totalFiles = 0;
    let totalSize = 0;
    const fileTypes: Record<string, number> = {};

    for (const data of this.documents.values()) {
      if (data.patientId === patientId) {
        totalFiles++;
        totalSize += data.fileSize;
        fileTypes[data.mimeType] = (fileTypes[data.mimeType] ?? 0) + 1;
      }
    }

    return { totalFiles, totalSize, fileTypes };
  }

  // Test utility methods
  clear(): void {
    this.documents.clear();
  }

  size(): number {
    return this.documents.size;
  }

  getAll(): DocumentData[] {
    return Array.from(this.documents.values());
  }
}
