export type BadgeId =
  | 'placed1st'
  | 'placed2nd'
  | 'placed3rd'
  | 'flawless'
  | 'giant_slayer'
  | 'three_peat'
  | 'iron_trainer'
  | 'grinder_25'
  | 'grinder_50'
  | 'grinder_100'
  | 'marathon'
  | 'type_master'
  | 'rogue_builder'
  | 'format_sweep'
  | 'season_finalist'
  | 'champions_cape'
  | 'cup_champion'
  | 'champion'
  | 'magician'
  | 'sweat'
  | 'scholar'
  | 'quick'
  | 'scientist'

/** Stable order — matches server badge_definitions sort_order. */
export const BADGE_CATALOG_ORDER: BadgeId[] = [
  'placed1st',
  'placed2nd',
  'placed3rd',
  'flawless',
  'giant_slayer',
  'three_peat',
  'iron_trainer',
  'grinder_25',
  'grinder_50',
  'grinder_100',
  'marathon',
  'type_master',
  'rogue_builder',
  'format_sweep',
  'season_finalist',
  'champions_cape',
  'cup_champion',
  'champion',
  'magician',
  'quick',
  'scholar',
  'scientist',
  'sweat',
]

export const BADGE_DISPLAY_TITLE: Record<BadgeId, string> = {
  placed1st: '1st place',
  placed2nd: '2nd place',
  placed3rd: '3rd place',
  flawless: 'Flawless',
  giant_slayer: 'Giant Slayer',
  three_peat: 'Three-Peat',
  iron_trainer: 'Iron Trainer',
  grinder_25: 'Grinder 25',
  grinder_50: 'Grinder 50',
  grinder_100: 'Grinder 100',
  marathon: 'Marathon',
  type_master: 'Type Master',
  rogue_builder: 'Rogue Builder',
  format_sweep: 'Format Sweep',
  season_finalist: 'Season Finalist',
  champions_cape: "Champion's Cape",
  cup_champion: 'Cup Champion',
  champion: 'Champion',
  magician: 'Magician',
  quick: 'Quick',
  scholar: 'Scholar',
  scientist: 'Scientist',
  sweat: 'Sweat',
}

/** One line — how to earn the badge (shown under the name). */
export const BADGE_AWARD_TEXT: Record<BadgeId, string> = {
  placed1st: 'Finish 1st at an event.',
  placed2nd: 'Finish 2nd at an event.',
  placed3rd: 'Finish 3rd at an event.',
  flawless: 'Win the event without a loss.',
  giant_slayer: 'Beat a higher-ranked opponent.',
  three_peat: 'Win three events in a row.',
  iron_trainer: 'Attend events consistently.',
  grinder_25: 'Play 25 league events.',
  grinder_50: 'Play 50 league events.',
  grinder_100: 'Play 100 league events.',
  marathon: 'Complete a full season of play.',
  type_master: 'Win with a mono-type deck.',
  rogue_builder: 'Win with an off-meta deck.',
  format_sweep: 'Top finishes across formats.',
  season_finalist: 'Finish top 3 in season standings.',
  champions_cape: 'Win the overall season championship.',
  cup_champion: 'Win the store Cup championship.',
  champion: 'Win an event.',
  magician: 'Win a round in a surprising way.',
  quick: 'Win a round very quickly.',
  scholar: 'Show clear improvement from past events.',
  scientist: 'Win with strong strategy.',
  sweat: 'Give full effort in a match.',
}

/** Auto-awarded (placements, attendance milestones, season end) — not staff-assignable at events. */
export const AUTO_AWARD_BADGE_IDS = [
  'placed1st',
  'placed2nd',
  'placed3rd',
  'iron_trainer',
  'grinder_25',
  'grinder_50',
  'grinder_100',
  'marathon',
  'season_finalist',
  'champions_cape',
  'cup_champion',
] as const satisfies readonly BadgeId[]

export type AutoAwardBadgeId = (typeof AUTO_AWARD_BADGE_IDS)[number]
export type ManualAwardBadgeId = Exclude<BadgeId, AutoAwardBadgeId>

/** Staff can award these on Manage Events / player check-in. */
export const MANUAL_AWARD_BADGE_ORDER: ManualAwardBadgeId[] = BADGE_CATALOG_ORDER.filter(
  (id): id is ManualAwardBadgeId =>
    !(AUTO_AWARD_BADGE_IDS as readonly string[]).includes(id)
)

export function isBadgeId(id: string): id is BadgeId {
  return (BADGE_CATALOG_ORDER as string[]).includes(id)
}

export function badgeDisplayTitle(id: string, fallback?: string): string {
  if (isBadgeId(id)) return BADGE_DISPLAY_TITLE[id]
  return fallback?.trim() || id
}

export function badgeAwardText(id: string, fallback?: string): string {
  if (isBadgeId(id)) return BADGE_AWARD_TEXT[id]
  return fallback?.trim() || ''
}

/** Minimal footer line under the rule (rank XP flavor — illustrative). */
export const BADGE_RANK_XP_NOTE: Partial<Record<BadgeId, string>> = {
  placed1st: '+80 XP · placement',
  placed2nd: '+55 XP · placement',
  placed3rd: '+40 XP · placement',
  champion: '+45 XP · victory',
  flawless: '+50 XP · victory',
  magician: '+25 XP · performance',
  quick: '+25 XP · performance',
  scholar: '+25 XP · performance',
  scientist: '+25 XP · performance',
  sweat: '+25 XP · performance',
}
