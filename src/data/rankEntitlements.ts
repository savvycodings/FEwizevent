import type { EntitlementTier } from './rankCatalog'

export type EntitlementStatus = 'locked' | 'claimable' | 'claimed' | 'redeemed'

export type RankEntitlementItem = {
  tier: EntitlementTier
  minXp: number
  reward: string
  status: EntitlementStatus
  claimCode: string | null
  redeemedAt: string | null
}

export type RankEntitlementsResponse = {
  currentXp: number
  currentTier: EntitlementTier
  entitlements: RankEntitlementItem[]
}
