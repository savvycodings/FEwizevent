import { area, curveMonotoneX, line } from 'd3-shape'
import type { RankChartPoint } from './rankChartTypes'

export type PlotPoint = { x: number; y: number; meta: RankChartPoint }

export function buildPlotPoints(
  points: RankChartPoint[],
  xAt: (at: string) => number,
  yAt: (value: number) => number
): PlotPoint[] {
  return points.map((meta) => ({
    x: xAt(meta.at),
    y: yAt(meta.cumulativeXp),
    meta,
  }))
}

/** Evenly space points on the x-axis so each event reads clearly (labels still use real dates). */
export function buildPlotPointsEven(
  points: RankChartPoint[],
  innerLeft: number,
  innerWidth: number,
  yAt: (value: number) => number
): PlotPoint[] {
  if (points.length === 0) return []
  if (points.length === 1) {
    return [
      {
        x: innerLeft + innerWidth / 2,
        y: yAt(points[0].cumulativeXp),
        meta: points[0],
      },
    ]
  }
  return points.map((meta, i) => ({
    x: innerLeft + (i / (points.length - 1)) * innerWidth,
    y: yAt(meta.cumulativeXp),
    meta,
  }))
}

export function formatChartAxisDate(iso: string): string {
  const d = new Date(iso.includes('T') ? iso : `${iso}T12:00:00`)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

export function chartAxisLabel(meta: RankChartPoint): string {
  if (meta.placement === 0 && meta.label === 'Start') return 'Start'
  const date = formatChartAxisDate(meta.at)
  return date || meta.label
}

export function linePathFromPlot(plot: PlotPoint[]): string | null {
  if (plot.length < 2) return null
  const gen = line<PlotPoint>()
    .x((d) => d.x)
    .y((d) => d.y)
    .curve(curveMonotoneX)
  return gen(plot)
}

export function areaPathFromPlot(plot: PlotPoint[], baselineY: number): string | null {
  if (plot.length < 2) return null
  const gen = area<PlotPoint>()
    .x((d) => d.x)
    .y((d) => d.y)
    .y0(() => baselineY)
    .curve(curveMonotoneX)
  return gen(plot)
}

export function nearestPlotIndex(plot: PlotPoint[], touchX: number): number {
  if (plot.length === 0) return -1
  let best = 0
  let bestDist = Math.abs(plot[0].x - touchX)
  for (let i = 1; i < plot.length; i++) {
    const d = Math.abs(plot[i].x - touchX)
    if (d < bestDist) {
      bestDist = d
      best = i
    }
  }
  return best
}
