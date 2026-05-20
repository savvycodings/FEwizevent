import { useContext } from 'react'
import { StyleSheet, View } from 'react-native'
import { ThemeContext } from '../../context'
import { SPACING } from '../../constants/layout'

type DividerProps = {
  /** Vertical space above and below the rule */
  spacing?: keyof typeof SPACING
  /** Extra inset from horizontal edges (container padding often handles this) */
  inset?: number
  /** Lighter rule for footers and secondary separation */
  faint?: boolean
}

export function Divider({ spacing = 'md', inset = 0, faint = false }: DividerProps) {
  const { theme } = useContext(ThemeContext)
  const m = SPACING[spacing]
  const color = theme.dividerColor ?? theme.borderColor
  return (
    <View
      style={[
        styles.wrap,
        {
          marginVertical: m,
          marginHorizontal: inset,
          backgroundColor: color,
          opacity: faint ? 0.45 : 1,
        },
      ]}
    />
  )
}

const styles = StyleSheet.create({
  wrap: {
    height: StyleSheet.hairlineWidth * 2,
    alignSelf: 'stretch',
    borderRadius: StyleSheet.hairlineWidth,
  },
})
