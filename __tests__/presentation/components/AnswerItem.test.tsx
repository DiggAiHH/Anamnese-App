import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { AnswerItem } from '../../../src/presentation/components/AnswerItem';

// Mock AppText → plain RN Text to bypass ThemeProvider dependency.
jest.mock('../../../src/presentation/components/AppText', () => {
  const RN = require('react-native');
  const R = require('react');
  return {
    AppText: (props: any) => R.createElement(RN.Text, props),
  };
});

const defaultProps = {
  questionId: 'q1',
  label: 'Vorname',
  value: 'Max',
  onPress: jest.fn(),
};

describe('AnswerItem', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders label and value', () => {
    const { getByText } = render(<AnswerItem {...defaultProps} />);
    expect(getByText('Vorname')).toBeTruthy();
    expect(getByText('Max')).toBeTruthy();
  });

  it('calls onPress with questionId when tapped', () => {
    const onPress = jest.fn();
    const { getByTestId } = render(
      <AnswerItem {...defaultProps} onPress={onPress} />,
    );
    fireEvent.press(getByTestId('answer-item-q1'));
    expect(onPress).toHaveBeenCalledWith('q1');
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('uses default testID based on questionId', () => {
    const { getByTestId } = render(<AnswerItem {...defaultProps} />);
    expect(getByTestId('answer-item-q1')).toBeTruthy();
  });

  it('uses custom testID when provided', () => {
    const { getByTestId } = render(
      <AnswerItem {...defaultProps} testID="custom-id" />,
    );
    expect(getByTestId('custom-id')).toBeTruthy();
  });

  it('has accessible button role', () => {
    const { getByRole } = render(<AnswerItem {...defaultProps} />);
    expect(getByRole('button')).toBeTruthy();
  });

  it('has correct accessibilityLabel combining label and value', () => {
    const { getByLabelText } = render(<AnswerItem {...defaultProps} />);
    expect(getByLabelText('Vorname: Max')).toBeTruthy();
  });

  it('truncates long labels with numberOfLines=1', () => {
    const { getByText } = render(
      <AnswerItem
        {...defaultProps}
        label="Ein sehr langer Fragentext der abgeschnitten werden muss"
      />,
    );
    const label = getByText('Ein sehr langer Fragentext der abgeschnitten werden muss');
    expect(label.props.numberOfLines).toBe(1);
  });
});
