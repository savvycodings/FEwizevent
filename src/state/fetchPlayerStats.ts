import { apiRequest } from '../api'
import {
  getCachedPlayerStats,
  setCachedPlayerStats,
  type CachedPlayerStats,
} from './playerStatsCache'

type RankTier = string

export async function fetchAndCachePlayerStats(
  userId: number,
  name: string,
  options?: { force?: boolean }
): Promise<CachedPlayerStats> {
  if (!options?.force) {
    const cached = getCachedPlayerStats(userId)
    if (cached) return cached
  }

  const res = await apiRequest<{ user: { xp?: number; rank?: RankTier } }>(
    `/admin/users/${userId}/details`
  )
  const stats: CachedPlayerStats = {
    name,
    xp: Math.max(0, Number(res.user?.xp ?? 0)),
    rank: res.user?.rank ?? 'Bronze',
  }
  setCachedPlayerStats(userId, stats)
  return stats
}
