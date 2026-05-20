import { ReactNode, useContext } from 'react'
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native'
import { ThemeContext } from '../../context'
import { RADIUS, SPACING } from '../../constants/layout'
import { PremiumRim } from './PremiumRim'
import { Surface } from './Surface'

interface ThemedCardProps {
  children: ReactNode
  style?: StyleProp<ViewStyle>
  /** Accent gradient rim — use sparingly (one focal card per screen). Default is a flat surface. */
  premiumRim?: boolean
}

export function ThemedCard({ children, style, premiumRim = false }: ThemedCardProps) {
  const { theme } = useContext(ThemeContext)
  const styles = getStyles(theme)
  if (premiumRim) {
    return (
      <PremiumRim
        borderRadius={RADIUS.lg}
        accentColor={theme.tintColor}
        innerBackgroundColor={theme.cardBackground}
        style={style}
      >
        <View style={styles.cardInner}>{children}</View>
      </PremiumRim>
    )
  }
  return <Surface style={style}>{children}</Surface>
}

const getStyles = (_theme: any) =>
  StyleSheet.create({
    cardInner: {
      padding: SPACING.cardPadding,
    },
  })
