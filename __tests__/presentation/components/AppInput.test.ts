import { getInputBorderColor } from '../../../src/presentation/components/AppInput';
import { colors } from '../../../src/presentation/theme/tokens';

describe('getInputBorderColor', () => {
  it('returns danger border when error exists', () => {
    expect(getInputBorderColor(true, false)).toBe(colors.dangerBorder);
  });

  it('returns primary border when focused', () => {
    expect(getInputBorderColor(false, true)).toBe(colors.primary);
  });

  it('returns default border when no error and not focused', () => {
    expect(getInputBorderColor(false, false)).toBe(colors.border);
  });

  it('prioritizes error over focus', () => {
    expect(getInputBorderColor(true, true)).toBe(colors.dangerBorder);
  });
});
