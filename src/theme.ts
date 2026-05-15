// Design tokens for CHW Companion ("Sahel").
// Palette is intentionally warm and non-Silicon-Valley — terracotta and bone,
// not cobalt and white. Inspired by Sahel earth tones; chosen for AA contrast
// against the bone background and high legibility under direct sunlight.

export const colors = {
  // Brand & primary actions
  terracotta: '#C9532A',
  // Warnings and highlights
  milletOchre: '#E8A33D',
  // Background — warm off-white, easier on the eye than #FFFFFF under sun
  bone: '#F4ECD8',
  // Body text — deep indigo reads as black but warmer
  deepIndigo: '#1B2A4E',
  // Severity colors
  clinicRed: '#B11226',
  okraGreen: '#2E7D5B',
  // Secondary text / captions
  slate: '#6B6F76',
  // Surfaces
  card: '#FBF6E8',
  cardElevated: '#FFFFFF',
  divider: '#E0D6BD',
  // Inverted (for use on terracotta buttons)
  invertedText: '#FBF6E8',
} as const;

export const typography = {
  display: { fontFamily: 'Fraunces-Bold', fontWeight: '700' as const, fontSize: 32, lineHeight: 38 },
  heading: { fontFamily: 'Fraunces-SemiBold', fontWeight: '600' as const, fontSize: 24, lineHeight: 30 },
  bodyLg: { fontFamily: 'Inter-Regular', fontWeight: '400' as const, fontSize: 18, lineHeight: 26 },
  body: { fontFamily: 'Inter-Regular', fontWeight: '400' as const, fontSize: 16, lineHeight: 24 },
  label: { fontFamily: 'Inter-Medium', fontWeight: '500' as const, fontSize: 16, lineHeight: 22 },
  caption: { fontFamily: 'Inter-Regular', fontWeight: '400' as const, fontSize: 13, lineHeight: 18 },
  mono: { fontFamily: 'Menlo', fontWeight: '400' as const, fontSize: 12, lineHeight: 18 },
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

// All touch targets must be ≥72pt tall per accessibility brief (target user has
// dust, gloves, sweat, no fine motor precision).
export const touchTargets = {
  primary: 72,
  secondary: 56,
  minimum: 48,
} as const;

export const radii = {
  sm: 8,
  md: 12,
  lg: 18,
  pill: 999,
} as const;

export const motion = {
  // Default — comfortable easing
  default: { duration: 300, easing: 'ease-out' as const },
  // Critical alerts — snap, no slow fade
  critical: { duration: 150, easing: 'ease-out' as const },
} as const;

export type Severity = 'clear' | 'watch' | 'urgent';

export const severityColors: Record<Severity, { bg: string; fg: string; accent: string }> = {
  clear: { bg: colors.okraGreen, fg: colors.invertedText, accent: colors.okraGreen },
  watch: { bg: colors.milletOchre, fg: colors.deepIndigo, accent: colors.milletOchre },
  urgent: { bg: colors.clinicRed, fg: colors.invertedText, accent: colors.clinicRed },
};
