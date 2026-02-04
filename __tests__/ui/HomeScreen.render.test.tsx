/**
 * UI Rendering Test: HomeScreen Component
 *
 * Tests that HomeScreen renders correctly without crashes.
 * Verifies all main UI elements are present and accessible.
 *
 * @security No PII in test data
 */

import React from 'react';
import { render } from '@testing-library/react-native';
import { HomeScreen } from '../../src/presentation/screens/HomeScreen';
import { NavigationContainer } from '@react-navigation/native';
import '@testing-library/jest-native/extend-expect';

// Mock navigation
const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
  setOptions: jest.fn(),
  addListener: jest.fn(() => jest.fn()),
  removeListener: jest.fn(),
  reset: jest.fn(),
  isFocused: jest.fn(() => true),
  canGoBack: jest.fn(() => false),
  dispatch: jest.fn(),
  getState: jest.fn(() => ({})),
  getParent: jest.fn(),
  getId: jest.fn(),
} as any;

const mockRoute = {
  key: 'Home',
  name: 'Home',
} as any;

// Mock i18n
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'home.title': 'Willkommen zur Anamnese-App',
        'home.subtitle': 'DSGVO-konforme medizinische Anamnese',
        'home.startNew': 'Neue Anamnese starten',
        'home.saved': 'Gespeicherte Anamnesen',
        'home.selectLanguage': 'Sprache auswählen',
        'fastTrack.title': 'Schnellzugang',
        'fastTrack.subtitle': 'Ohne vollständige Anamnese',
        'fastTrack.prescription': 'Rezept bestellen',
        'fastTrack.referral': 'Überweisung anfordern',
      };
      return translations[key] || key;
    },
    i18n: { language: 'de' },
  }),
}));

// Mock Zustand store
jest.mock('../../src/presentation/state/useQuestionnaireStore', () => ({
  useQuestionnaireStore: () => ({
    reset: jest.fn(),
    patient: null,
    setPatient: jest.fn(),
  }),
}));

// Mock native modules
jest.mock('react-native-sqlite-storage', () => ({
  openDatabase: jest.fn(() => ({
    transaction: jest.fn(),
    close: jest.fn(() => Promise.resolve()),
  })),
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(() => Promise.resolve()),
  getItem: jest.fn(() => Promise.resolve(null)),
  removeItem: jest.fn(() => Promise.resolve()),
}));

describe('HomeScreen UI Rendering Tests', () => {
  it('should render without crashing', () => {
    const { getByText } = render(
      <HomeScreen navigation={mockNavigation} route={mockRoute} />
    );

    expect(getByText(/Willkommen zur Anamnese-App/i)).toBeTruthy();
  });

  it('should display main title and subtitle', () => {
    const { getByText } = render(
      <HomeScreen navigation={mockNavigation} route={mockRoute} />
    );

    expect(getByText(/Willkommen zur Anamnese-App/i)).toBeTruthy();
    expect(getByText(/DSGVO-konforme medizinische Anamnese/i)).toBeTruthy();
  });

  it('should display start new anamnesis button', () => {
    const { getByText } = render(
      <HomeScreen navigation={mockNavigation} route={mockRoute} />
    );

    expect(getByText(/Neue Anamnese starten/i)).toBeTruthy();
  });

  it('should display saved anamneses button', () => {
    const { getByText } = render(
      <HomeScreen navigation={mockNavigation} route={mockRoute} />
    );

    expect(getByText(/Gespeicherte Anamnesen/i)).toBeTruthy();
  });

  it('should display language selection button', () => {
    const { getByText } = render(
      <HomeScreen navigation={mockNavigation} route={mockRoute} />
    );

    expect(getByText(/Sprache auswählen/i)).toBeTruthy();
  });

  it('should display fast track section', () => {
    const { getByText } = render(
      <HomeScreen navigation={mockNavigation} route={mockRoute} />
    );

    expect(getByText(/Schnellzugang/i)).toBeTruthy();
    expect(getByText(/Ohne vollständige Anamnese/i)).toBeTruthy();
  });

  it('should display fast track buttons', () => {
    const { getByText } = render(
      <HomeScreen navigation={mockNavigation} route={mockRoute} />
    );

    expect(getByText(/Rezept bestellen/i)).toBeTruthy();
    expect(getByText(/Überweisung anfordern/i)).toBeTruthy();
  });

  it('should match snapshot', () => {
    const { toJSON } = render(
      <HomeScreen navigation={mockNavigation} route={mockRoute} />
    );

    expect(toJSON()).toMatchSnapshot();
  });
});
