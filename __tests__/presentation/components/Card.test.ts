import { getCardStyle } from '../../../src/presentation/components/Card';
import { colors, radius, spacing } from '../../../src/presentation/theme/tokens';

describe('getCardStyle', () => {
  it('returns default card styles', () => {
    expect(getCardStyle()).toEqual({
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      padding: spacing.lg,
      borderWidth: 1,
      borderColor: colors.divider,
    });
  });
});
