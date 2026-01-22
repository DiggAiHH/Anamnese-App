import { getInputBorderColor } from '../../../src/presentation/components/AppInput';
import { colors } from '../../../src/presentation/theme/tokens';

describe('getInputBorderColor', () => {
  it('returns danger border when error exists', () => {
    expect(getInputBorderColor(true)).toBe(colors.dangerBorder);
  });

  it('returns default border when no error', () => {
    expect(getInputBorderColor(false)).toBe(colors.border);
  });
});
