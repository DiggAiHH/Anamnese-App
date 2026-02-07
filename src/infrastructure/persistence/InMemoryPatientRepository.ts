/**
 * In-Memory Patient Repository
 *
 * Deterministic implementation for testing purposes.
 * No encryption - stores data in plain format for test assertions.
 *
 * @security TEST ONLY - Never use in production.
 */

import { PatientEntity, Patient } from '@domain/entities/Patient';
import { IPatientRepository } from '@domain/repositories/IPatientRepository';

export class InMemoryPatientRepository implements IPatientRepository {
  private patients = new Map<string, Patient>();

  async save(patient: PatientEntity): Promise<void> {
    const json = patient.toJSON();
    this.patients.set(json.id, json);
  }

  async findById(id: string): Promise<PatientEntity | null> {
    const data = this.patients.get(id);
    if (!data) {
      return null;
    }
    return PatientEntity.fromJSON(data);
  }

  async findAll(): Promise<PatientEntity[]> {
    const results: PatientEntity[] = [];
    for (const data of this.patients.values()) {
      results.push(PatientEntity.fromJSON(data));
    }
    return results;
  }

  async delete(id: string): Promise<void> {
    this.patients.delete(id);
  }

  async exists(id: string): Promise<boolean> {
    return this.patients.has(id);
  }

  async search(query: string): Promise<PatientEntity[]> {
    const lowerQuery = query.toLowerCase();
    const results: PatientEntity[] = [];

    for (const data of this.patients.values()) {
      const firstName = data.encryptedData.firstName?.toLowerCase() ?? '';
      const lastName = data.encryptedData.lastName?.toLowerCase() ?? '';

      if (firstName.includes(lowerQuery) || lastName.includes(lowerQuery)) {
        results.push(PatientEntity.fromJSON(data));
      }
    }
    return results;
  }

  // Test utility methods
  clear(): void {
    this.patients.clear();
  }

  size(): number {
    return this.patients.size;
  }

  getAll(): Patient[] {
    return Array.from(this.patients.values());
  }
}
