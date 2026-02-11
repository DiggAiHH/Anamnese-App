/**
 * LabUploadScreen Unit Tests
 * Render tests for the Lab Upload screen component.
 */

import React from 'react';
import { render } from '@testing-library/react-native';

// Mock dependencies
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) => {
      if (opts && 'defaultValue' in opts) return opts.defaultValue as string;
      return key;
    },
    i18n: { language: 'de' },
  }),
}));

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: jest.fn(),
  }),
}));

jest.mock('react-native-safe-area-context', () => {
  const RN = require('react-native');
  const R = require('react');
  return {
    SafeAreaView: (props: Record<string, unknown>) =>
      R.createElement(RN.View, props),
    SafeAreaProvider: (props: Record<string, unknown>) =>
      R.createElement(RN.View, props),
    useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
  };
});

// Mock platform capabilities — default: supportd
let mockSupportsOCR = true;
let mockSupportsDocumentPicker = true;

jest.mock('../../../src/shared/platformCapabilities', () => ({
  get supportsOCR() { return mockSupportsOCR; },
  get supportsDocumentPicker() { return mockSupportsDocumentPicker; },
}));

jest.mock('../../../src/infrastructure/services/TesseractOCRService', () => ({
  TesseractOCRService: jest.fn(),
}));

jest.mock('../../../src/application/use-cases/UploadLabReportUseCase', () => ({
  uploadLabReport: jest.fn(),
}));

jest.mock('../../../src/shared/logger', () => ({
  logDebug: jest.fn(),
  logError: jest.fn(),
  logWarn: jest.fn(),
}));

// Mock AppText/AppButton to bypass ThemeProvider dependency (project convention)
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

import { LabUploadScreen } from '../../../src/presentation/screens/LabUploadScreen';

describe('LabUploadScreen', () => {
  beforeEach(() => {
    // Reset to supported
    mockSupportsOCR = true;
    mockSupportsDocumentPicker = true;
  });

  it('should render the upload screen when platform is supported', () => {
    const { getByTestId } = render(<LabUploadScreen />);
    expect(getByTestId('lab-upload-screen')).toBeTruthy();
  });

  it('should show unsupported message when OCR is not available', () => {
    mockSupportsOCR = false;

    const { getByTestId } = render(<LabUploadScreen />);
    expect(getByTestId('lab-upload-unsupported')).toBeTruthy();
  });

  it('should show unsupported message when DocumentPicker is not available', () => {
    mockSupportsDocumentPicker = false;

    const { getByTestId } = render(<LabUploadScreen />);
    expect(getByTestId('lab-upload-unsupported')).toBeTruthy();
  });

  it('should render the pick button', () => {
    const { getByTestId } = render(<LabUploadScreen />);
    expect(getByTestId('lab-upload-pick-button')).toBeTruthy();
  });

  it('should render description text', () => {
    const { getByText } = render(<LabUploadScreen />);
    expect(
      getByText(/Laden Sie einen Laborbericht hoch/),
    ).toBeTruthy();
  });

  it('should not show processing indicator initially', () => {
    const { queryByTestId } = render(<LabUploadScreen />);
    expect(queryByTestId('lab-upload-processing')).toBeNull();
  });

  it('should not show results initially', () => {
    const { queryByTestId } = render(<LabUploadScreen />);
    expect(queryByTestId('lab-upload-results')).toBeNull();
  });
});
