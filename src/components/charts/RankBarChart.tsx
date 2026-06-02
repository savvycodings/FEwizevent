import { useMemo, useState } from 'react'
import { View } from 'react-native'
import Svg, { G, Line, Path, Rect, Text as SvgText } from 'react-native-svg'
import { cn } from '@/lib/utils'
import { Text } from '@/components/ui/text'
import {
  barCornerRadius,
  buildBarGroups,
  buildSoloTotalBar,
  buildTotalsBarPair,
  soloBarPath,
  makeYScale,
  nearestBarGroupIndex,
  nearestTotalsBar,
  yScaleMax,
  yScaleMaxForTotalsBar,
} from './barChartLayout'
import { CHART_AXIS, CHART_GRID, CHART_COMPARE, CHART_PRIMARY } from './chartTheme'

const CHART_SKELETON = 'rgba(255,255,255,0.12)'
import type { CompareXpTotals, RankChartPoint } from './rankChartTypes'

type SoloTotal = {
  xp: number
  rank: string
  name?: string
}

type RankBarChartProps = {
  primary?: RankChartPoint[]
  compare?: RankChartPoint[]
  totals?: CompareXpTotals | null
  soloTotal?: SoloTotal | null
  compareName?: string | null
  primaryColor?: string
  compareColor?: string
  height?: number
  className?: string
}

const MARGIN = { top: 16, right: 8, bottom: 28, left: 40 }
/** Totals / solo bars — bottom margin fits axis baseline + name label. */
const TOTALS_MARGIN = { top: 20, right: 12, bottom: 32, left: 44 }

const GRID_FRACTIONS = [0, 0.25, 0.5, 0.75, 1]

function gridLines(innerTop: number, plotHeight: number) {
  return GRID_FRACTIONS.map((f) => innerTop + plotHeight - f * plotHeight)
}

function barPlotLayout(width: number, height: number, margin = TOTALS_MARGIN) {
  const innerLeft = margin.left
  const innerTop = margin.top
  const innerWidth = width - margin.left - margin.right
  const plotHeight = height - margin.top - margin.bottom
  const baselineY = innerTop + plotHeight
  return { innerLeft, innerTop, innerWidth, plotHeight, baselineY }
}

function YAxisLabels({
  maxY,
  innerTop,
  innerHeight,
  innerLeft,
  includeZero = true,
}: {
  maxY: number
  innerTop: number
  innerHeight: number
  innerLeft: number
  includeZero?: boolean
}) {
  const fractions = includeZero ? [0, 0.25, 0.5, 0.75, 1] : [0.25, 0.5, 0.75, 1]
  const ticks = fractions.map((f) => Math.round(maxY * f))
  return (
    <>
      {ticks.map((v) => {
        const y = innerTop + innerHeight - (v / maxY) * innerHeight
        return (
          <SvgText key={v} x={innerLeft - 8} y={y + 4} fontSize={10} fill={CHART_AXIS} textAnchor="end">
            {v}
          </SvgText>
        )
      })}
    </>
  )
}

function TotalsBarChart({
  totals,
  compareName,
  primaryColor,
  compareColor,
  height,
  className,
}: {
  totals: CompareXpTotals
  compareName?: string | null
  primaryColor: string
  compareColor: string
  height: number
  className?: string
}) {
  const [width, setWidth] = useState(0)
  const [focused, setFocused] = useState<'primary' | 'compare' | null>(null)

  const primaryXp = totals.primary.xp
  const compareXp = totals.compare.xp
  const primaryRank = totals.primary.rank
  const compareRank = totals.compare.rank
  const primaryPending = totals.primaryLoading ?? primaryXp == null
  const youLabel = 'You'
  const themLabel = compareName ?? totals.compare.name

  const maxY = useMemo(() => {
    const vals = primaryPending ? [compareXp] : [primaryXp ?? 0, compareXp]
    return yScaleMaxForTotalsBar(vals)
  }, [primaryPending, primaryXp, compareXp])

  const chart = useMemo(() => {
    if (width < 40) return null

    const { innerLeft, innerTop, innerWidth, plotHeight, baselineY } = barPlotLayout(width, height)
    const yAt = makeYScale(maxY, innerTop, plotHeight)
    const pair = buildTotalsBarPair(
      primaryPending ? null : primaryXp,
      compareXp,
      youLabel,
      themLabel,
      innerLeft,
      innerWidth,
      innerTop,
      plotHeight,
      baselineY,
      maxY,
      yAt
    )

    return {
      innerLeft,
      innerTop,
      innerWidth,
      plotHeight,
      baselineY,
      pair,
      gridYs: gridLines(innerTop, plotHeight),
    }
  }, [width, height, primaryXp, compareXp, maxY, themLabel, primaryPending])

  const pickFocus = (locationX: number) => {
    if (!chart) return
    setFocused(nearestTotalsBar(locationX, chart.pair))
  }

  const active =
    focused === 'primary' && !primaryPending
      ? { side: 'primary' as const, ...chart!.pair.primary, rank: primaryRank ?? '', xp: primaryXp ?? 0 }
      : focused === 'compare'
        ? { side: 'compare' as const, ...chart!.pair.compare, rank: compareRank }
        : null

  return (
    <View className={cn('w-full', className)} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
      <Text variant="muted" className="mb-2 text-center text-[11px]">
        Lifetime total XP
      </Text>
      {width < 40 || !chart ? (
        <View style={{ height }} />
      ) : (
        <View
          style={{ height }}
          onStartShouldSetResponder={() => true}
          onMoveShouldSetResponder={() => true}
          onResponderGrant={(e) => pickFocus(e.nativeEvent.locationX)}
          onResponderMove={(e) => pickFocus(e.nativeEvent.locationX)}
          onResponderRelease={() => {}}
        >
          <Svg width={width} height={height}>
            {chart.gridYs.map((y, i) => (
              <Line
                key={`grid-${i}`}
                x1={chart.innerLeft}
                x2={chart.innerLeft + chart.innerWidth}
                y1={y}
                y2={y}
                stroke={i === 0 ? CHART_AXIS : CHART_GRID}
                strokeWidth={i === 0 ? 1.25 : 1}
                opacity={i === 0 ? 0.45 : 1}
              />
            ))}

            <YAxisLabels
              maxY={maxY}
              innerTop={chart.innerTop}
              innerHeight={chart.plotHeight}
              innerLeft={chart.innerLeft}
              includeZero={false}
            />

            {(['primary', 'compare'] as const).map((side) => {
              const item = chart.pair[side]
              const isPrimarySkeleton = side === 'primary' && chart.pair.primaryPending
              const color = isPrimarySkeleton
                ? CHART_SKELETON
                : side === 'primary'
                  ? primaryColor
                  : compareColor
              const faded = focused != null && focused !== side ? 0.35 : 1
              const rx = barCornerRadius(item.bar.width)

              return (
                <G key={side} opacity={faded}>
                  <Rect
                    x={item.bar.x}
                    y={item.bar.y}
                    width={item.bar.width}
                    height={item.bar.height}
                    fill={color}
                    rx={rx}
                    ry={rx}
                  />
                </G>
              )
            })}
          </Svg>
        </View>
      )}

      <View className="mt-4 flex-row justify-center gap-8 px-2">
        <View className="items-center">
          <Text className="text-xs font-semibold text-foreground">{youLabel}</Text>
          {primaryPending ? (
            <View className="mt-1 h-3 w-20 rounded bg-accent" />
          ) : (
            <Text variant="muted" className="text-[11px]">
              {primaryRank} · {primaryXp} XP
            </Text>
          )}
        </View>
        <View className="items-center">
          <Text className="text-xs font-semibold text-foreground" numberOfLines={1}>
            {themLabel}
          </Text>
          <Text variant="muted" className="text-[11px]">
            {compareRank} · {compareXp} XP
          </Text>
        </View>
      </View>

      {active ? (
        <Text variant="muted" className="mt-2 text-center text-[11px]">
          {active.label} · {active.rank} · {active.xp} XP
        </Text>
      ) : null}
    </View>
  )
}

function SoloTotalBarChart({
  solo,
  primaryColor,
  height,
  className,
}: {
  solo: SoloTotal
  primaryColor: string
  height: number
  className?: string
}) {
  const [width, setWidth] = useState(0)
  const xp = Math.max(0, solo.xp)
  const label = solo.name ?? 'You'
  const maxY = useMemo(() => yScaleMaxForTotalsBar([xp]), [xp])

  const chart = useMemo(() => {
    if (width < 40) return null

    const { innerLeft, innerTop, innerWidth, plotHeight, baselineY } = barPlotLayout(width, height)
    const yAt = makeYScale(maxY, innerTop, plotHeight)
    const soloBar = buildSoloTotalBar(
      xp,
      label,
      innerLeft,
      innerWidth,
      innerTop,
      plotHeight,
      baselineY,
      maxY,
      yAt
    )

    return {
      innerLeft,
      innerTop,
      innerWidth,
      plotHeight,
      baselineY,
      soloBar,
      gridYs: gridLines(innerTop, plotHeight),
    }
  }, [width, height, xp, label, maxY])

  const soloBarD =
    chart &&
    xp > 0 &&
    soloBarPath(
      chart.soloBar.bar.x,
      chart.soloBar.bar.width,
      chart.soloBar.bar.y,
      chart.baselineY,
      barCornerRadius(chart.soloBar.bar.width)
    )

  return (
    <View className={cn('w-full', className)} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
      <Text variant="muted" className="mb-2 text-center text-[11px]">
        Lifetime total XP
      </Text>
      {width < 40 || !chart ? (
        <View style={{ height }} />
      ) : (
        <View style={{ height }}>
          <Svg width={width} height={height}>
            {chart.gridYs.map((y, i) => (
              <Line
                key={`grid-${i}`}
                x1={chart.innerLeft}
                x2={chart.innerLeft + chart.innerWidth}
                y1={y}
                y2={y}
                stroke={i === 0 ? CHART_AXIS : CHART_GRID}
                strokeWidth={i === 0 ? 1.25 : 1}
                opacity={i === 0 ? 0.45 : 1}
              />
            ))}

            <YAxisLabels
              maxY={maxY}
              innerTop={chart.innerTop}
              innerHeight={chart.plotHeight}
              innerLeft={chart.innerLeft}
              includeZero
            />

            {soloBarD ? <Path d={soloBarD} fill={primaryColor} /> : null}

            <SvgText
              x={chart.soloBar.centerX}
              y={Math.max(chart.innerTop + 12, chart.soloBar.bar.y - 6)}
              fontSize={11}
              fill={primaryColor}
              textAnchor="middle"
            >
              {xp} XP
            </SvgText>

            <SvgText
              x={chart.soloBar.centerX}
              y={chart.baselineY + 16}
              fontSize={10}
              fill={CHART_AXIS}
              textAnchor="middle"
            >
              {label}
            </SvgText>
          </Svg>
        </View>
      )}

      <View className="mt-3 items-center px-2">
        <Text variant="muted" className="text-[11px]">
          {solo.rank}
        </Text>
      </View>
    </View>
  )
}

export function RankBarChart({
  primary = [],
  compare = [],
  totals,
  soloTotal,
  compareName,
  primaryColor = CHART_PRIMARY,
  compareColor = CHART_COMPARE,
  height = 260,
  className,
}: RankBarChartProps) {
  if (soloTotal) {
    return (
      <SoloTotalBarChart
        solo={soloTotal}
        primaryColor={primaryColor}
        height={height}
        className={className}
      />
    )
  }

  if (totals) {
    return (
      <TotalsBarChart
        totals={totals}
        compareName={compareName}
        primaryColor={primaryColor}
        compareColor={compareColor}
        height={height}
        className={className}
      />
    )
  }

  const [width, setWidth] = useState(0)
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  const maxY = useMemo(() => {
    const vals = [...primary, ...compare].map((p) => p.cumulativeXp)
    return yScaleMax(vals)
  }, [primary, compare])

  const chart = useMemo(() => {
    if (width < 40 || primary.length < 1 || compare.length < 1) return null

    const innerLeft = MARGIN.left
    const innerTop = MARGIN.top
    const innerWidth = width - MARGIN.left - MARGIN.right
    const innerHeight = height - MARGIN.top - MARGIN.bottom
    const baselineY = innerTop + innerHeight
    const yAt = makeYScale(maxY, innerTop, innerHeight)
    const groups = buildBarGroups(
      primary,
      compare,
      innerLeft,
      innerWidth,
      innerTop,
      innerHeight,
      baselineY,
      maxY,
      yAt
    )

    return {
      innerLeft,
      innerTop,
      innerWidth,
      innerHeight,
      baselineY,
      groups,
      gridYs: [0.25, 0.5, 0.75, 1].map((f) => innerTop + innerHeight - f * innerHeight),
    }
  }, [width, height, primary, compare, maxY])

  const active =
    chart && hoveredIndex != null && chart.groups[hoveredIndex]
      ? chart.groups[hoveredIndex]
      : null

  if (primary.length < 1) {
    return (
      <View className={cn('items-center justify-center py-8', className)}>
        <Text variant="muted" className="text-center">
          Play events with placements to compare rank growth.
        </Text>
      </View>
    )
  }

  const pickIndex = (locationX: number) => {
    if (!chart) return
    setHoveredIndex(
      nearestBarGroupIndex(locationX, chart.innerLeft, chart.innerWidth, chart.groups.length)
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
          onResponderGrant={(e) => pickIndex(e.nativeEvent.locationX)}
          onResponderMove={(e) => pickIndex(e.nativeEvent.locationX)}
          onResponderRelease={() => {}}
        >
          <Svg width={width} height={height}>
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

            {chart.groups.map((g) => {
              const faded = hoveredIndex != null && hoveredIndex !== g.index ? 0.35 : 1
              const rx = barCornerRadius(g.primaryBar.width)

              return (
                <G key={`${g.label}-${g.index}`} opacity={faded}>
                  <Rect
                    x={g.compareBar.x}
                    y={g.compareBar.y}
                    width={g.compareBar.width}
                    height={g.compareBar.height}
                    fill={compareColor}
                    rx={rx}
                    ry={rx}
                  />
                  <Rect
                    x={g.primaryBar.x}
                    y={g.primaryBar.y}
                    width={g.primaryBar.width}
                    height={g.primaryBar.height}
                    fill={primaryColor}
                    rx={rx}
                    ry={rx}
                  />
                </G>
              )
            })}

            {chart.groups.map((g, i) =>
              chart.groups.length <= 4 || [0, Math.floor(chart.groups.length / 2), chart.groups.length - 1].includes(i) ? (
                <SvgText
                  key={`lbl-${g.label}-${i}`}
                  x={g.bandCenterX}
                  y={chart.baselineY + 16}
                  fontSize={9}
                  fill={CHART_AXIS}
                  textAnchor="middle"
                >
                  {g.label}
                </SvgText>
              ) : null
            )}

            {active ? (
              <Line
                x1={active.bandCenterX}
                x2={active.bandCenterX}
                y1={chart.innerTop}
                y2={chart.baselineY}
                stroke={`${primaryColor}55`}
                strokeWidth={1}
              />
            ) : null}
          </Svg>
        </View>
      )}

      {active ? (
        <View className="mt-3 rounded-lg border border-border bg-card px-3 py-2">
          <Text className="text-xs font-semibold text-foreground">
            {active.label} · You · {active.primaryMeta.rank}
          </Text>
          <Text variant="muted" className="text-[11px]">
            {active.primaryXp} XP
            {active.primaryMeta.placement > 0 ? ` · P${active.primaryMeta.placement}` : ''}
          </Text>
          <Text variant="muted" className="mt-1 text-[11px]">
            {compareName ?? 'Compare'} · {active.compareMeta.rank} · {active.compareXp} XP
          </Text>
        </View>
      ) : null}
    </View>
  )
}
