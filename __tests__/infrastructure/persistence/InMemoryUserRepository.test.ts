/**
 * Unit Tests: InMemoryUserRepository
 */
import { InMemoryUserRepository } from '../../../src/infrastructure/persistence/InMemoryUserRepository';
import { createUser } from '../../../src/domain/entities/User';

describe('InMemoryUserRepository', () => {
  let repo: InMemoryUserRepository;

  beforeEach(() => {
    repo = new InMemoryUserRepository();
  });

  it('saves and retrieves a user by ID', async () => {
    const user = createUser('therapist', 'dr@example.com', 'hash', 'Dr. Test');
    await repo.save(user);
    const found = await repo.findById(user.id);
    expect(found).toBeDefined();
    expect(found!.email).toBe('dr@example.com');
  });

  it('finds user by email', async () => {
    const user = createUser('patient', 'patient@example.com', 'hash', 'Patient');
    await repo.save(user);
    const found = await repo.findByEmail('patient@example.com');
    expect(found).toBeDefined();
    expect(found!.id).toBe(user.id);
  });

  it('returns null for unknown email', async () => {
    const found = await repo.findByEmail('nobody@example.com');
    expect(found).toBeNull();
  });

  it('finds users by role', async () => {
    await repo.save(createUser('therapist', 'a@b.com', 'h', 'A'));
    await repo.save(createUser('patient', 'c@d.com', 'h', 'B'));
    await repo.save(createUser('therapist', 'e@f.com', 'h', 'C'));

    const therapists = await repo.findByRole('therapist');
    expect(therapists).toHaveLength(2);

    const patients = await repo.findByRole('patient');
    expect(patients).toHaveLength(1);
  });

  it('updates a user', async () => {
    const user = createUser('therapist', 'dr@example.com', 'hash', 'Dr. Test');
    await repo.save(user);

    user.displayName = 'Dr. Updated';
    user.is2FAEnabled = true;
    await repo.update(user);

    const found = await repo.findById(user.id);
    expect(found!.displayName).toBe('Dr. Updated');
    expect(found!.is2FAEnabled).toBe(true);
  });

  it('deletes a user', async () => {
    const user = createUser('patient', 'p@example.com', 'hash', 'P');
    await repo.save(user);
    expect(await repo.findById(user.id)).toBeDefined();

    await repo.delete(user.id);
    expect(await repo.findById(user.id)).toBeNull();
  });

  it('returns null for non-existent ID', async () => {
    const found = await repo.findById('non-existent-id');
    expect(found).toBeNull();
  });
});
