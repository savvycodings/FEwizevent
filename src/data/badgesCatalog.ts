export type BadgeId =
  | 'placed1st'
  | 'placed2nd'
  | 'placed3rd'
  | 'champion'
  | 'magician'
  | 'sweat'
  | 'scholar'
  | 'quick'
  | 'scientist'
  | 'flawless'

/** Stable order for the catalog screen */
export const BADGE_CATALOG_ORDER: BadgeId[] = [
  'placed1st',
  'placed2nd',
  'placed3rd',
  'champion',
  'flawless',
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
  champion: 'Champion',
  flawless: 'Flawless',
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
  champion: 'Win the event.',
  flawless: 'Win the event without a loss.',
  magician: 'Win a round in a surprising way.',
  quick: 'Win a round very quickly.',
  scholar: 'Show clear improvement from past events.',
  scientist: 'Win with strong strategy.',
  sweat: 'Give full effort in a match.',
}

/** Minimal footer line under the rule (rank XP flavor — illustrative). */
export const BADGE_RANK_XP_NOTE: Record<BadgeId, string> = {
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
