export const JUDGED_AWARD_TYPES = ['best_bling', 'best_rogue'] as const
export type JudgedAwardType = (typeof JUDGED_AWARD_TYPES)[number]

export const JUDGED_AWARD_LABEL: Record<JudgedAwardType, string> = {
  best_bling: 'Best Bling Deck',
  best_rogue: 'Best Rogue Deck',
}

export const JUDGED_AWARD_CRITERIA: Record<JudgedAwardType, string> = {
  best_bling: 'Best-presented deck (full-arts, alt-arts, sleeves, etc.)',
  best_rogue: 'Most creative / original deck not following the meta',
}

export const JUDGED_AWARD_BASE_XP = 50
