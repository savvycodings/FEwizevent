/** Prize entitlement tiers shown in the ranks & rewards catalog (same entry fee for all). */
export const ENTITLEMENT_TIER_ORDER = [
  'Bronze',
  'Silver',
  'Gold',
  'Platinum',
  'Diamond',
  'Master',
  'Champion',
] as const

export type EntitlementTier = (typeof ENTITLEMENT_TIER_ORDER)[number]

/** Minimum lifetime XP to reach each entitlement tier in the catalog. */
export const ENTITLEMENT_MIN_XP: Record<EntitlementTier, number> = {
  Bronze: 0,
  Silver: 100,
  Gold: 300,
  Platinum: 650,
  Diamond: 1200,
  Master: 1600,
  Champion: 2000,
}

export const RANK_ENTITLEMENT_REWARD: Record<EntitlementTier, string> = {
  Bronze: 'Standard prize pack',
  Silver: 'Standard prize pack',
  Gold: 'Standard prize pack',
  Platinum: 'Standard + upgraded prize pack',
  Diamond: 'Standard + upgraded prize pack',
  Master: 'Upgraded pack + 1 extra booster',
  Champion: 'Upgraded pack + 2 extra boosters (or pack + promo)',
}

export const RANK_ENTITLEMENT_ENTRY_FEE_NOTE =
  'Rank entitlement — same entry fee for every tier.'

export const RANK_BADGE_ASSET: Record<EntitlementTier, number> = {
  Bronze: require('../../assets/ranked/bronze.png'),
  Silver: require('../../assets/ranked/silver.png'),
  Gold: require('../../assets/ranked/gold.png'),
  Platinum: require('../../assets/ranked/platnuim.png'),
  Diamond: require('../../assets/ranked/diomand.png'),
  Master: require('../../assets/ranked/diomand.png'),
  Champion: require('../../assets/ranked/champion.png'),
}

export function entitlementTierForXp(xp: number): EntitlementTier {
  let tier: EntitlementTier = 'Bronze'
  for (const name of ENTITLEMENT_TIER_ORDER) {
    if (xp >= ENTITLEMENT_MIN_XP[name]) tier = name
  }
  return tier
}

export function formatEntitlementXpThreshold(minXp: number): string {
  if (minXp <= 0) return '0 XP'
  return `${minXp.toLocaleString()} XP`
}
