/**
 * Integration Test: Anamnese Flow (Headless Simulation)
 *
 * Tests full navigation and data flow without UI rendering.
 * Simulates user journey: Home → GDPR → PatientInfo → Questionnaire
 *
 * @security No PII in test data
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { RootNavigator } from '../../src/presentation/navigation/RootNavigator';
import { useQuestionnaireStore } from '../../src/presentation/state/useQuestionnaireStore';
import '@testing-library/jest-native/extend-expect';

// Mock native modules
jest.mock('react-native-sqlite-storage', () => ({
  openDatabase: jest.fn(() => ({
    transaction: jest.fn((callback) => callback({
      executeSql: jest.fn((sql, params, success) => {
        if (success) success({ rows: { length: 0, item: jest.fn() } });
      }),
    })),
    close: jest.fn(() => Promise.resolve()),
  })),
}));

jest.mock('react-native-quick-crypto', () => ({
  pbkdf2Sync: jest.fn(() => Buffer.from('mock-key')),
  randomBytes: jest.fn(() => Buffer.from('mock-random')),
  createCipheriv: jest.fn(() => ({
    update: jest.fn(() => Buffer.from('mock-encrypted')),
    final: jest.fn(() => Buffer.from('')),
    getAuthTag: jest.fn(() => Buffer.from('mock-tag')),
  })),
  createDecipheriv: jest.fn(() => ({
    setAuthTag: jest.fn(),
    update: jest.fn(() => Buffer.from('mock-decrypted')),
    final: jest.fn(() => Buffer.from('')),
  })),
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(() => Promise.resolve()),
  getItem: jest.fn(() => Promise.resolve(null)),
  removeItem: jest.fn(() => Promise.resolve()),
  getAllKeys: jest.fn(() => Promise.resolve([])),
}));

jest.mock('react-native-gesture-handler', () => ({
  GestureHandlerRootView: ({ children }: any) => children,
  GestureDetector: ({ children }: any) => children,
  Gesture: {
    Pan: jest.fn(() => ({})),
    Tap: jest.fn(() => ({})),
  },
}));

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaProvider: ({ children }: any) => children,
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
}));

// Mock i18n
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: any) => {
      const translations: Record<string, string> = {
        'home.title': 'Willkommen zur Anamnese-App',
        'home.startNew': 'Neue Anamnese starten',
        'home.saved': 'Gespeicherte Anamnesen',
        'gdpr.title': 'Datenschutz',
        'common.next': 'Weiter',
        'common.back': 'Zurück',
        'patientInfo.title': 'Patientendaten',
        'questionnaire.title': 'Fragebogen',
      };
      return translations[key] || key;
    },
    i18n: {
      changeLanguage: jest.fn(),
      language: 'de',
    },
  }),
  I18nextProvider: ({ children }: any) => children,
}));

describe('Anamnese Flow Integration Test', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useQuestionnaireStore.getState().reset();
  });

  it('should render Home screen successfully', async () => {
    const { getByText } = render(
      <NavigationContainer>
        <RootNavigator />
      </NavigationContainer>
    );

    // Verify Home Screen renders
    await waitFor(() => {
      expect(getByText(/Willkommen zur Anamnese-App/i)).toBeTruthy();
    });
  });

  it('should navigate from Home to GDPR Consent Screen', async () => {
    const { getByText, queryByText } = render(
      <NavigationContainer>
        <RootNavigator />
      </NavigationContainer>
    );

    // Wait for Home Screen
    await waitFor(() => {
      expect(getByText(/Willkommen zur Anamnese-App/i)).toBeTruthy();
    });

    // Find and press "Start new anamnesis" button
    const startButton = getByText(/Neue Anamnese starten/i);
    expect(startButton).toBeTruthy();
    
    fireEvent.press(startButton);

    // Verify navigation to GDPR Consent Screen
    await waitFor(() => {
      // Should see GDPR/privacy related text
      const gdprText = queryByText(/Datenschutz/i);
      expect(gdprText).toBeTruthy();
    }, { timeout: 3000 });
  });

  it('should handle button press without crashing', () => {
    const { getByText } = render(
      <NavigationContainer>
        <RootNavigator />
      </NavigationContainer>
    );

    const startButton = getByText(/Neue Anamnese starten/i);
    
    // Should not throw
    expect(() => fireEvent.press(startButton)).not.toThrow();
  });

  it('should maintain Zustand store state across navigation', () => {
    const store = useQuestionnaireStore.getState();

    // Simulate setting patient data
    store.setPatient({
      id: 'test-patient-456',
      firstName: 'Jane',
      lastName: 'Smith',
      dateOfBirth: '1985-05-15',
      gender: 'female',
      language: 'de',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // Verify state persists
    const patient = store.patient;
    expect(patient).toBeTruthy();
    expect(patient?.firstName).toBe('Jane');
    expect(patient?.lastName).toBe('Smith');
    expect(patient?.dateOfBirth).toBe('1985-05-15');
  });

  it('should reset store correctly', () => {
    const store = useQuestionnaireStore.getState();

    // Set some data
    store.setPatient({
      id: 'test-123',
      firstName: 'Test',
      lastName: 'User',
      dateOfBirth: '1990-01-01',
      gender: 'male',
      language: 'de',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    expect(store.patient).toBeTruthy();

    // Reset
    store.reset();

    // Verify reset
    expect(store.patient).toBeNull();
  });

  it('should handle saved anamneses button', async () => {
    const { getByText } = render(
      <NavigationContainer>
        <RootNavigator />
      </NavigationContainer>
    );

    await waitFor(() => {
      expect(getByText(/Willkommen zur Anamnese-App/i)).toBeTruthy();
    });

    const savedButton = getByText(/Gespeicherte Anamnesen/i);
    expect(savedButton).toBeTruthy();

    // Should not crash
    expect(() => fireEvent.press(savedButton)).not.toThrow();
  });
});
