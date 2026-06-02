import { createContext, useContext, type ReactNode } from 'react'
import type { PlotPoint } from './areaPaths'

export type RankChartLayout = {
  width: number
  height: number
  innerLeft: number
  innerTop: number
  innerWidth: number
  innerHeight: number
  baselineY: number
  primaryPlot: PlotPoint[]
  comparePlot: PlotPoint[] | null
}

type RankChartContextValue = {
  layout: RankChartLayout | null
  hoveredIndex: number | null
  setHoveredIndex: (index: number | null) => void
  primaryColor: string
  compareColor: string
}

const RankChartContext = createContext<RankChartContextValue | null>(null)

export function RankChartProvider({
  children,
  layout,
  hoveredIndex,
  setHoveredIndex,
  primaryColor,
  compareColor,
}: {
  children: ReactNode
  layout: RankChartLayout | null
  hoveredIndex: number | null
  setHoveredIndex: (index: number | null) => void
  primaryColor: string
  compareColor: string
}) {
  return (
    <RankChartContext.Provider
      value={{ layout, hoveredIndex, setHoveredIndex, primaryColor, compareColor }}
    >
      {children}
    </RankChartContext.Provider>
  )
}

/** RN equivalent of web `useChart` / `useChartStable` for custom indicators. */
export function useRankChart() {
  const ctx = useContext(RankChartContext)
  if (!ctx) {
    throw new Error('useRankChart must be used within RankChartProvider')
  }
  return ctx
}

export function useRankChartOptional() {
  return useContext(RankChartContext)
}
