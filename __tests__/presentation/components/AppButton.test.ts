import { getButtonColors } from '../../../src/presentation/components/AppButton';
import { colors } from '../../../src/presentation/theme/tokens';

describe('getButtonColors', () => {
  it('returns primary colors by default', () => {
    expect(getButtonColors('primary')).toEqual({
      backgroundColor: colors.primary,
      borderColor: colors.primary,
      textColor: colors.onPrimary,
    });
  });

  it('returns danger colors for danger variant', () => {
    expect(getButtonColors('danger')).toEqual({
      backgroundColor: colors.dangerSurface,
      borderColor: colors.dangerBorder,
      textColor: colors.dangerText,
    });
  });

  it('returns disabled colors when disabled', () => {
    expect(getButtonColors('primary', true)).toEqual({
      backgroundColor: colors.divider,
      borderColor: colors.divider,
      textColor: colors.mutedText,
    });
  });
});
