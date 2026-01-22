import { getTextVariantStyle } from '../../../src/presentation/components/AppText';

describe('getTextVariantStyle', () => {
  it('returns title style', () => {
    expect(getTextVariantStyle('title')).toMatchObject({ fontSize: 24, fontWeight: '700' });
  });

  it('returns caption style', () => {
    expect(getTextVariantStyle('caption')).toMatchObject({ fontSize: 12 });
  });
});
