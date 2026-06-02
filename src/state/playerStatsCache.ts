export type CachedPlayerStats = {
  xp: number
  rank: string
  name: string
}

const byUserId = new Map<number, CachedPlayerStats>()

export function setCachedPlayerStats(userId: number, stats: CachedPlayerStats) {
  byUserId.set(userId, stats)
}

export function getCachedPlayerStats(userId: number): CachedPlayerStats | null {
  return byUserId.get(userId) ?? null
}
