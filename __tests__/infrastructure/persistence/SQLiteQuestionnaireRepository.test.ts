jest.mock('../../../src/infrastructure/persistence/DatabaseConnection', () => ({
  database: {
    connect: jest.fn(),
  },
}));

let SQLiteQuestionnaireRepository: typeof import('../../../src/infrastructure/persistence/SQLiteQuestionnaireRepository').SQLiteQuestionnaireRepository;

beforeAll(() => {
  ({
    SQLiteQuestionnaireRepository,
  } = require('../../../src/infrastructure/persistence/SQLiteQuestionnaireRepository'));
});

describe('SQLiteQuestionnaireRepository (template)', () => {
  it('getLatestTemplateVersion() returns version from template JSON', async () => {
    const repo = new SQLiteQuestionnaireRepository();
    await expect(repo.getLatestTemplateVersion()).resolves.toBe('2.0.0');
  });

  it('loadTemplate() returns default sections when no versions map exists', async () => {
    const repo = new SQLiteQuestionnaireRepository();

    const sectionsDefault = await repo.loadTemplate();
    const sectionsWithVersion = await repo.loadTemplate('1.0.0');

    expect(Array.isArray(sectionsDefault)).toBe(true);
    expect(sectionsDefault.length).toBeGreaterThan(0);

    // In our current template file there is no `versions` field.
    expect(sectionsWithVersion.length).toBe(sectionsDefault.length);

    // Smoke check: expected hidden intro section exists
    expect(sectionsDefault[0]?.id).toBe('q0000');
  });
});
