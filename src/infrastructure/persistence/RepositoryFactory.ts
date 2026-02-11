/**
 * Repository Factory - Platform-aware repository instantiation
 *
 * Web: localStorage-backed (survives page refresh)
 * Native: InMemory (MVP, replaced by SQLite in production)
 *
 * @security No PII in factory. Delegates to concrete implementations.
 */

import { Platform } from 'react-native';
import type { IUserRepository } from '../../domain/repositories/IUserRepository';
import type { IAppointmentRepository } from '../../domain/repositories/IAppointmentRepository';
import type { ISessionNoteRepository } from '../../domain/repositories/ISessionNoteRepository';
import { InMemoryUserRepository } from './InMemoryUserRepository';
import { InMemoryAppointmentRepository } from './InMemoryAppointmentRepository';
import { InMemorySessionNoteRepository } from './InMemorySessionNoteRepository';

let _userRepo: IUserRepository | null = null;
let _appointmentRepo: IAppointmentRepository | null = null;
let _sessionNoteRepo: ISessionNoteRepository | null = null;

function isWeb(): boolean {
  return Platform.OS === 'web';
}

async function createUserRepo(): Promise<IUserRepository> {
  return createUserRepoSync();
}

async function createAppointmentRepo(): Promise<IAppointmentRepository> {
  return createAppointmentRepoSync();
}

async function createSessionNoteRepo(): Promise<ISessionNoteRepository> {
  return createSessionNoteRepoSync();
}

/** Get or create the singleton user repository */
export async function getUserRepository(): Promise<IUserRepository> {
  if (!_userRepo) {
    _userRepo = await createUserRepo();
  }
  return _userRepo;
}

/** Get or create the singleton appointment repository */
export async function getAppointmentRepository(): Promise<IAppointmentRepository> {
  if (!_appointmentRepo) {
    _appointmentRepo = await createAppointmentRepo();
  }
  return _appointmentRepo;
}

/** Get or create the singleton session note repository */
export async function getSessionNoteRepository(): Promise<ISessionNoteRepository> {
  if (!_sessionNoteRepo) {
    _sessionNoteRepo = await createSessionNoteRepo();
  }
  return _sessionNoteRepo;
}

/**
 * Synchronous repo getters for screens that create singletons at module level.
 * On web: uses localStorage. On native: uses in-memory.
 * These are safe to call at module top level.
 */
export function createUserRepoSync(): IUserRepository {
  if (isWeb()) {
    // Dynamic require avoided — lazy init pattern used instead
    const { LocalStorageUserRepository } = require('./LocalStorageUserRepository');
    return new LocalStorageUserRepository();
  }
  return new InMemoryUserRepository();
}

export function createAppointmentRepoSync(): IAppointmentRepository {
  if (isWeb()) {
    const { LocalStorageAppointmentRepository } = require('./LocalStorageAppointmentRepository');
    return new LocalStorageAppointmentRepository();
  }
  return new InMemoryAppointmentRepository();
}

export function createSessionNoteRepoSync(): ISessionNoteRepository {
  if (isWeb()) {
    const { LocalStorageSessionNoteRepository } = require('./LocalStorageSessionNoteRepository');
    return new LocalStorageSessionNoteRepository();
  }
  return new InMemorySessionNoteRepository();
}
