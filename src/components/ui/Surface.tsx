import { ReactNode, useContext } from 'react'
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native'
import { ThemeContext } from '../../context'
import { RADIUS, SPACING } from '../../constants/layout'

type SurfaceVariant = 'default' | 'muted' | 'ghost'

type SurfaceProps = {
  children: ReactNode
  variant?: SurfaceVariant
  style?: StyleProp<ViewStyle>
  padding?: 'default' | 'none' | 'sm' | 'lg'
}

const paddingMap = {
  default: SPACING.cardPadding,
  none: 0,
  sm: SPACING.md,
  lg: SPACING.lg,
} as const

export function Surface({
  children,
  variant = 'default',
  style,
  padding = 'default',
}: SurfaceProps) {
  const { theme } = useContext(ThemeContext)
  const pv = paddingMap[padding]
  const bg =
    variant === 'muted'
      ? theme.surfaceMuted ?? theme.buttonBackground
      : variant === 'ghost'
        ? 'transparent'
        : theme.cardBackground
  const borderW = variant === 'ghost' ? 0 : StyleSheet.hairlineWidth * 2

  return (
    <View
      style={[
        styles.base,
        {
          backgroundColor: bg,
          borderWidth: borderW,
          borderColor: variant === 'ghost' ? 'transparent' : theme.borderColor,
          padding: pv,
        },
        style,
      ]}
    >
      {children}
    </View>
  )
}

const styles = StyleSheet.create({
  base: {
    borderRadius: RADIUS.lg,
  },
})
