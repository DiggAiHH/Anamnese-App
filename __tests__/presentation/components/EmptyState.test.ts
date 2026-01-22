import { getEmptyStatePadding } from '../../../src/presentation/components/EmptyState';
import { spacing } from '../../../src/presentation/theme/tokens';

describe('getEmptyStatePadding', () => {
  it('returns default empty state padding', () => {
    expect(getEmptyStatePadding()).toEqual({ padding: spacing.xxl });
  });
});
