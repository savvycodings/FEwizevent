import { ReactNode } from 'react'
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'

const DEFAULT_STROKE = 2

/**
 * Extra black on top of the accent layer (same geometry).
 * Reads as “black at this opacity over the accent” instead of muddy rgba stops in one gradient.
 */
const BLACK_OVERLAY_PEAK = 0.48
const BLACK_OVERLAY_PEAK_2 = 0.42

const LOCATIONS: [number, number, number, number, number] = [0, 0.32, 0.52, 0.72, 1]

type PremiumRimProps = {
  children: ReactNode
  borderRadius: number
  accentColor: string
  innerBackgroundColor: string
  strokeWidth?: number
  style?: StyleProp<ViewStyle>
}

export function PremiumRim({
  children,
  borderRadius,
  accentColor,
  innerBackgroundColor,
  strokeWidth = DEFAULT_STROKE,
  style,
}: PremiumRimProps) {
  const outerRadius = borderRadius + strokeWidth
  const sweep = { start: { x: 0, y: 0 } as const, end: { x: 1, y: 1 } as const }
  const clipOuter = {
    borderRadius: outerRadius,
    overflow: 'hidden' as const,
  }

  return (
    <View style={[styles.wrap, style, clipOuter]}>
      <View
        pointerEvents="none"
        style={[StyleSheet.absoluteFillObject, clipOuter, styles.gradientClip]}
        collapsable={false}
      >
        <LinearGradient
          colors={[
            accentColor,
            accentColor,
            accentColor,
            accentColor,
            accentColor,
          ]}
          locations={LOCATIONS}
          start={sweep.start}
          end={sweep.end}
          style={[StyleSheet.absoluteFillObject, { borderRadius: outerRadius }]}
        />
        <LinearGradient
          colors={[
            'rgba(0, 0, 0, 0)',
            `rgba(0, 0, 0, ${BLACK_OVERLAY_PEAK})`,
            'rgba(0, 0, 0, 0)',
            `rgba(0, 0, 0, ${BLACK_OVERLAY_PEAK_2})`,
            'rgba(0, 0, 0, 0)',
          ]}
          locations={LOCATIONS}
          start={sweep.start}
          end={sweep.end}
          style={[StyleSheet.absoluteFillObject, { borderRadius: outerRadius }]}
        />
      </View>
      <View
        style={[
          styles.inner,
          {
            zIndex: 1,
            margin: strokeWidth,
            borderRadius,
            backgroundColor: innerBackgroundColor,
          },
        ]}
      >
        {children}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    alignSelf: 'stretch',
  },
  gradientClip: {
    zIndex: 0,
  },
  inner: {
    overflow: 'hidden',
  },
})
