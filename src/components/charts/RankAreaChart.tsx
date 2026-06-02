import { useMemo, useState } from 'react'
import { LayoutChangeEvent, View } from 'react-native'
import Svg, {
  ClipPath,
  Defs,
  G,
  Line,
  LinearGradient,
  Path,
  Pattern,
  Rect,
  Stop,
  Text as SvgText,
} from 'react-native-svg'
import { cn } from '@/lib/utils'
import { Text } from '@/components/ui/text'
import {
  areaPathFromPlot,
  buildPlotPoints,
  buildPlotPointsEven,
  chartAxisLabel,
  linePathFromPlot,
  nearestPlotIndex,
} from './areaPaths'
import {
  CHART_AXIS,
  CHART_COMPARE,
  CHART_GRID,
  CHART_PRIMARY,
} from './chartTheme'
import type { RankChartPoint } from './rankChartTypes'

type RankAreaChartProps = {
  primary: RankChartPoint[]
  compare?: RankChartPoint[] | null
  compareName?: string | null
  primaryColor?: string
  compareColor?: string
  height?: number
  className?: string
}

const MARGIN = { top: 16, right: 8, bottom: 28, left: 40 }

function timeExtents(points: RankChartPoint[]) {
  const times = points.map((p) => new Date(p.at).getTime()).filter((t) => !Number.isNaN(t))
  if (times.length === 0) return { min: 0, max: 1 }
  return { min: Math.min(...times), max: Math.max(...times) }
}

function makeXScale(min: number, max: number, innerLeft: number, innerWidth: number) {
  return (at: string) => {
    const t = new Date(at).getTime()
    if (Number.isNaN(t)) return innerLeft
    if (max <= min) return innerLeft + innerWidth / 2
    return innerLeft + ((t - min) / (max - min)) * innerWidth
  }
}

function yScaleFactory(maxY: number, innerTop: number, innerHeight: number) {
  const top = Math.max(maxY * 1.12, 50)
  return (value: number) => innerTop + innerHeight - (value / top) * innerHeight
}

function DiagonalPattern({ id, stroke }: { id: string; stroke: string }) {
  return (
    <Pattern id={id} patternUnits="userSpaceOnUse" width={6} height={6} patternTransform="rotate(45)">
      <Line x1={0} y1={0} x2={0} y2={6} stroke={stroke} strokeWidth={1} />
    </Pattern>
  )
}

function SeriesLayer({
  plot,
  patternId,
  gradientId,
  stroke,
  baselineY,
  clipId,
}: {
  plot: ReturnType<typeof buildPlotPoints>
  patternId: string
  gradientId: string
  stroke: string
  baselineY: number
  clipId: string
}) {
  const areaD = areaPathFromPlot(plot, baselineY)
  const lineD = linePathFromPlot(plot)
  if (!areaD || !lineD) return null

  return (
    <G clipPath={`url(#${clipId})`}>
      <Path d={areaD} fill={`url(#${gradientId})`} opacity={0.9} />
      <Path d={areaD} fill={`url(#${patternId})`} opacity={0.85} />
      <Path d={lineD} fill="none" stroke={stroke} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
    </G>
  )
}

function YAxisLabels({
  maxY,
  innerTop,
  innerHeight,
  innerLeft,
}: {
  maxY: number
  innerTop: number
  innerHeight: number
  innerLeft: number
}) {
  const top = Math.max(maxY * 1.12, 50)
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => Math.round(top * f))
  return (
    <>
      {ticks.map((v) => {
        const y = innerTop + innerHeight - (v / top) * innerHeight
        return (
          <SvgText key={v} x={innerLeft - 6} y={y + 4} fontSize={10} fill={CHART_AXIS} textAnchor="end">
            {v}
          </SvgText>
        )
      })}
    </>
  )
}

function XAxisLabels({
  plot,
  innerTop,
  innerHeight,
}: {
  plot: ReturnType<typeof buildPlotPoints>
  innerTop: number
  innerHeight: number
}) {
  if (plot.length === 0) return null
  const indices =
    plot.length <= 6 ? plot.map((_, i) => i) : [0, Math.floor(plot.length / 2), plot.length - 1]

  return (
    <>
      {indices.map((i) => {
        const p = plot[i]
        return (
          <SvgText
            key={`${p.meta.at}-${i}`}
            x={p.x}
            y={innerTop + innerHeight + 16}
            fontSize={9}
            fill={CHART_AXIS}
            textAnchor="middle"
          >
            {chartAxisLabel(p.meta)}
          </SvgText>
        )
      })}
    </>
  )
}

function AreaGradient({ id, color }: { id: string; color: string }) {
  return (
    <LinearGradient id={id} x1="0" y1="0" x2="0" y2="1">
      <Stop offset="0" stopColor={color} stopOpacity={0.45} />
      <Stop offset="1" stopColor={color} stopOpacity={0.02} />
    </LinearGradient>
  )
}

export function RankAreaChart({
  primary,
  compare,
  compareName,
  primaryColor = CHART_PRIMARY,
  compareColor = CHART_COMPARE,
  height = 240,
  className,
}: RankAreaChartProps) {
  const [width, setWidth] = useState(0)
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  const allPoints = useMemo(() => [...primary, ...(compare ?? [])], [primary, compare])

  const maxY = useMemo(() => {
    const vals = allPoints.map((p) => p.cumulativeXp)
    return Math.max(50, ...vals, 1)
  }, [allPoints])

  const chart = useMemo(() => {
    if (width < 40 || primary.length < 2) return null

    const innerLeft = MARGIN.left
    const innerTop = MARGIN.top
    const innerWidth = width - MARGIN.left - MARGIN.right
    const innerHeight = height - MARGIN.top - MARGIN.bottom
    const baselineY = innerTop + innerHeight
    const yAt = yScaleFactory(maxY, innerTop, innerHeight)

    const primaryPlot = buildPlotPointsEven(primary, innerLeft, innerWidth, yAt)
    const comparePlot =
      compare && compare.length >= 2
        ? (() => {
            const { min, max } = timeExtents(allPoints)
            const xAt = makeXScale(min, max, innerLeft, innerWidth)
            return buildPlotPoints(compare, xAt, yAt)
          })()
        : null

    return {
      innerLeft,
      innerTop,
      innerWidth,
      innerHeight,
      baselineY,
      primaryPlot,
      comparePlot,
      gridYs: [0.25, 0.5, 0.75, 1].map((f) => innerTop + innerHeight - f * innerHeight),
      clipId: 'rank-chart-clip',
      primaryPatternId: 'area-pattern-primary',
      comparePatternId: 'area-pattern-compare',
      primaryGradientId: 'area-gradient-primary',
      compareGradientId: 'area-gradient-compare',
    }
  }, [width, height, primary, compare, allPoints, maxY])

  const activePoint =
    chart && hoveredIndex != null && hoveredIndex >= 0
      ? chart.primaryPlot[hoveredIndex]?.meta
      : null

  const activeComparePoint =
    chart?.comparePlot && hoveredIndex != null && hoveredIndex >= 0
      ? chart.comparePlot[hoveredIndex]?.meta
      : null

  if (primary.length < 2) {
    return (
      <View className={cn('items-center justify-center py-8', className)}>
        <Text variant="muted" className="text-center">
          Attend events and earn XP to see your progress here.
        </Text>
      </View>
    )
  }

  return (
    <View className={cn('w-full', className)} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
      {width < 40 || !chart ? (
        <View style={{ height }} />
      ) : (
        <View
          style={{ height }}
          onStartShouldSetResponder={() => true}
          onMoveShouldSetResponder={() => true}
          onResponderGrant={(e) => {
            const idx = nearestPlotIndex(chart.primaryPlot, e.nativeEvent.locationX)
            setHoveredIndex(idx)
          }}
          onResponderMove={(e) => {
            const idx = nearestPlotIndex(chart.primaryPlot, e.nativeEvent.locationX)
            setHoveredIndex(idx)
          }}
          onResponderRelease={() => {}}
        >
          <Svg width={width} height={height}>
            <Defs>
              <AreaGradient id={chart.primaryGradientId} color={primaryColor} />
              <DiagonalPattern id={chart.primaryPatternId} stroke={primaryColor} />
              {chart.comparePlot ? (
                <>
                  <AreaGradient id={chart.compareGradientId} color={compareColor} />
                  <DiagonalPattern id={chart.comparePatternId} stroke={compareColor} />
                </>
              ) : null}
              <ClipPath id={chart.clipId}>
                <Rect
                  x={chart.innerLeft}
                  y={chart.innerTop}
                  width={chart.innerWidth}
                  height={chart.innerHeight}
                />
              </ClipPath>
            </Defs>

            {chart.gridYs.map((y) => (
              <Line
                key={y}
                x1={chart.innerLeft}
                x2={chart.innerLeft + chart.innerWidth}
                y1={y}
                y2={y}
                stroke={CHART_GRID}
                strokeWidth={1}
              />
            ))}

            <YAxisLabels
              maxY={maxY}
              innerTop={chart.innerTop}
              innerHeight={chart.innerHeight}
              innerLeft={chart.innerLeft}
            />

            {chart.comparePlot ? (
              <SeriesLayer
                plot={chart.comparePlot}
                patternId={chart.comparePatternId}
                gradientId={chart.compareGradientId}
                stroke={compareColor}
                baselineY={chart.baselineY}
                clipId={chart.clipId}
              />
            ) : null}

            <SeriesLayer
              plot={chart.primaryPlot}
              patternId={chart.primaryPatternId}
              gradientId={chart.primaryGradientId}
              stroke={primaryColor}
              baselineY={chart.baselineY}
              clipId={chart.clipId}
            />

            <XAxisLabels plot={chart.primaryPlot} innerTop={chart.innerTop} innerHeight={chart.innerHeight} />

            {hoveredIndex != null && chart.primaryPlot[hoveredIndex] ? (
              <G>
                <Line
                  x1={chart.primaryPlot[hoveredIndex].x}
                  x2={chart.primaryPlot[hoveredIndex].x}
                  y1={chart.innerTop}
                  y2={chart.baselineY}
                  stroke={`${primaryColor}66`}
                  strokeWidth={1}
                />
                <Path
                  d={`M ${chart.primaryPlot[hoveredIndex].x} ${chart.primaryPlot[hoveredIndex].y} m -4,0 a 4,4 0 1,0 8,0 a 4,4 0 1,0 -8,0`}
                  fill={primaryColor}
                />
                {chart.comparePlot && chart.comparePlot[hoveredIndex] ? (
                  <Path
                    d={`M ${chart.comparePlot[hoveredIndex].x} ${chart.comparePlot[hoveredIndex].y} m -3.5,0 a 3.5,3.5 0 1,0 7,0 a 3.5,3.5 0 1,0 -7,0`}
                    fill={compareColor}
                    stroke={compareColor}
                    strokeWidth={1}
                  />
                ) : null}
              </G>
            ) : null}
          </Svg>
        </View>
      )}

      {activePoint ? (
        <View className="mt-3 rounded-lg border border-border bg-card px-3 py-2">
          <Text className="text-xs font-semibold text-foreground">You · {activePoint.rank}</Text>
          <Text variant="muted" className="text-[11px]">
            {chartAxisLabel(activePoint)}
            {activePoint.placement > 0 ? ` · ${activePoint.label}` : ''}
            {activePoint.xpGained > 0 ? ` · +${activePoint.xpGained} XP` : ''}
            {' · '}
            {activePoint.cumulativeXp} XP
          </Text>
          {activeComparePoint ? (
            <Text variant="muted" className="mt-1 text-[11px]">
              {compareName ?? 'Compare'} · {activeComparePoint.rank} ·{' '}
              {activeComparePoint.cumulativeXp} XP
            </Text>
          ) : null}
        </View>
      ) : null}

    </View>
  )
}
