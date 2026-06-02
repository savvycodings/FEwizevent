import { useMemo, useState } from 'react'
import { View } from 'react-native'
import Svg, { G, Path, Text as SvgText } from 'react-native-svg'
import { arc, pie } from 'd3-shape'
import { cn } from '@/lib/utils'
import { Text } from '@/components/ui/text'
import { CHART_AXIS } from './chartTheme'
import { deckPieColor } from './deckPieColors'

export type DeckPieSlice = {
  label: string
  value: number
  color?: string
}

type DeckPieChartProps = {
  data: DeckPieSlice[]
  size?: number
  /** 0 = solid pie; 0.5–0.7 = donut */
  innerRadiusRatio?: number
  centerLabel?: string
  className?: string
  caption?: string
}

export function DeckPieChart({
  data,
  size = 220,
  innerRadiusRatio = 0.58,
  centerLabel = 'Total',
  className,
  caption,
}: DeckPieChartProps) {
  const [width, setWidth] = useState(0)
  const chartSize = width > 0 ? Math.min(width, size) : size
  const outerR = chartSize / 2 - 8
  const innerR = outerR * innerRadiusRatio

  const slices = useMemo(
    () => data.filter((d) => d.value > 0),
    [data]
  )

  const layout = useMemo(() => {
    if (slices.length === 0) return null
    const pieGen = pie<DeckPieSlice>()
      .value((d) => d.value)
      .sort(null)
      .padAngle(slices.length > 1 ? 0.02 : 0)
    const arcs = pieGen(slices)
    const arcGen = arc<unknown>()
      .innerRadius(innerR)
      .outerRadius(outerR)
      .cornerRadius(3)
    const cx = chartSize / 2
    const cy = chartSize / 2
    return {
      cx,
      cy,
      arcs: arcs.map((a, i) => ({
        path: arcGen(a) ?? '',
        color: slices[i].color ?? deckPieColor(i),
        label: slices[i].label,
        value: slices[i].value,
        percent: 0,
      })),
    }
  }, [slices, chartSize, innerR, outerR])

  const total = useMemo(() => slices.reduce((s, d) => s + d.value, 0), [slices])

  if (layout) {
    for (const a of layout.arcs) {
      a.percent = total > 0 ? Math.round((a.value / total) * 100) : 0
    }
  }

  if (slices.length === 0) {
    return (
      <View className={cn('items-center py-6', className)}>
        <Text variant="muted" className="text-center px-4">
          No deck data yet. Play events with a deck assigned to see your mix.
        </Text>
      </View>
    )
  }

  return (
    <View
      className={cn('w-full items-center', className)}
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
    >
      {caption ? (
        <Text variant="muted" className="mb-2 text-center text-[11px]">
          {caption}
        </Text>
      ) : null}
      <Svg width={chartSize} height={chartSize}>
        <G x={layout!.cx} y={layout!.cy}>
          {layout!.arcs.map((a, i) => (
            <Path key={`${a.label}-${i}`} d={a.path} fill={a.color} />
          ))}
        </G>
        {innerRadiusRatio > 0 ? (
          <>
            <SvgText
              x={chartSize / 2}
              y={chartSize / 2 - 6}
              fontSize={10}
              fill={CHART_AXIS}
              textAnchor="middle"
            >
              {centerLabel}
            </SvgText>
            <SvgText
              x={chartSize / 2}
              y={chartSize / 2 + 12}
              fontSize={16}
              fontWeight="bold"
              fill="#fff"
              textAnchor="middle"
            >
              {total}
            </SvgText>
          </>
        ) : null}
      </Svg>
      <View className="mt-3 w-full flex-row flex-wrap justify-center gap-x-3 gap-y-1.5 px-2">
        {layout!.arcs.map((a) => (
          <View key={a.label} className="flex-row items-center gap-1.5">
            <View
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: a.color }}
            />
            <Text variant="muted" className="text-[10px]">
              {a.label} · {a.percent}%
            </Text>
          </View>
        ))}
      </View>
    </View>
  )
}
