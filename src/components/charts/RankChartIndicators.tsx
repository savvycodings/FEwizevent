/**
 * Custom tooltip indicators (bklit-style): no default crosshair/dots on the series.
 * Rising horizontal lines per series + vertical guide.
 */
import { View } from 'react-native'
import { ChartMotionView } from './ChartMotionView'
import { CHART_INDICATOR, CHART_INDICATOR_SECONDARY } from './chartTheme'
import { useRankChart } from './rankChartContext'

const LINE_WIDTH = 36
const LINE_HEIGHT = 2
const SPRING_TRANSITION = { type: 'spring' as const, damping: 18, stiffness: 280, mass: 0.8 }

function RisingSeriesLine({
  x,
  topY,
  bottomY,
  visible,
  color,
}: {
  x: number
  topY: number
  bottomY: number
  visible: boolean
  color: string
}) {
  const left = x - LINE_WIDTH / 2

  return (
    <ChartMotionView
      initialAnimate={{ translateY: bottomY, opacity: 0 }}
      animate={{
        translateY: visible ? topY : bottomY,
        opacity: visible ? 1 : 0,
      }}
      transition={SPRING_TRANSITION}
      style={{
        position: 'absolute',
        left,
        top: 0,
        width: LINE_WIDTH,
        height: LINE_HEIGHT,
        backgroundColor: color,
        borderRadius: 1,
      }}
    />
  )
}

function VerticalCrosshair({
  x,
  top,
  bottom,
  visible,
}: {
  x: number
  top: number
  bottom: number
  visible: boolean
}) {
  return (
    <ChartMotionView
      initialAnimate={{ opacity: 0 }}
      animate={{ opacity: visible ? 0.55 : 0 }}
      transition={{ type: 'timing', duration: 180 }}
      style={{
        position: 'absolute',
        left: x,
        top,
        width: 1,
        height: bottom - top,
        backgroundColor: CHART_INDICATOR,
      }}
    />
  )
}

/** Drop-in replacement for web ChartTooltip crosshair + dots when showCrosshair/showDots are false. */
export function RankChartIndicators() {
  const { layout, hoveredIndex, primaryColor, compareColor } = useRankChart()

  if (!layout || hoveredIndex == null || hoveredIndex < 0) {
    return null
  }

  const primaryPoint = layout.primaryPlot[hoveredIndex]
  if (!primaryPoint) return null

  const comparePoint = layout.comparePlot
    ? findNearestComparePoint(layout.comparePlot, primaryPoint.meta.at)
    : null

  const visible = true

  return (
    <View
      pointerEvents="none"
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        width: layout.width,
        height: layout.height,
        zIndex: 50,
      }}
    >
      <VerticalCrosshair
        x={primaryPoint.x}
        top={layout.innerTop}
        bottom={layout.baselineY}
        visible={visible}
      />

      {comparePoint ? (
        <RisingSeriesLine
          x={comparePoint.x}
          topY={comparePoint.y}
          bottomY={layout.baselineY}
          visible={visible}
          color={compareColor}
        />
      ) : null}

      <RisingSeriesLine
        x={primaryPoint.x}
        topY={primaryPoint.y}
        bottomY={layout.baselineY}
        visible={visible}
        color={primaryColor}
      />

      <ChartMotionView
        initialAnimate={{ opacity: 0, scale: 0.6 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={SPRING_TRANSITION}
        style={{
          position: 'absolute',
          left: primaryPoint.x - 4,
          top: primaryPoint.y - 4,
          width: 8,
          height: 8,
          borderRadius: 4,
          borderWidth: 2,
          borderColor: CHART_INDICATOR_SECONDARY,
          backgroundColor: primaryColor,
        }}
      />
      {comparePoint ? (
        <ChartMotionView
          initialAnimate={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={SPRING_TRANSITION}
          style={{
            position: 'absolute',
            left: comparePoint.x - 3,
            top: comparePoint.y - 3,
            width: 6,
            height: 6,
            borderRadius: 3,
            borderWidth: 1.5,
            borderColor: CHART_INDICATOR_SECONDARY,
            backgroundColor: compareColor,
          }}
        />
      ) : null}
    </View>
  )
}

function findNearestComparePoint(
  comparePlot: { x: number; y: number; meta: { at: string } }[],
  at: string
) {
  const target = new Date(at).getTime()
  let best = comparePlot[0]
  let bestDist = Math.abs(new Date(best.meta.at).getTime() - target)
  for (const p of comparePlot) {
    const d = Math.abs(new Date(p.meta.at).getTime() - target)
    if (d < bestDist) {
      bestDist = d
      best = p
    }
  }
  return best
}
