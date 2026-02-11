/**
 * User Repository Interface
 *
 * @security Password hashes only. No plaintext credentials.
 * @gdpr Art. 17: Supports hard delete for right to erasure.
 */

import type { UserEntity, UserRole } from '../entities/User';

export interface IUserRepository {
  findById(id: string): Promise<UserEntity | null>;
  findByEmail(email: string): Promise<UserEntity | null>;
  findByRole(role: UserRole): Promise<UserEntity[]>;
  save(user: UserEntity): Promise<void>;
  update(user: UserEntity): Promise<void>;
  delete(id: string): Promise<void>;
}
