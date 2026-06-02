/**
 * Brand colour tokens for screens (slop gate 8 / 58).
 * Prefer `theme.*` from ThemeContext when a semantic token exists.
 */
export const BRAND = {
  /** Text and icons on the blue hero band */
  heroInk: '#0f172a',
  heroMuted: 'rgba(15, 23, 42, 0.65)',
  heroBorder: 'rgba(15, 23, 42, 0.12)',
  heroRing: 'rgba(255, 255, 255, 0.85)',
  /** XP progress fill (tint → deeper tint) */
  progressGradient: ['#8FD3FF', '#4DA8E8'] as const,
  /** QR module colours */
  qrBackground: '#ffffff',
  qrForeground: '#0f172a',
  /** Text on event banners / dark image scrims (gate 46–50) */
  onImageText: '#ffffff',
  onImageTextMuted: 'rgba(255, 255, 255, 0.92)',
  imageScrim: 'rgba(0, 0, 0, 0.38)',
} as const
