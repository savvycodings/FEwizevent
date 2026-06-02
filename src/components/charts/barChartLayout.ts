import type { RankChartPoint } from './rankChartTypes'

export type BarGroup = {
  index: number
  label: string
  primaryXp: number
  compareXp: number
  primaryMeta: RankChartPoint
  compareMeta: RankChartPoint
  bandCenterX: number
  primaryBar: { x: number; y: number; width: number; height: number }
  compareBar: { x: number; y: number; width: number; height: number }
}

const BAR_GAP = 0.22
const GROUP_INNER_GAP = 4
const BAR_RADIUS = 5

export function buildBarGroups(
  primary: RankChartPoint[],
  compare: RankChartPoint[],
  innerLeft: number,
  innerWidth: number,
  innerTop: number,
  innerHeight: number,
  baselineY: number,
  maxY: number,
  yAt: (v: number) => number
): BarGroup[] {
  const n = primary.length
  if (n === 0) return []

  const bandWidth = innerWidth / n
  const groupWidth = bandWidth * (1 - BAR_GAP)
  const barWidth = Math.max(6, (groupWidth - GROUP_INNER_GAP) / 2)

  return primary.map((p, index) => {
    const c = compare[index] ?? p
    const bandStart = innerLeft + index * bandWidth + (bandWidth - groupWidth) / 2
    const primaryX = bandStart
    const compareX = bandStart + barWidth + GROUP_INNER_GAP
    const bandCenterX = bandStart + groupWidth / 2

    const primaryH = Math.max(0, baselineY - yAt(p.cumulativeXp))
    const compareH = Math.max(0, baselineY - yAt(c.cumulativeXp))

    return {
      index,
      label: p.label,
      primaryXp: p.cumulativeXp,
      compareXp: c.cumulativeXp,
      primaryMeta: p,
      compareMeta: c,
      bandCenterX,
      primaryBar: {
        x: primaryX,
        y: yAt(p.cumulativeXp),
        width: barWidth,
        height: primaryH,
      },
      compareBar: {
        x: compareX,
        y: yAt(c.cumulativeXp),
        width: barWidth,
        height: compareH,
      },
    }
  })
}

export function nearestBarGroupIndex(
  touchX: number,
  innerLeft: number,
  innerWidth: number,
  count: number
): number {
  if (count <= 0) return -1
  const bandWidth = innerWidth / count
  const idx = Math.floor((touchX - innerLeft) / bandWidth)
  return Math.max(0, Math.min(count - 1, idx))
}

export function barCornerRadius(barWidth: number): number {
  return Math.min(BAR_RADIUS, barWidth / 2)
}

export function yScaleMax(values: number[]): number {
  return Math.max(50, ...values, 1) * 1.12
}

/** Totals bars: tallest value fills at least `minFillRatio` of plot height (default 50%). */
export function yScaleMaxForTotalsBar(values: number[], minFillRatio = 0.5): number {
  const peak = Math.max(0, ...values)
  if (peak <= 0) return 100
  return Math.max(peak / minFillRatio, peak * 1.08)
}

export function makeYScale(maxY: number, innerTop: number, innerHeight: number) {
  return (value: number) => innerTop + innerHeight - (value / maxY) * innerHeight
}

export type TotalsBarPair = {
  primary: {
    label: string
    xp: number
    rank: string
    centerX: number
    bar: { x: number; y: number; width: number; height: number }
  }
  compare: {
    label: string
    xp: number
    rank: string
    centerX: number
    bar: { x: number; y: number; width: number; height: number }
  }
}

const TOTALS_GROUP_WIDTH_RATIO = 0.55
const TOTALS_BAR_GAP = 12

const SKELETON_BAR_HEIGHT_RATIO = 0.38

/** Two wide bars: You vs compare player (lifetime XP). Primary may be skeleton while loading. */
export function buildTotalsBarPair(
  primaryXp: number | null,
  compareXp: number,
  primaryLabel: string,
  compareLabel: string,
  innerLeft: number,
  innerWidth: number,
  innerTop: number,
  innerHeight: number,
  baselineY: number,
  maxY: number,
  yAt: (v: number) => number
): TotalsBarPair & { primaryPending: boolean } {
  const groupWidth = innerWidth * TOTALS_GROUP_WIDTH_RATIO
  const bandStart = innerLeft + (innerWidth - groupWidth) / 2
  const barWidth = Math.max(28, (groupWidth - TOTALS_BAR_GAP) / 2)

  const primaryX = bandStart
  const compareX = bandStart + barWidth + TOTALS_BAR_GAP
  const primaryCenter = primaryX + barWidth / 2
  const compareCenter = compareX + barWidth / 2

  const compareH = Math.max(4, baselineY - yAt(compareXp))
  const primaryPending = primaryXp == null
  const primaryH = primaryPending
    ? Math.max(4, innerHeight * SKELETON_BAR_HEIGHT_RATIO)
    : Math.max(4, baselineY - yAt(primaryXp))

  return {
    primaryPending,
    primary: {
      label: primaryLabel,
      xp: primaryXp ?? 0,
      rank: '',
      centerX: primaryCenter,
      bar: {
        x: primaryX,
        y: primaryPending ? baselineY - primaryH : yAt(primaryXp!),
        width: barWidth,
        height: primaryH,
      },
    },
    compare: {
      label: compareLabel,
      xp: compareXp,
      rank: '',
      centerX: compareCenter,
      bar: {
        x: compareX,
        y: yAt(compareXp),
        width: barWidth,
        height: compareH,
      },
    },
  }
}

export function nearestTotalsBar(
  touchX: number,
  pair: TotalsBarPair
): 'primary' | 'compare' {
  const mid = (pair.primary.centerX + pair.compare.centerX) / 2
  return touchX < mid ? 'primary' : 'compare'
}

export type SoloTotalBar = {
  label: string
  xp: number
  centerX: number
  bar: { x: number; y: number; width: number; height: number }
}

/** Rounded top, flat bottom — sits flush on the baseline. */
export function soloBarPath(
  x: number,
  width: number,
  topY: number,
  bottomY: number,
  radius: number
): string {
  const h = bottomY - topY
  const r = Math.min(radius, width / 2, h / 2)
  if (h <= 0) return ''
  if (r <= 0) {
    return `M ${x} ${bottomY} L ${x} ${topY} L ${x + width} ${topY} L ${x + width} ${bottomY} Z`
  }
  return [
    `M ${x} ${bottomY}`,
    `L ${x} ${topY + r}`,
    `Q ${x} ${topY} ${x + r} ${topY}`,
    `L ${x + width - r} ${topY}`,
    `Q ${x + width} ${topY} ${x + width} ${topY + r}`,
    `L ${x + width} ${bottomY}`,
    'Z',
  ].join(' ')
}

/** One centered bar for lifetime / current total XP (solo profile). */
export function buildSoloTotalBar(
  xp: number,
  label: string,
  innerLeft: number,
  innerWidth: number,
  innerTop: number,
  innerHeight: number,
  baselineY: number,
  maxY: number,
  yAt: (v: number) => number
): SoloTotalBar {
  const barWidth = Math.min(Math.max(48, innerWidth * 0.32), 140)
  const x = innerLeft + (innerWidth - barWidth) / 2
  const topY = yAt(xp)
  const height = Math.max(12, baselineY - topY)

  return {
    label,
    xp,
    centerX: x + barWidth / 2,
    bar: {
      x,
      y: topY,
      width: barWidth,
      height,
    },
  }
}
