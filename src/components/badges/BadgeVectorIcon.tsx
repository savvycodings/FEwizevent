import { useMemo } from 'react'
import type { StyleProp, ViewStyle } from 'react-native'
import { StyleSheet, View } from 'react-native'
import Svg, { Path } from 'react-native-svg'
import type { AnimatedStyle } from 'react-native-reanimated'
import Animated from 'react-native-reanimated'
import type { BadgeId } from '@/data/badgesCatalog'
import { BADGE_DISPLAY_TITLE } from '@/data/badgesCatalog'
import { BRAND } from '@/constants/brandColors'
import {
  BADGE_VECTOR_BY_ID,
  BADGE_VECTOR_PATHS,
  type BadgeVectorName,
} from './badgeVectorPaths'

export const DEFAULT_BADGE_ICON_COLOR = BRAND.heroInk

export type BadgeVectorIconProps = {
  badgeId?: BadgeId
  vector?: BadgeVectorName
  size?: number
  color?: string
  style?: StyleProp<ViewStyle>
  animatedStyle?: AnimatedStyle<ViewStyle>
  opacity?: number
  accessibilityLabel?: string
}

function resolveVector(
  badgeId?: BadgeId,
  vector?: BadgeVectorName
): BadgeVectorName | null {
  if (vector) return vector
  if (badgeId) return BADGE_VECTOR_BY_ID[badgeId]
  return null
}

/**
 * Renders an @aliimam/vectors Shapes glyph via react-native-svg.
 * Square container + preserveAspectRatio keeps icons visually balanced in tiles.
 */
export function BadgeVectorIcon({
  badgeId,
  vector,
  size = 48,
  color = DEFAULT_BADGE_ICON_COLOR,
  style,
  animatedStyle,
  opacity = 1,
  accessibilityLabel,
}: BadgeVectorIconProps) {
  const name = resolveVector(badgeId, vector)
  const label =
    accessibilityLabel ??
    (badgeId ? BADGE_DISPLAY_TITLE[badgeId] : undefined) ??
    name ??
    'Badge'

  const containerStyle = useMemo(
    () => [styles.box, { minWidth: size, minHeight: size }, style],
    [size, style]
  )

  if (!name) return null

  const { viewBox, d } = BADGE_VECTOR_PATHS[name]

  const svg = (
    <Svg
      width={size}
      height={size}
      viewBox={viewBox}
      preserveAspectRatio="xMidYMid meet"
      accessibilityLabel={label}
    >
      <Path d={d} fill={color} opacity={opacity} />
    </Svg>
  )

  if (animatedStyle) {
    return (
      <Animated.View
        style={[containerStyle, animatedStyle]}
        accessibilityRole="image"
        accessibilityLabel={label}
      >
        {svg}
      </Animated.View>
    )
  }

  return (
    <View style={containerStyle} accessibilityRole="image" accessibilityLabel={label}>
      {svg}
    </View>
  )
}

const styles = StyleSheet.create({
  box: {
    alignItems: 'center',
    justifyContent: 'center',
  },
})
