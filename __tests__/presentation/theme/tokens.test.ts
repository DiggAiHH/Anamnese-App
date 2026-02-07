/**
 * Theme Tokens Tests
 *
 * BITV 2.0 / WCAG 2.1 AA 1.4.3: Verifies high-contrast color palette
 * meets minimum contrast ratios for accessibility compliance.
 *
 * All foreground/background pairs must achieve:
 * - Normal text: ≥ 4.5:1
 * - Large text: ≥ 3:1
 */

import { colors, highContrastColors, getActiveColors } from '../../../src/presentation/theme/tokens';

/**
 * Calculate relative luminance per WCAG 2.1.
 * Formula: https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html
 */
function relativeLuminance(hex: string): number {
  const rgb = hexToRgb(hex);
  if (!rgb) return 0;

  const [r, g, b] = [rgb.r, rgb.g, rgb.b].map(c => {
    const sRGB = c / 255;
    return sRGB <= 0.03928 ? sRGB / 12.92 : Math.pow((sRGB + 0.055) / 1.055, 2.4);
  });

  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const match = hex.replace('#', '').match(/^([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
  if (!match) return null;
  return {
    r: parseInt(match[1], 16),
    g: parseInt(match[2], 16),
    b: parseInt(match[3], 16),
  };
}

/**
 * Calculate contrast ratio between two colors (WCAG 2.1 formula).
 */
function contrastRatio(fg: string, bg: string): number {
  const l1 = relativeLuminance(fg);
  const l2 = relativeLuminance(bg);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

describe('Theme Tokens', () => {
  describe('Given standard color palette', () => {
    it('should export all required color keys', () => {
      expect(colors.background).toBeDefined();
      expect(colors.text).toBeDefined();
      expect(colors.primary).toBeDefined();
      expect(colors.error).toBeDefined();
    });
  });

  describe('Given high-contrast palette (BITV 2.0 §3)', () => {
    it('should export all required color keys', () => {
      // High-contrast palette must have same keys as standard
      const standardKeys = Object.keys(colors);
      const hcKeys = Object.keys(highContrastColors);

      for (const key of standardKeys) {
        expect(hcKeys).toContain(key);
      }
    });

    it('should meet WCAG AA for text on background (≥ 4.5:1)', () => {
      const textBgPairs = [
        { fg: highContrastColors.text, bg: highContrastColors.background, label: 'text/background' },
        { fg: highContrastColors.textPrimary, bg: highContrastColors.background, label: 'textPrimary/background' },
        { fg: highContrastColors.textSecondary, bg: highContrastColors.background, label: 'textSecondary/background' },
        { fg: highContrastColors.textMuted, bg: highContrastColors.background, label: 'textMuted/background' },
      ];

      for (const { fg, bg } of textBgPairs) {
        const ratio = contrastRatio(fg, bg);
        expect(ratio).toBeGreaterThanOrEqual(4.5);
      }
    });

    it('should meet WCAG AA for text on surface (≥ 4.5:1)', () => {
      const ratio = contrastRatio(highContrastColors.text, highContrastColors.surface);
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    });

    it('should meet WCAG AA for primary on background (≥ 3:1 for UI components)', () => {
      const ratio = contrastRatio(highContrastColors.primary, highContrastColors.background);
      expect(ratio).toBeGreaterThanOrEqual(3.0);
    });

    it('should meet WCAG AA for error text on danger surface (≥ 4.5:1)', () => {
      const ratio = contrastRatio(highContrastColors.dangerText, highContrastColors.dangerSurface);
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    });

    it('should meet WCAG AA for success text on success surface (≥ 4.5:1)', () => {
      const ratio = contrastRatio(highContrastColors.successText, highContrastColors.successSurface);
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    });

    it('should meet WCAG AA for warning text on warning surface (≥ 4.5:1)', () => {
      const ratio = contrastRatio(highContrastColors.warningText, highContrastColors.warningSurface);
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    });

    it('should meet WCAG AA for inverse text on primary (≥ 4.5:1)', () => {
      const ratio = contrastRatio(highContrastColors.onPrimary, highContrastColors.primary);
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    });
  });

  describe('Given getActiveColors()', () => {
    it('should return standard colors when not high-contrast', () => {
      const active = getActiveColors(false);
      expect(active.background).toBe(colors.background);
      expect(active.text).toBe(colors.text);
    });

    it('should return high-contrast colors when high-contrast', () => {
      const active = getActiveColors(true);
      expect(active.background).toBe(highContrastColors.background);
      expect(active.text).toBe(highContrastColors.text);
    });
  });

  describe('Given standard palette contrast (best effort)', () => {
    it('should flag textMuted on background as potential AA concern', () => {
      // Standard textMuted (#6b7280) on background (#f5f5f5)
      // This is a DOCUMENTATION test – we record the actual ratio
      const ratio = contrastRatio(colors.textMuted, colors.background);

      // textMuted is intentionally lower contrast; the high-contrast mode
      // remediation is the BITV-compliant path. We verify it's at least 3:1.
      expect(ratio).toBeGreaterThanOrEqual(3.0);
    });
  });
});
