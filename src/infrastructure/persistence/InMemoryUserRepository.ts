/**
 * In-Memory User Repository
 *
 * @security Passwords stored as hashes only. No plaintext.
 */

import type { IUserRepository } from '../../domain/repositories/IUserRepository';
import type { UserEntity, UserRole } from '../../domain/entities/User';

export class InMemoryUserRepository implements IUserRepository {
  private users = new Map<string, UserEntity>();

  async findById(id: string): Promise<UserEntity | null> {
    return this.users.get(id) ?? null;
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    for (const user of this.users.values()) {
      if (user.email === email) return user;
    }
    return null;
  }

  async findByRole(role: UserRole): Promise<UserEntity[]> {
    return Array.from(this.users.values()).filter(u => u.role === role);
  }

  async save(user: UserEntity): Promise<void> {
    this.users.set(user.id, { ...user });
  }

  async update(user: UserEntity): Promise<void> {
    if (!this.users.has(user.id)) {
      throw new Error(`User ${user.id} not found`);
    }
    this.users.set(user.id, { ...user });
  }

  async delete(id: string): Promise<void> {
    this.users.delete(id);
  }
}
