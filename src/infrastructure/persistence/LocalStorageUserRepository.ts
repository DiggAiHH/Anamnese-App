/**
 * LocalStorageUserRepository - Web-compatible user persistence
 *
 * Uses localStorage for data persistence across page refreshes.
 * Surrogate keys (UUIDs) used — no PII in keys.
 *
 * @security No PII in localStorage keys. Password hashes stored (not plaintext).
 * @gdpr Art. 25 Privacy by Design. Deletion removes all user data.
 */

import type { UserEntity, UserRole } from '../../domain/entities/User';
import type { IUserRepository } from '../../domain/repositories/IUserRepository';

const STORAGE_KEY = 'anamnese_users';

export class LocalStorageUserRepository implements IUserRepository {
  private getAll(): UserEntity[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  private saveAll(users: UserEntity[]): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
  }

  async findById(id: string): Promise<UserEntity | null> {
    return this.getAll().find(u => u.id === id) ?? null;
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    return this.getAll().find(u => u.email === email) ?? null;
  }

  async findByRole(role: UserRole): Promise<UserEntity[]> {
    return this.getAll().filter(u => u.role === role);
  }

  async save(user: UserEntity): Promise<void> {
    const all = this.getAll();
    all.push(user);
    this.saveAll(all);
  }

  async update(user: UserEntity): Promise<void> {
    const all = this.getAll();
    const idx = all.findIndex(u => u.id === user.id);
    if (idx !== -1) {
      all[idx] = user;
      this.saveAll(all);
    }
  }

  async delete(id: string): Promise<void> {
    const all = this.getAll().filter(u => u.id !== id);
    this.saveAll(all);
  }
}
