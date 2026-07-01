import { useMemo } from 'react'
import type { StyleProp, ViewStyle } from 'react-native'
import { StyleSheet, View } from 'react-native'
import Svg, { Path } from 'react-native-svg'
import type { AnimatedStyle } from 'react-native-reanimated'
import Animated from 'react-native-reanimated'
import type { BadgeId } from '@/data/badgesCatalog'
import { badgeDisplayTitle } from '@/data/badgesCatalog'
import { BRAND } from '@/constants/brandColors'
import {
  ACHIEVEMENT_ICON_FALLBACK,
  ACHIEVEMENT_ICON_PATHS,
  type AchievementIconPath,
} from './achievementIconPaths'
import {
  BADGE_VECTOR_BY_ID,
  BADGE_VECTOR_PATHS,
  type BadgeVectorName,
} from './badgeVectorPaths'

export const DEFAULT_BADGE_ICON_COLOR = BRAND.heroInk

export type BadgeVectorIconProps = {
  badgeId?: string
  vector?: BadgeVectorName
  size?: number
  color?: string
  style?: StyleProp<ViewStyle>
  animatedStyle?: AnimatedStyle<ViewStyle>
  opacity?: number
  accessibilityLabel?: string
}

function resolveVector(
  badgeId?: string,
  vector?: BadgeVectorName
): BadgeVectorName | null {
  if (vector) return vector
  if (badgeId && badgeId in BADGE_VECTOR_BY_ID) {
    return BADGE_VECTOR_BY_ID[badgeId as BadgeId]
  }
  return null
}

function resolveIconPath(badgeId?: string, vector?: BadgeVectorName): AchievementIconPath | null {
  if (badgeId && ACHIEVEMENT_ICON_PATHS[badgeId]) {
    return ACHIEVEMENT_ICON_PATHS[badgeId]
  }
  const name = resolveVector(badgeId, vector)
  if (name) return BADGE_VECTOR_PATHS[name]
  if (badgeId) return ACHIEVEMENT_ICON_FALLBACK
  return null
}

function parseViewBox(viewBox: string) {
  const [x, y, w, h] = viewBox.split(/\s+/).map(Number)
  return { x, y, w, h }
}

/** Extra viewBox margin so edge paths are not clipped. */
const VIEWBOX_PAD = 3

function expandViewBox(viewBox: string, pad = VIEWBOX_PAD): string {
  const { x, y, w, h } = parseViewBox(viewBox)
  return `${x - pad} ${y - pad} ${w + pad * 2} ${h + pad * 2}`
}

/**
 * Renders an @aliimam/vectors Shapes glyph via react-native-svg.
 * Padded viewBox + meet scaling keeps the full path visible in square tiles.
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
  const iconPath = resolveIconPath(badgeId, vector)
  const label =
    accessibilityLabel ??
    (badgeId ? badgeDisplayTitle(badgeId) : undefined) ??
    name ??
    'Badge'

  const containerStyle = useMemo(
    () => [styles.box, { width: size, height: size }, style],
    [size, style]
  )

  if (!iconPath) return null

  const { viewBox, d, fillRule } = iconPath
  const paddedViewBox = expandViewBox(viewBox)

  const svg = (
    <Svg
      width={size}
      height={size}
      viewBox={paddedViewBox}
      preserveAspectRatio="xMidYMid meet"
      accessibilityLabel={label}
    >
      <Path d={d} fill={color} opacity={opacity} fillRule={fillRule} fillOpacity={1} />
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
    overflow: 'visible',
  },
})
