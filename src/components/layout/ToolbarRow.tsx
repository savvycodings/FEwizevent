import { ReactNode } from 'react'
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native'
import { SPACING } from '../../constants/layout'

type ToolbarRowProps = {
  children: ReactNode
  style?: StyleProp<ViewStyle>
}

/** Flex row with centred icons + text (slop gate 38). */
export function ToolbarRow({ children, style }: ToolbarRowProps) {
  return <View style={[styles.row, style]}>{children}</View>
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'nowrap',
    width: '100%',
    gap: SPACING.sm,
  },
})
