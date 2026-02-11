import React from 'react';
import { render } from '@testing-library/react-native';
import { FieldExplanation } from '../../../src/presentation/components/FieldExplanation';

// Mock AppText → plain RN Text to bypass ThemeProvider dependency.
jest.mock('../../../src/presentation/components/AppText', () => {
  const RN = require('react-native');
  const R = require('react');
  return {
    AppText: (props: any) => R.createElement(RN.Text, props),
  };
});

describe('FieldExplanation', () => {
  it('renders hint text', () => {
    const { getByText } = render(
      <FieldExplanation hint="Für Terminbestätigungen." />,
    );
    expect(getByText('Für Terminbestätigungen.')).toBeTruthy();
  });

  it('renders consequence text when provided', () => {
    const { getByText } = render(
      <FieldExplanation
        hint="Für Befundmitteilungen."
        consequence="Ohne E-Mail keine Benachrichtigungen."
      />,
    );
    expect(getByText('Für Befundmitteilungen.')).toBeTruthy();
    expect(getByText('Ohne E-Mail keine Benachrichtigungen.')).toBeTruthy();
  });

  it('does not render consequence when not provided', () => {
    const { queryByText, getByText } = render(
      <FieldExplanation hint="Nur Hinweis." />,
    );
    expect(getByText('Nur Hinweis.')).toBeTruthy();
    expect(queryByText('Ohne')).toBeNull();
  });

  it('uses default testID', () => {
    const { getByTestId } = render(
      <FieldExplanation hint="Test" />,
    );
    expect(getByTestId('field-explanation')).toBeTruthy();
  });

  it('uses custom testID', () => {
    const { getByTestId } = render(
      <FieldExplanation hint="Test" testID="hint-email" />,
    );
    expect(getByTestId('hint-email')).toBeTruthy();
  });

  it('applies info variant by default (accessibilityRole=text)', () => {
    const { getByTestId } = render(
      <FieldExplanation hint="Info text" testID="fe-info" />,
    );
    const container = getByTestId('fe-info');
    expect(container.props.accessibilityRole).toBe('text');
  });

  it('accepts warning variant', () => {
    const { getByTestId, getByText } = render(
      <FieldExplanation hint="Warnung" variant="warning" testID="fe-warn" />,
    );
    expect(getByTestId('fe-warn')).toBeTruthy();
    expect(getByText('Warnung')).toBeTruthy();
  });
});
