import { useMemo, useState } from 'react'
import { View } from 'react-native'
import Svg, { Circle, G, Line, Path, Text as SvgText } from 'react-native-svg'
import { cn } from '@/lib/utils'
import { Text } from '@/components/ui/text'
import { CHART_AXIS, CHART_GRID, CHART_PRIMARY } from './chartTheme'
import { buildCommunityDeckAxes, buildDeckRadarAxes, type DeckRadarStat } from './deckRadarAxes'
import { radarPolygonPath, radarVertex, shortenDeckLabel } from './deckRadarLayout'

export type { DeckRadarStat }

type DeckRadarChartProps = {
  stats: DeckRadarStat[]
  activeDeckId?: string | null
  color?: string
  size?: number
  className?: string
  /** Community meta on Home — no catalog fill-in, events drive spokes */
  variant?: 'player' | 'community'
}

const LEVELS = 5

export function DeckRadarChart({
  stats,
  activeDeckId,
  color = CHART_PRIMARY,
  size = 280,
  className,
  variant = 'player',
}: DeckRadarChartProps) {
  const [width, setWidth] = useState(0)
  const chartSize = width > 0 ? Math.min(width, size) : size

  const axes = useMemo(() => {
    if (variant === 'community') {
      return buildCommunityDeckAxes(stats)
    }
    return buildDeckRadarAxes(stats, activeDeckId)
  }, [stats, activeDeckId, variant])

  const valueForAxis = (a: DeckRadarStat) =>
    variant === 'community' ? a.events : a.wins

  const maxValue = useMemo(
    () => Math.max(1, ...axes.map((a) => valueForAxis(a))),
    [axes, variant]
  )

  const hasRecordedStats = stats.some((s) => s.events > 0)

  const layout = useMemo(() => {
    if (axes.length < 3) return null
    const margin = 52
    const cx = chartSize / 2
    const cy = chartSize / 2
    const radius = chartSize / 2 - margin
    const values = axes.map((a) => valueForAxis(a))
    const areaPath = radarPolygonPath(values, maxValue, radius, cx, cy)
    const gridLevels = Array.from({ length: LEVELS }, (_, i) => (radius * (i + 1)) / LEVELS)
    return { cx, cy, radius, areaPath, gridLevels, values }
  }, [axes, chartSize, maxValue, variant])

  if (axes.length < 3) {
    return (
      <View className={cn('items-center justify-center py-6', className)}>
        <Text variant="muted" className="text-center px-4">
          {variant === 'community'
            ? stats.filter((s) => s.events > 0).length > 0
              ? 'Community meta needs at least 3 decks with recorded events.'
              : 'Community meta appears once players record events with decks.'
            : 'Choose your deck above to preview your chart.'}
        </Text>
      </View>
    )
  }

  return (
    <View
      className={cn('w-full items-center', className)}
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
    >
      <Text variant="muted" className="mb-2 text-center text-[11px]">
        {variant === 'community'
          ? hasRecordedStats
            ? 'Community deck spread (by events played)'
            : 'Meta share across all recorded events'
          : hasRecordedStats
            ? 'Your match wins by deck (spokes scale to your best deck)'
            : 'Your chart fills in when you record rounds with a deck assigned'}
      </Text>
      <Svg width={chartSize} height={chartSize}>
        {layout ? (
          <>
            {layout.gridLevels.map((r, i) => (
              <Circle
                key={`ring-${i}`}
                cx={layout.cx}
                cy={layout.cy}
                r={r}
                fill="none"
                stroke={CHART_GRID}
                strokeWidth={1}
              />
            ))}

            {axes.map((_, i) => {
              const p = radarVertex(i, axes.length, layout.radius, layout.cx, layout.cy, 1)
              return (
                <Line
                  key={`axis-${i}`}
                  x1={layout.cx}
                  y1={layout.cy}
                  x2={p.x}
                  y2={p.y}
                  stroke={CHART_GRID}
                  strokeWidth={1}
                />
              )
            })}

            {layout.areaPath ? (
              <Path d={layout.areaPath} fill={`${color}44`} stroke={color} strokeWidth={2} />
            ) : null}

            {axes.map((axis, i) => {
              const tip = radarVertex(
                i,
                axes.length,
                layout.radius,
                layout.cx,
                layout.cy,
                valueForAxis(axis) / maxValue
              )
              const labelPt = radarVertex(i, axes.length, layout.radius + 22, layout.cx, layout.cy, 1)
              return (
                <G key={axis.deckId}>
                  <Circle cx={tip.x} cy={tip.y} r={4} fill={color} />
                  <SvgText
                    x={labelPt.x}
                    y={labelPt.y + 4}
                    fontSize={9}
                    fill={CHART_AXIS}
                    textAnchor="middle"
                  >
                    {shortenDeckLabel(axis.label)}
                  </SvgText>
                  {variant === 'player' ? (
                    <SvgText
                      x={labelPt.x}
                      y={labelPt.y + 14}
                      fontSize={8}
                      fill={CHART_AXIS}
                      textAnchor="middle"
                    >
                      {`${axis.wins}W`}
                    </SvgText>
                  ) : null}
                </G>
              )
            })}
          </>
        ) : null}
      </Svg>

      {variant === 'player' ? (
        <View className="mt-2 w-full flex-row flex-wrap justify-center gap-x-3 gap-y-1 px-2">
          {axes.map((a) => (
            <Text key={a.deckId} variant="muted" className="text-[10px]">
              {`${a.label}: ${a.wins} win${a.wins === 1 ? '' : 's'} · ${a.events} event${a.events === 1 ? '' : 's'}`}
            </Text>
          ))}
        </View>
      ) : null}
    </View>
  )
}
