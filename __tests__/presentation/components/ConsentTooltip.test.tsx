import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ConsentTooltip } from '../../../src/presentation/components/ConsentTooltip';

// Mock AppText → plain RN Text to bypass ThemeProvider dependency.
// jest.mock hoists above imports, so we must require() inside the factory.
jest.mock('../../../src/presentation/components/AppText', () => {
  const RN = require('react-native');
  const R = require('react');
  return {
    AppText: (props: any) => R.createElement(RN.Text, props),
  };
});

const defaultProps = {
  whyText: 'Wir benötigen Ihre Einwilligung zur Datenverarbeitung.',
  withoutText: 'Ohne Einwilligung kann keine Anamnese durchgeführt werden.',
  testID: 'consent-dp',
};

describe('ConsentTooltip', () => {
  it('renders toggle button with info icon in collapsed state', () => {
    const { getByTestId, getByText } = render(
      <ConsentTooltip {...defaultProps} />,
    );
    expect(getByTestId('consent-dp-toggle')).toBeTruthy();
    expect(getByText('ℹ️')).toBeTruthy();
  });

  it('does not render info box when collapsed', () => {
    const { queryByTestId } = render(
      <ConsentTooltip {...defaultProps} />,
    );
    expect(queryByTestId('consent-dp-box')).toBeNull();
  });

  it('expands to show whyText and withoutText on press', () => {
    const { getByTestId, getByText } = render(
      <ConsentTooltip {...defaultProps} />,
    );

    fireEvent.press(getByTestId('consent-dp-toggle'));

    expect(getByTestId('consent-dp-box')).toBeTruthy();
    expect(getByText(defaultProps.whyText)).toBeTruthy();
    expect(getByText(defaultProps.withoutText)).toBeTruthy();
  });

  it('collapses again on second press', () => {
    const { getByTestId, queryByTestId } = render(
      <ConsentTooltip {...defaultProps} />,
    );

    fireEvent.press(getByTestId('consent-dp-toggle'));
    expect(getByTestId('consent-dp-box')).toBeTruthy();

    fireEvent.press(getByTestId('consent-dp-toggle'));
    expect(queryByTestId('consent-dp-box')).toBeNull();
  });

  it('shows close icon when expanded', () => {
    const { getByTestId, getByText, queryByText } = render(
      <ConsentTooltip {...defaultProps} />,
    );

    expect(getByText('\u2139\uFE0F')).toBeTruthy();

    fireEvent.press(getByTestId('consent-dp-toggle'));
    expect(getByText('\u2715')).toBeTruthy();
    expect(queryByText('\u2139\uFE0F')).toBeNull();
  });

  it('applies custom accessibilityLabel', () => {
    const { getByLabelText } = render(
      <ConsentTooltip
        {...defaultProps}
        accessibilityLabel="Datenschutz Info"
      />,
    );
    expect(getByLabelText('Datenschutz Info')).toBeTruthy();
  });

  it('uses default testID when none provided', () => {
    const { getByTestId } = render(
      <ConsentTooltip whyText="test" withoutText="test" />,
    );
    expect(getByTestId('consent-tooltip-toggle')).toBeTruthy();
  });

  it('uses default accessibilityLabel when none provided', () => {
    const { getByLabelText } = render(
      <ConsentTooltip whyText="test" withoutText="test" />,
    );
    expect(getByLabelText('Mehr Informationen')).toBeTruthy();
  });
});
