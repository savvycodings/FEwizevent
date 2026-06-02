import { ReactNode, useContext } from 'react'
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native'
import { ThemeContext } from '../../context'
import { HOME_HERO_TOP_COLOR } from '../../constants/homeHero'
import { RADIUS, SPACING, TYPOGRAPHY } from '../../constants/layout'

type ScreenHeroProps = {
  title: string
  subtitle?: string
  /** Custom hero body (e.g. Home avatar row). Replaces title/subtitle when set. */
  children?: ReactNode
  style?: StyleProp<ViewStyle>
}

/**
 * Shared hero band — slop gates 53–54:
 * - Left-aligned title (not centred-everything)
 * - Heavier bottom padding pulls content into the sheet below
 */
export function ScreenHero({ title, subtitle, children, style }: ScreenHeroProps) {
  const { theme } = useContext(ThemeContext)
  const ink = theme.backgroundColor
  const styles = StyleSheet.create({
    band: {
      backgroundColor: theme.tintColor ?? HOME_HERO_TOP_COLOR,
      paddingHorizontal: SPACING.containerPadding,
      paddingTop: SPACING.lg,
      paddingBottom: SPACING['3xl'],
    },
    title: {
      color: ink,
      fontFamily: theme.boldFont,
      fontSize: TYPOGRAPHY.h1,
      lineHeight: TYPOGRAPHY.h1 * 1.12,
    },
    subtitle: {
      marginTop: SPACING.xs,
      color: ink,
      fontFamily: theme.regularFont,
      fontSize: TYPOGRAPHY.bodySmall,
      lineHeight: TYPOGRAPHY.bodySmall * 1.4,
      opacity: 0.85,
    },
  })

  return (
    <View style={[styles.band, style]}>
      {children ?? (
        <>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </>
      )}
    </View>
  )
}
