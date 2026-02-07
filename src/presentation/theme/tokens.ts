export const colors = {
  // Backgrounds
  background: '#f5f5f5',
  surface: '#ffffff',
  surfaceAlt: '#f9fafb',

  // Text
  text: '#1f2937',
  textPrimary: '#1f2937',
  textSecondary: '#374151',
  textMuted: '#6b7280',
  mutedText: '#4b5563',
  textInverse: '#ffffff',

  // Borders & Dividers
  border: '#e5e7eb',
  borderLight: '#d1d5db',
  divider: '#e5e7eb',

  // Primary palette
  primary: '#2563eb',
  primaryLight: '#dbeafe',
  primaryDark: '#1d4ed8',
  onPrimary: '#ffffff',

  // Semantic surfaces
  infoSurface: '#eff6ff',
  infoBorder: '#93c5fd',
  infoText: '#1e40af',

  successSurface: '#f0fdf4',
  successBorder: '#86efac',
  successText: '#166534',
  success: '#22c55e',

  dangerSurface: '#fee2e2',
  dangerBorder: '#fca5a5',
  dangerText: '#991b1b',
  danger: '#ef4444',
  error: '#ef4444',

  warningSurface: '#fef3c7',
  warningBorder: '#fcd34d',
  warningText: '#92400e',
  warning: '#f59e0b',

  accentSurface: '#f3e8ff',
  accentBorder: '#c084fc',
  accentText: '#6b21a8',

  // Overlay
  overlay: 'rgba(0, 0, 0, 0.5)',
};

/**
 * BITV 2.0 / WCAG 2.1 AA High-Contrast Color Palette
 *
 * All foreground/background combinations meet WCAG AA (≥ 4.5:1 for normal text,
 * ≥ 3:1 for large text and UI components).
 *
 * Design: Black background with white/yellow text for maximum contrast.
 * This palette is applied when ThemeContext.isHighContrast is true.
 */
export const highContrastColors: typeof colors = {
  // Backgrounds – BITV 1.4.3: Pure black for maximum contrast
  background: '#000000',
  surface: '#1a1a1a',
  surfaceAlt: '#0d0d0d',

  // Text – BITV 1.4.3: Pure white on black = 21:1 contrast ratio
  text: '#ffffff',
  textPrimary: '#ffffff',
  textSecondary: '#e0e0e0',
  textMuted: '#b0b0b0', // ~10:1 on #000
  mutedText: '#b0b0b0',
  textInverse: '#000000',

  // Borders – High visibility
  border: '#ffffff',
  borderLight: '#cccccc',
  divider: '#ffffff',

  // Primary – Yellow on black for high visibility (11.5:1)
  primary: '#ffdd00',
  primaryLight: '#332b00',
  primaryDark: '#ffee44',
  onPrimary: '#000000',

  // Semantic – Using saturated colors on dark backgrounds (all ≥ 4.5:1)
  infoSurface: '#001a33',
  infoBorder: '#66b3ff',
  infoText: '#99ccff',

  successSurface: '#003300',
  successBorder: '#33cc33',
  successText: '#66ff66',
  success: '#33cc33',

  dangerSurface: '#330000',
  dangerBorder: '#ff3333',
  dangerText: '#ff6666',
  danger: '#ff3333',
  error: '#ff3333',

  warningSurface: '#332200',
  warningBorder: '#ffaa00',
  warningText: '#ffcc33',
  warning: '#ffaa00',

  accentSurface: '#1a0033',
  accentBorder: '#cc66ff',
  accentText: '#dd99ff',

  // Overlay
  overlay: 'rgba(0, 0, 0, 0.8)',
};

/**
 * Returns the active color palette based on high-contrast mode.
 * BITV 2.0 §3 / WCAG 2.1 AA 1.4.3: Minimum contrast ratio enforcement.
 */
export function getActiveColors(isHighContrast: boolean): typeof colors {
  return isHighContrast ? highContrastColors : colors;
}

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const radius = {
  sm: 6,
  md: 8,
  lg: 12,
  xl: 20,
};

// Typography scale for consistent text hierarchy
export const typography = {
  h1: { fontSize: 32, lineHeight: 40, fontWeight: '700' as const },
  h2: { fontSize: 28, lineHeight: 36, fontWeight: '700' as const },
  h3: { fontSize: 24, lineHeight: 30, fontWeight: '700' as const },
  title: { fontSize: 24, lineHeight: 30, fontWeight: '700' as const },
  subtitle: { fontSize: 18, lineHeight: 24, fontWeight: '600' as const },
  body: { fontSize: 16, lineHeight: 22 },
  label: { fontSize: 16, lineHeight: 22, fontWeight: '600' as const },
  caption: { fontSize: 12, lineHeight: 16 },
  small: { fontSize: 14, lineHeight: 18 },
};

// Layout constants for consistent spacing
export const layout = {
  screenPadding: 16,
  cardGap: 12,
  sectionGap: 24,
  inputGap: 16,
};

// Focus ring for accessibility
export const focus = {
  color: '#2563eb',
  width: 2,
  offset: 2,
};
