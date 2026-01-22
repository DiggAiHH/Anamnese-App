import { getBannerColors } from '../../../src/presentation/components/FeatureBanner';
import { colors } from '../../../src/presentation/theme/tokens';

describe('getBannerColors', () => {
  it('returns warning colors by default', () => {
    expect(getBannerColors('warning')).toEqual({
      backgroundColor: colors.warningSurface,
      borderColor: colors.warningBorder,
      textColor: colors.warningText,
    });
  });

  it('returns info colors for info variant', () => {
    expect(getBannerColors('info')).toEqual({
      backgroundColor: colors.infoSurface,
      borderColor: colors.infoBorder,
      textColor: colors.infoText,
    });
  });
});
