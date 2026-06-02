import { useCallback } from 'react'
import type { GestureResponderEvent } from 'react-native'
import { nearestPlotIndex } from './areaPaths'
import type { RankChartLayout } from './rankChartContext'

export function useRankChartTouch(
  layout: RankChartLayout | null,
  setHoveredIndex: (index: number | null) => void
) {
  const pickIndex = useCallback(
    (e: GestureResponderEvent) => {
      if (!layout) return
      const touchX = e.nativeEvent.locationX
      const idx = nearestPlotIndex(layout.primaryPlot, touchX)
      setHoveredIndex(idx)
    },
    [layout, setHoveredIndex]
  )

  const onTouchStart = pickIndex
  const onTouchMove = pickIndex
  const onTouchEnd = useCallback(() => {
    /* keep selection until tap elsewhere — toggle handled in release */
  }, [])

  return { onTouchStart, onTouchMove, onTouchEnd }
}
