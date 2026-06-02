export type RankChartPoint = {
  at: string
  label: string
  cumulativeXp: number
  rank: string
  placement: number
  xpGained: number
}

export type CompareXpSlot = {
  name: string
  xp: number | null
  rank: string | null
}

export type CompareXpTotals = {
  primary: CompareXpSlot
  compare: { name: string; xp: number; rank: string }
  primaryLoading?: boolean
}
