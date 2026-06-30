import { RANK_ORDER, RANK_MIN_XP, type RankTier } from './rankSystem'

/** Prize entitlement tiers — synced with server rank ladder */
export const ENTITLEMENT_TIER_ORDER = RANK_ORDER
export type EntitlementTier = RankTier

export const ENTITLEMENT_MIN_XP: Record<EntitlementTier, number> = { ...RANK_MIN_XP }

export const RANK_ENTITLEMENT_REWARD: Record<EntitlementTier, string> = {
  Bronze: 'Standard prize pack',
  Silver: 'Standard prize pack',
  Gold: 'Standard prize pack',
  Platinum: 'Standard + upgraded prize pack',
  Diamond: 'Standard + upgraded prize pack',
  Master: 'Upgraded pack + 1 extra booster',
  Champion: 'Upgraded pack + 2 extra boosters (or pack + promo)',
}

export const RANK_BADGE_ASSET = {
  Bronze: require('../../assets/ranked/bronze.png'),
  Silver: require('../../assets/ranked/silver.png'),
  Gold: require('../../assets/ranked/gold.png'),
  Platinum: require('../../assets/ranked/platnuim.png'),
  Diamond: require('../../assets/ranked/diomand.png'),
  Master: require('../../assets/ranked/diomand.png'),
  Champion: require('../../assets/ranked/champion.png'),
} as const

export const RANK_ENTITLEMENT_ENTRY_FEE_NOTE =
  'Rank entitlement — same entry fee for every tier.'

export function entitlementTierForXp(xp: number, thresholds = ENTITLEMENT_MIN_XP): EntitlementTier {
  let tier: EntitlementTier = 'Bronze'
  for (const name of ENTITLEMENT_TIER_ORDER) {
    if (xp >= thresholds[name]) tier = name
  }
  return tier
}

export function formatEntitlementXpThreshold(minXp: number): string {
  if (minXp <= 0) return '0 XP'
  return `${minXp.toLocaleString()} XP`
}

export function entitlementStatusHint(
  status: 'locked' | 'claimable' | 'claimed' | 'redeemed'
): string | null {
  switch (status) {
    case 'locked':
      return 'Rank not reached'
    case 'claimable':
      return 'Prize available to claim'
    case 'claimed':
      return 'Claimed — redeem at prize desk'
    case 'redeemed':
      return 'Redeemed'
    default:
      return null
  }
}
