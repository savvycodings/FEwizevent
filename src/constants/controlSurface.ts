import { StyleSheet, type ViewStyle } from 'react-native'
import { RADIUS, SPACING } from './layout'

/** Tailwind classes: black fill + neutral stroke (matches Wizards theme). */
export const controlSurfaceClass = 'rounded-xl border border-border bg-card'
export const controlSurfaceInsetClass = 'min-h-11 px-4 py-3'

/** StyleSheet helper for screens that do not use NativeWind. */
export function controlSurfaceStyle(theme: {
  backgroundColor: string
  borderColor: string
  cardBackground?: string
}): ViewStyle {
  return {
    borderWidth: 1.5,
    borderColor: theme.borderColor,
    borderRadius: RADIUS.lg,
    backgroundColor: theme.cardBackground ?? theme.backgroundColor,
  }
}

export const controlSurfacePadding = {
  paddingHorizontal: SPACING.md,
  paddingVertical: SPACING.md,
} as const
