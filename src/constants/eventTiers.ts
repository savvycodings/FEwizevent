export const EVENT_TIER_ORDER = ['casual', 'challenge', 'cup'] as const

export type EventTier = (typeof EVENT_TIER_ORDER)[number]

export const EVENT_TIER_LABEL: Record<EventTier, string> = {
  casual: 'Casual',
  challenge: 'Challenge',
  cup: 'Cup',
}

export const EVENT_TIER_MULTIPLIER: Record<EventTier, number> = {
  casual: 1.0,
  challenge: 2.0,
  cup: 3.5,
}

export const EVENT_TIER_EXAMPLES: Record<EventTier, string> = {
  casual: 'Regular locals and open play',
  challenge: 'Glendower Thursday, Rosebank Wednesday, Monthly / Wizards Challenge',
  cup: 'Quarterly Cup, Wizards Cup (per store)',
}

export function formatTierMultiplier(tier: EventTier): string {
  const m = EVENT_TIER_MULTIPLIER[tier]
  return `×${m}`
}

export const EVENT_TIER_SEGMENT_OPTIONS = EVENT_TIER_ORDER.map((value) => ({
  value,
  label: EVENT_TIER_LABEL[value],
}))
