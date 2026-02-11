/**
 * ExportScreen Unit Tests
 * Render tests for the Export screen component.
 */

import React from 'react';
import { render } from '@testing-library/react-native';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) => {
      if (opts && 'defaultValue' in opts) return opts.defaultValue as string;
      if (opts && typeof opts === 'object' && 'id' in opts) return `${key}`;
      return key;
    },
    i18n: { language: 'de' },
  }),
}));

jest.mock('../../../src/presentation/state/useQuestionnaireStore', () => ({
  useQuestionnaireStore: () => ({
    patient: { id: '00000000-0000-4000-8000-000000000001' },
    encryptionKey: 'test-key',
  }),
}));

jest.mock('@shared/platformCapabilities', () => ({
  supportsShare: false,
}));

jest.mock('../../../src/presentation/components/AppText', () => {
  const RN = require('react-native');
  const R = require('react');
  return {
    AppText: (props: Record<string, unknown>) =>
      R.createElement(RN.Text, { ...props, testID: props.testID }),
  };
});

jest.mock('../../../src/presentation/components/AppButton', () => {
  const RN = require('react-native');
  const R = require('react');
  return {
    AppButton: (props: Record<string, unknown>) =>
      R.createElement(
        RN.Pressable,
        { ...props, testID: props.testID, onPress: props.onPress },
        R.createElement(RN.Text, {}, (props.title as string) || ''),
      ),
  };
});

jest.mock('../../../src/presentation/components/Card', () => {
  const RN = require('react-native');
  const R = require('react');
  return {
    Card: (props: Record<string, unknown>) =>
      R.createElement(RN.View, props, props.children),
  };
});

// Avoid importing real persistence/database modules in a render-only test
jest.mock('@application/use-cases/ExportGDTUseCase', () => ({
  ExportGDTUseCase: function ExportGDTUseCase() {
    return { execute: jest.fn() };
  },
}));

jest.mock('@application/use-cases/ExportAnonymizedUseCase', () => ({
  ExportAnonymizedUseCase: function ExportAnonymizedUseCase() {
    return { execute: jest.fn() };
  },
}));

jest.mock('@infrastructure/persistence/SQLitePatientRepository', () => ({
  SQLitePatientRepository: function SQLitePatientRepository() {},
}));

jest.mock('@infrastructure/persistence/SQLiteQuestionnaireRepository', () => ({
  SQLiteQuestionnaireRepository: function SQLiteQuestionnaireRepository() {},
}));

jest.mock('@infrastructure/persistence/SQLiteAnswerRepository', () => ({
  SQLiteAnswerRepository: function SQLiteAnswerRepository() {},
}));

jest.mock('@infrastructure/persistence/SQLiteGDPRConsentRepository', () => ({
  SQLiteGDPRConsentRepository: function SQLiteGDPRConsentRepository() {},
}));

jest.mock('@infrastructure/persistence/SQLiteQuestionUniverseRepository', () => ({
  SQLiteQuestionUniverseRepository: function SQLiteQuestionUniverseRepository() {},
}));

jest.mock('@infrastructure/persistence/DatabaseConnection', () => ({
  database: {},
}));

jest.mock('../../../src/shared/userFacingError', () => ({
  reportUserError: jest.fn(),
}));

import { ExportScreen } from '../../../src/presentation/screens/ExportScreen';

describe('ExportScreen', () => {
  it('should render the export screen', () => {
    const route = { params: { questionnaireId: 'q-1' } } as any;
    const navigation = {
      navigate: jest.fn(),
      popToTop: jest.fn(),
    } as any;

    const { getByTestId } = render(
      <ExportScreen route={route} navigation={navigation} />,
    );

    expect(getByTestId('export-screen')).toBeTruthy();
    expect(getByTestId('input-sender-id')).toBeTruthy();
    expect(getByTestId('input-receiver-id')).toBeTruthy();
    expect(getByTestId('btn-run-export')).toBeTruthy();
  });
});
