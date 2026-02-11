/**
 * DataManagementScreen Unit Tests
 * Render tests for the Data Management screen component.
 */

import React from 'react';
import { render } from '@testing-library/react-native';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) => {
      if (typeof opts === 'string') return opts;
      if (opts && typeof opts === 'object' && 'defaultValue' in opts) {
        return (opts as { defaultValue: string }).defaultValue;
      }
      return key;
    },
    i18n: { language: 'de' },
  }),
}));

jest.mock('../../../src/presentation/theme/ThemeContext', () => ({
  useTheme: () => ({}),
}));

jest.mock('../../../src/presentation/state/useQuestionnaireStore', () => ({
  useQuestionnaireStore: () => ({
    encryptionKey: 'test-key',
  }),
}));

jest.mock('../../../src/shared/platformCapabilities', () => ({
  supportsDocumentPicker: false,
  supportsRNFS: false,
  supportsShare: false,
}));

jest.mock('../../../src/application/use-cases/BackupUseCase', () => ({
  BackupUseCase: function BackupUseCase() {
    return { execute: jest.fn() };
  },
}));

jest.mock('../../../src/application/use-cases/RestoreUseCase', () => ({
  RestoreUseCase: function RestoreUseCase() {
    return { execute: jest.fn() };
  },
}));

jest.mock('../../../src/shared/rnfsSafe', () => ({
  requireRNFS: jest.fn(() => ({ readFile: jest.fn() })),
}));

jest.mock('../../../src/shared/userFacingError', () => ({
  reportUserError: jest.fn(),
}));

jest.mock('../../../src/presentation/components/AppText', () => {
  const RN = require('react-native');
  const R = require('react');
  return {
    AppText: (props: Record<string, unknown>) =>
      R.createElement(RN.Text, { ...props, testID: props.testID }, props.children),
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

jest.mock('../../../src/presentation/components/FeatureBanner', () => {
  const RN = require('react-native');
  const R = require('react');
  return {
    FeatureBanner: (props: Record<string, unknown>) =>
      R.createElement(RN.View, { ...props, testID: 'feature-banner' }),
  };
});

import { DataManagementScreen } from '../../../src/presentation/screens/DataManagementScreen';

describe('DataManagementScreen', () => {
  it('should render data management screen container', () => {
    const navigation = {
      navigate: jest.fn(),
    } as any;

    const { getByTestId } = render(
      <DataManagementScreen navigation={navigation} />,
    );

    expect(getByTestId('data-management-screen')).toBeTruthy();
  });
});
