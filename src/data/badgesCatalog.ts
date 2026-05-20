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

export const BADGE_AWARD_TEXT: Record<BadgeId, string> = {
  placed1st: 'Finish 1st in a tournament.',
  placed2nd: 'Finish 2nd in a tournament.',
  placed3rd: 'Finish 3rd in a tournament.',
  champion: 'Win an event.',
  flawless: 'Win without a single loss.',
  magician: 'Win a round in an unexpected way.',
  quick: 'Finish a round exceptionally fast.',
  scholar: 'Learn from previous mistakes.',
  scientist: 'Play with smart strategy.',
  sweat: 'Give maximum effort in a match.',
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

export const BADGE_ASSET: Record<BadgeId, number> = {
  placed1st: require('../../assets/badges/placed1st.png'),
  placed2nd: require('../../assets/badges/placed2nd.png'),
  placed3rd: require('../../assets/badges/placed3rd.png'),
  champion: require('../../assets/badges/champion.png'),
  magician: require('../../assets/badges/magician.png'),
  sweat: require('../../assets/badges/sweat.png'),
  scholar: require('../../assets/badges/scholar.png'),
  quick: require('../../assets/badges/quick.png'),
  scientist: require('../../assets/badges/scientist.png'),
  flawless: require('../../assets/badges/flawless.png'),
}
