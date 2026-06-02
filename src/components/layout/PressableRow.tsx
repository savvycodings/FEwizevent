import { ReactNode } from 'react'
import {
  Pressable,
  type PressableProps,
  StyleSheet,
  type StyleProp,
  type ViewStyle,
} from 'react-native'
import { SPACING } from '../../constants/layout'
import { ToolbarRow } from './ToolbarRow'

type PressableRowProps = PressableProps & {
  children: ReactNode
  /** Styles on the outer Pressable. */
  style?: StyleProp<ViewStyle>
  /** Styles on the inner horizontal row. */
  rowStyle?: StyleProp<ViewStyle>
}

/**
 * Pressable whose children are always laid out in a single horizontal row.
 * Use this instead of putting flexDirection on Pressable (unreliable on RN).
 */
export function PressableRow({
  children,
  style,
  rowStyle,
  ...pressableProps
}: PressableRowProps) {
  return (
    <Pressable style={style} {...pressableProps}>
      <ToolbarRow style={rowStyle}>{children}</ToolbarRow>
    </Pressable>
  )
}

/** Text column in a ToolbarRow / PressableRow — shrinks with ellipsis. */
export const rowGrow = StyleSheet.create({
  slot: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 0,
    minWidth: 0,
  },
  text: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 0,
    minWidth: 0,
  },
  end: {
    flexShrink: 0,
    flexGrow: 0,
    marginLeft: SPACING.sm,
  },
})
