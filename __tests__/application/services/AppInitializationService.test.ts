/**
 * AppInitializationService Unit Tests
 *
 * Tests the singleton initialization flow.
 */

jest.mock('../../../src/shared/logger', () => ({
  logInfo: jest.fn(),
  logError: jest.fn(),
  logDebug: jest.fn(),
  logWarn: jest.fn(),
}));

jest.mock('../../../src/infrastructure/services/TemplateMigrationService', () => {
  return {
    TemplateMigrationService: jest.fn().mockImplementation(() => ({
      migrate: jest.fn().mockResolvedValue(448),
    })),
  };
});

import {
  initializeApp,
  resetInitialization,
  isAppInitialized,
} from '../../../src/application/services/AppInitializationService';
import { TemplateMigrationService } from '../../../src/infrastructure/services/TemplateMigrationService';
import { logInfo, logError } from '../../../src/shared/logger';

describe('AppInitializationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetInitialization();
  });

  it('should not be initialized by default', () => {
    expect(isAppInitialized()).toBe(false);
  });

  it('should initialize successfully and set flag', async () => {
    const result = await initializeApp();

    expect(result).toBe(true);
    expect(isAppInitialized()).toBe(true);
    expect(TemplateMigrationService).toHaveBeenCalledTimes(1);
    expect(logInfo).toHaveBeenCalledWith(expect.stringContaining('Starting initialization'));
    expect(logInfo).toHaveBeenCalledWith(expect.stringContaining('448 questions ready'));
    expect(logInfo).toHaveBeenCalledWith(expect.stringContaining('Initialization complete'));
  });

  it('should be idempotent on second call', async () => {
    await initializeApp();
    jest.clearAllMocks();

    const result = await initializeApp();

    expect(result).toBe(true);
    // Should NOT create a new TemplateMigrationService
    expect(TemplateMigrationService).not.toHaveBeenCalled();
  });

  it('should return false but not throw on migration error', async () => {
    (TemplateMigrationService as jest.Mock).mockImplementationOnce(() => ({
      migrate: jest.fn().mockRejectedValue(new Error('DB connection failed')),
    }));

    const result = await initializeApp();

    expect(result).toBe(false);
    expect(isAppInitialized()).toBe(false);
    expect(logError).toHaveBeenCalledWith(
      expect.stringContaining('Initialization failed'),
      expect.any(Error),
    );
  });

  it('should allow re-initialization after resetInitialization', async () => {
    await initializeApp();
    expect(isAppInitialized()).toBe(true);

    resetInitialization();
    expect(isAppInitialized()).toBe(false);

    const result = await initializeApp();
    expect(result).toBe(true);
    expect(isAppInitialized()).toBe(true);
  });
});
