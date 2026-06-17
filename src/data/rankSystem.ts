/** Player rank ladder — defaults mirror server main season; live values from /auth/league/active-season */

export const RANK_ORDER = [
  'Bronze',
  'Silver',
  'Gold',
  'Platinum',
  'Diamond',
  'Master',
  'Champion',
] as const

export type RankTier = (typeof RANK_ORDER)[number]

export const RANK_MIN_XP: Record<RankTier, number> = {
  Bronze: 0,
  Silver: 150,
  Gold: 450,
  Platinum: 1000,
  Diamond: 2000,
  Master: 3800,
  Champion: 7000,
}

export const OFF_SEASON_MIN_XP: Record<RankTier, number> = {
  Bronze: 0,
  Silver: 100,
  Gold: 250,
  Platinum: 500,
  Diamond: 900,
  Master: 1400,
  Champion: 2200,
}

export const RANK_BADGE_ASSET: Record<RankTier, number> = {
  Bronze: require('../../assets/ranked/bronze.png'),
  Silver: require('../../assets/ranked/silver.png'),
  Gold: require('../../assets/ranked/gold.png'),
  Platinum: require('../../assets/ranked/platnuim.png'),
  Diamond: require('../../assets/ranked/diomand.png'),
  Master: require('../../assets/ranked/diomand.png'),
  Champion: require('../../assets/ranked/champion.png'),
}

export const PLACEMENT_XP: Record<number, number> = {
  1: 100,
  2: 70,
  3: 50,
  4: 30,
  5: 30,
  6: 25,
  7: 25,
  8: 20,
}

export const DEFAULT_PLACEMENT_XP = 20

export const EVENT_TIER_MULTIPLIER = {
  casual: 1.0,
  challenge: 2.0,
  cup: 3.5,
} as const

export const JUDGED_AWARD_BASE_XP = 50

export function formatRankXpThreshold(minXp: number): string {
  if (minXp <= 0) return '0 XP'
  return `${minXp.toLocaleString()} XP`
}

export function formatRankXpRange(tier: RankTier, thresholds: Record<RankTier, number> = RANK_MIN_XP): string {
  const min = thresholds[tier]
  const idx = RANK_ORDER.indexOf(tier)
  const next = RANK_ORDER[idx + 1]
  if (!next) return `${formatRankXpThreshold(min)}+`
  const max = thresholds[next] - 1
  return `${min.toLocaleString()}–${max.toLocaleString()} XP`
}

export function rankForXp(xp: number, thresholds: Record<RankTier, number> = RANK_MIN_XP): RankTier {
  let tier: RankTier = 'Bronze'
  for (const name of RANK_ORDER) {
    if (xp >= thresholds[name]) tier = name
  }
  return tier
}

export type ActiveSeasonInfo = {
  id: number
  name: string
  seasonType: 'main' | 'off_season'
  rankThresholds: Record<RankTier, number>
  rewardMap: Record<RankTier, string>
}
