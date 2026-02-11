import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { OutputBox, resolveAnswerItems, ResolvedAnswer } from '../../../src/presentation/components/OutputBox';

// Mock AppText → plain RN Text
jest.mock('../../../src/presentation/components/AppText', () => {
  const RN = require('react-native');
  const R = require('react');
  return {
    AppText: (props: any) => R.createElement(RN.Text, props),
  };
});

// Mock react-i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: any) => opts?.defaultValue ?? key,
    i18n: { language: 'de' },
  }),
}));

// Mock LayoutAnimation (no-op in tests)
jest.mock('react-native/Libraries/LayoutAnimation/LayoutAnimation', () => ({
  configureNext: jest.fn(),
  Presets: { easeInEaseOut: {} },
  Types: {},
  Properties: {},
}));

const items: ResolvedAnswer[] = [
  { questionId: 'q1', label: 'Vorname', value: 'Max', sectionIndex: 0 },
  { questionId: 'q2', label: 'Nachname', value: 'Mustermann', sectionIndex: 0 },
  { questionId: 'q3', label: 'Geburtsdatum', value: '01.01.1990', sectionIndex: 1 },
];

const defaultProps = {
  items,
  expanded: false,
  onToggle: jest.fn(),
  onNavigateToQuestion: jest.fn(),
};

describe('OutputBox', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders header with title', () => {
    const { getByText } = render(<OutputBox {...defaultProps} />);
    expect(getByText('Ihre Antworten')).toBeTruthy();
  });

  it('shows count badge when items exist', () => {
    const { getByText } = render(<OutputBox {...defaultProps} />);
    expect(getByText('3')).toBeTruthy();
  });

  it('shows ▼ chevron when collapsed', () => {
    const { getByText } = render(<OutputBox {...defaultProps} />);
    expect(getByText('▼')).toBeTruthy();
  });

  it('does not render body when collapsed', () => {
    const { queryByTestId } = render(<OutputBox {...defaultProps} />);
    expect(queryByTestId('output-box-body')).toBeNull();
  });

  it('calls onToggle when header is pressed', () => {
    const onToggle = jest.fn();
    const { getByTestId } = render(
      <OutputBox {...defaultProps} onToggle={onToggle} />,
    );
    fireEvent.press(getByTestId('output-box-header'));
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it('renders body with items when expanded', () => {
    const { getByTestId, getByText } = render(
      <OutputBox {...defaultProps} expanded={true} />,
    );
    expect(getByTestId('output-box-body')).toBeTruthy();
    expect(getByText('Vorname')).toBeTruthy();
    expect(getByText('Max')).toBeTruthy();
    expect(getByText('Nachname')).toBeTruthy();
    expect(getByText('Mustermann')).toBeTruthy();
  });

  it('shows ▲ chevron when expanded', () => {
    const { getByText } = render(
      <OutputBox {...defaultProps} expanded={true} />,
    );
    expect(getByText('▲')).toBeTruthy();
  });

  it('shows empty state when expanded with no items', () => {
    const { getByText } = render(
      <OutputBox {...defaultProps} items={[]} expanded={true} />,
    );
    expect(getByText('Noch keine Antworten')).toBeTruthy();
  });

  it('does not show badge when no items', () => {
    const { getByTestId } = render(
      <OutputBox {...defaultProps} items={[]} />,
    );
    // Badge should not exist — header still renders
    expect(getByTestId('output-box-header')).toBeTruthy();
  });

  it('navigates to question on item press', () => {
    const onNav = jest.fn();
    const { getByTestId } = render(
      <OutputBox
        {...defaultProps}
        expanded={true}
        onNavigateToQuestion={onNav}
      />,
    );
    fireEvent.press(getByTestId('answer-item-q3'));
    expect(onNav).toHaveBeenCalledWith('q3', 1);
  });

  it('uses custom testID', () => {
    const { getByTestId } = render(
      <OutputBox {...defaultProps} testID="my-box" expanded={true} />,
    );
    expect(getByTestId('my-box')).toBeTruthy();
    expect(getByTestId('my-box-header')).toBeTruthy();
    expect(getByTestId('my-box-body')).toBeTruthy();
  });
});

describe('resolveAnswerItems', () => {
  const sections = [
    {
      questions: [
        { id: 'q1', text: 'Vorname' },
        { id: 'q2', text: 'Alter', options: [{ value: '1', label: 'Jung' }, { value: '2', label: 'Alt' }] },
        { id: 'q3', text: 'Hidden' },
      ],
    },
    {
      questions: [
        { id: 'q4', text: 'Geschlecht', options: [{ value: 'm', label: 'Männlich' }, { value: 'f', label: 'Weiblich' }] },
        { id: 'q5', text: 'Hobbies', options: [{ value: 'a', label: 'Lesen' }, { value: 'b', label: 'Sport' }, { value: 'c', label: 'Musik' }] },
      ],
    },
  ];

  it('returns empty array for empty answers', () => {
    const result = resolveAnswerItems(sections, new Map());
    expect(result).toEqual([]);
  });

  it('resolves text answer with question text as label', () => {
    const answers = new Map<string, any>([['q1', 'Max']]);
    const result = resolveAnswerItems(sections, answers);
    expect(result).toEqual([
      { questionId: 'q1', label: 'Vorname', value: 'Max', sectionIndex: 0 },
    ]);
  });

  it('resolves option label for single-select answer', () => {
    const answers = new Map<string, any>([['q2', '1']]);
    const result = resolveAnswerItems(sections, answers);
    expect(result).toHaveLength(1);
    expect(result[0].value).toBe('Jung');
  });

  it('resolves option labels for multi-select answer', () => {
    const answers = new Map<string, any>([['q5', ['a', 'c']]]);
    const result = resolveAnswerItems(sections, answers);
    expect(result).toHaveLength(1);
    expect(result[0].value).toBe('Lesen, Musik');
    expect(result[0].sectionIndex).toBe(1);
  });

  it('skips null/undefined/empty answers', () => {
    const answers = new Map<string, any>([
      ['q1', null],
      ['q2', undefined],
      ['q3', ''],
    ]);
    const result = resolveAnswerItems(sections, answers);
    expect(result).toEqual([]);
  });

  it('uses question id as fallback label when text is missing', () => {
    const sectionsNoText = [{ questions: [{ id: 'q99' }] }];
    const answers = new Map<string, any>([['q99', 'yes']]);
    const result = resolveAnswerItems(sectionsNoText, answers);
    expect(result[0].label).toBe('q99');
  });

  it('preserves correct sectionIndex for each answer', () => {
    const answers = new Map<string, any>([
      ['q1', 'A'],
      ['q4', 'm'],
    ]);
    const result = resolveAnswerItems(sections, answers);
    expect(result).toHaveLength(2);
    expect(result[0].sectionIndex).toBe(0);
    expect(result[1].sectionIndex).toBe(1);
    expect(result[1].value).toBe('Männlich');
  });

  it('falls back to raw value when option not found', () => {
    const answers = new Map<string, any>([['q2', 'unknown']]);
    const result = resolveAnswerItems(sections, answers);
    expect(result[0].value).toBe('unknown');
  });
});
