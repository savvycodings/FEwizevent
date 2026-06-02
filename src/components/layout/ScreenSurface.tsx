import { ReactNode, useContext } from 'react'
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native'
import { ThemeContext } from '../../context'
import { RADIUS, SPACING } from '../../constants/layout'

type ScreenSurfaceProps = {
  children: ReactNode
  style?: StyleProp<ViewStyle>
  /** Less overlap for shallow heroes */
  overlap?: 'lg' | 'md'
}

/** White/dark sheet that overlaps the hero band — consistent section rhythm (gate 10). */
export function ScreenSurface({ children, style, overlap = 'lg' }: ScreenSurfaceProps) {
  const { theme } = useContext(ThemeContext)
  const marginTop = overlap === 'lg' ? -SPACING['2xl'] : -SPACING.xl

  const styles = StyleSheet.create({
    sheet: {
      marginTop,
      borderTopLeftRadius: RADIUS.xl,
      borderTopRightRadius: RADIUS.xl,
      backgroundColor: theme.backgroundColor,
      paddingHorizontal: SPACING.containerPadding,
      paddingTop: SPACING.sectionGap,
      paddingBottom: SPACING.sectionGap,
    },
  })

  return <View style={[styles.sheet, style]}>{children}</View>
}
