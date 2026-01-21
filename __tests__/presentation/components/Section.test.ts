import { getSectionSpacing } from '../../../src/presentation/components/Section';
import { spacing } from '../../../src/presentation/theme/tokens';

describe('getSectionSpacing', () => {
  it('returns default section spacing', () => {
    expect(getSectionSpacing()).toEqual({ marginBottom: spacing.xxl });
  });
});
