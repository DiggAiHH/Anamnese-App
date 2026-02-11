/**
 * DemoDataSeeder Tests - Verifies demo data seeding logic
 */

import { InMemoryUserRepository } from '../../../src/infrastructure/persistence/InMemoryUserRepository';
import { InMemoryAppointmentRepository } from '../../../src/infrastructure/persistence/InMemoryAppointmentRepository';

// Mock encryptionService
jest.mock('../../../src/infrastructure/encryption/encryptionService', () => ({
  encryptionService: {
    deriveKey: jest.fn(async (password: string) => ({
      key: `hashed:${password}`,
      salt: 'mock-salt',
    })),
  },
}));

// Mock react-native Platform
jest.mock('react-native', () => ({
  Platform: { OS: 'android' },
}));

// Mock logger
jest.mock('../../../src/shared/logger', () => ({
  logDebug: jest.fn(),
  logError: jest.fn(),
}));

// Dynamic require to get fresh _memorySeeded per test
// eslint-disable-next-line @typescript-eslint/no-var-requires
function loadSeeder() {
  return require('../../../src/infrastructure/persistence/DemoDataSeeder') as {
    seedDemoData: typeof import('../../../src/infrastructure/persistence/DemoDataSeeder').seedDemoData;
    DEMO_CREDENTIALS: typeof import('../../../src/infrastructure/persistence/DemoDataSeeder').DEMO_CREDENTIALS;
  };
}

describe('DemoDataSeeder', () => {
  let userRepo: InMemoryUserRepository;
  let appointmentRepo: InMemoryAppointmentRepository;

  beforeEach(() => {
    jest.resetModules();
    userRepo = new InMemoryUserRepository();
    appointmentRepo = new InMemoryAppointmentRepository();
  });

  it('should expose demo credentials', () => {
    const { DEMO_CREDENTIALS } = loadSeeder();
    expect(DEMO_CREDENTIALS.email).toBe('demo@therapie.de');
    expect(DEMO_CREDENTIALS.password).toBe('Demo1234!');
    expect(DEMO_CREDENTIALS.displayName).toBe('Dr. Demo Therapeut');
  });

  it('should seed demo therapist user', async () => {
    const { seedDemoData, DEMO_CREDENTIALS } = loadSeeder();
    await seedDemoData(userRepo, appointmentRepo);

    const user = await userRepo.findByEmail(DEMO_CREDENTIALS.email);
    expect(user).not.toBeNull();
    expect(user!.role).toBe('therapist');
    expect(user!.displayName).toBe('Dr. Demo Therapeut');
  });

  it('should seed demo patient user', async () => {
    const { seedDemoData } = loadSeeder();
    await seedDemoData(userRepo, appointmentRepo);

    const user = await userRepo.findByEmail('patient@demo.de');
    expect(user).not.toBeNull();
    expect(user!.role).toBe('patient');
    expect(user!.displayName).toBe('Max Mustermann');
  });

  it('should seed sample appointments', async () => {
    const { seedDemoData, DEMO_CREDENTIALS } = loadSeeder();
    await seedDemoData(userRepo, appointmentRepo);

    const therapist = await userRepo.findByEmail(DEMO_CREDENTIALS.email);
    expect(therapist).not.toBeNull();

    const appointments = await appointmentRepo.findByTherapist(therapist!.id);
    expect(appointments.length).toBeGreaterThanOrEqual(3);
  });

  it('should not seed twice on native (memory flag)', async () => {
    const { seedDemoData } = loadSeeder();
    await seedDemoData(userRepo, appointmentRepo);

    // Second call with same module instance should be no-op (_memorySeeded=true)
    const userRepo2 = new InMemoryUserRepository();
    const appointmentRepo2 = new InMemoryAppointmentRepository();
    await seedDemoData(userRepo2, appointmentRepo2);

    // The second repos should be empty because seeding was skipped
    const users = await userRepo2.findByRole('therapist');
    expect(users).toHaveLength(0);
  });

  it('should not seed if demo user already exists', async () => {
    const { DEMO_CREDENTIALS } = loadSeeder();
    // Pre-populate with demo user
    const { createUser } = require('../../../src/domain/entities/User');
    const existing = createUser('therapist', DEMO_CREDENTIALS.email, 'existing-hash', 'Existing');
    await userRepo.save(existing);

    // Reset the memory flag to allow re-check
    jest.resetModules();
    const { seedDemoData: seedFresh } = loadSeeder();
    await seedFresh(userRepo, appointmentRepo);

    // Should still have only 1 user with the original hash
    const user = await userRepo.findByEmail(DEMO_CREDENTIALS.email);
    expect(user!.passwordHash).toBe('existing-hash');
  });
});
