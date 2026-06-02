import { RankAreaChart } from './RankAreaChart'
import { RankBarChart } from './RankBarChart'
import { padSeriesForChart } from './padSeriesForChart'
import type { CompareXpTotals, RankChartPoint } from './rankChartTypes'

export type { RankChartPoint, CompareXpTotals }

type RankGrowthChartProps = {
  primary: RankChartPoint[]
  compare?: RankChartPoint[] | null
  compareTotals?: CompareXpTotals | null
  soloTotal?: { xp: number; rank: string; name?: string } | null
  compareName?: string | null
  primaryColor?: string
  compareColor?: string
  height?: number
  className?: string
}

export function RankGrowthChart({
  primary,
  compare,
  compareTotals,
  soloTotal,
  compareName,
  ...rest
}: RankGrowthChartProps) {
  if (compareTotals) {
    return (
      <RankBarChart
        {...rest}
        totals={compareTotals}
        compareName={compareName}
      />
    )
  }

  if (soloTotal) {
    return <RankBarChart {...rest} soloTotal={soloTotal} />
  }

  const displayPrimary = padSeriesForChart(primary)

  return (
    <RankAreaChart
      {...rest}
      primary={displayPrimary}
      compare={null}
      compareName={compareName}
    />
  )
}
