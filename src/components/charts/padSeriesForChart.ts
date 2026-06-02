import type { RankChartPoint } from './rankChartTypes'

/** Enough points and XP change to draw a climb area chart (not a flat line). */
export function hasMeaningfulProgression(points: RankChartPoint[]): boolean {
  if (points.length < 3) return false
  const uniqueXp = new Set(points.map((p) => p.cumulativeXp))
  return uniqueXp.size > 1
}

/** Pass through server points — do not synthesize a fake "Now" endpoint. */
export function padSeriesForChart(points: RankChartPoint[]): RankChartPoint[] {
  return points
}

/** Keep compare on the same x-axis as primary after padding (shared "Now" timestamp). */
export function padSeriesPairForChart(
  primary: RankChartPoint[],
  compare?: RankChartPoint[] | null
): { primary: RankChartPoint[]; compare: RankChartPoint[] | null } {
  const displayPrimary = padSeriesForChart(primary)
  if (!compare?.length) {
    return { primary: displayPrimary, compare: null }
  }

  if (compare.length >= 2) {
    return { primary: displayPrimary, compare }
  }

  const last = displayPrimary[displayPrimary.length - 1]
  if (!last) {
    return { primary: displayPrimary, compare }
  }

  return {
    primary: displayPrimary,
    compare: [
      compare[0],
      {
        ...compare[0],
        at: last.at,
        label: last.label,
        placement: 0,
        xpGained: 0,
      },
    ],
  }
}
