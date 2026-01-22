jest.mock('../../../src/shared/platformCapabilities', () => ({
  supportsSQLite: false,
  canUseSQLite: () => false,
  platformOS: 'test',
}));

import { DatabaseConnection } from '../../../src/infrastructure/persistence/DatabaseConnection';

describe('DatabaseConnection.getStats', () => {
  it('returns zeros when result rows are empty or null', async () => {
    const db = new DatabaseConnection('test.db');
    await db.connect();

    const stats = await db.getStats();

    expect(stats).toEqual({
      patients: 0,
      questionnaires: 0,
      answers: 0,
      documents: 0,
      dbSize: 0,
    });
  });
});
