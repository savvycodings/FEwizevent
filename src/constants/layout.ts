export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
  sectionGap: 24,
  sectionTitleBottom: 12,
  cardPadding: 16,
  containerPadding: 16,
  headerPadding: 12,
} as const

/** Matches tab bar height in main.tsx — use for ScrollView bottom inset on tab screens. */
export const TAB_BAR_HEIGHT = 64

export const RADIUS = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 20,
  full: 999,
} as const

export const TYPOGRAPHY = {
  h1: 32,
  h2: 28,
  h3: 22,
  h4: 18,
  body: 16,
  bodySmall: 14,
  caption: 12,
  label: 13,
} as const
