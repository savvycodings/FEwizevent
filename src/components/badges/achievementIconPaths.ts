/**
 * Custom icons for league achievements (24×24).
 * Each badge is ONE path — a single outer silhouette so the fill is fully solid.
 */

export type AchievementIconPath = {
  viewBox: string
  d: string
  fillRule?: 'evenodd' | 'nonzero'
}

export const ACHIEVEMENT_ICON_PATHS: Record<string, AchievementIconPath> = {
  giant_slayer: {
    viewBox: '0 0 24 24',
    d: 'M12 2 L13 4.5 L13 13 L15.5 13 L15.5 15 L13 15 L13 19.5 L14.5 19.5 L14.5 21.5 L9.5 21.5 L9.5 19.5 L11 19.5 L11 15 L8.5 15 L8.5 13 L11 13 L11 4.5 Z',
  },
  three_peat: {
    viewBox: '0 0 24 24',
    // Three separate gems, no overlap — one path, three subpaths
    d: 'M6 5 L8.5 11 L6 17 L3.5 11 Z M12 5 L14.5 11 L12 17 L9.5 11 Z M18 5 L20.5 11 L18 17 L15.5 11 Z',
  },
  iron_trainer: {
    viewBox: '0 0 24 24',
    d: 'M2 8 L7 8 L7 11 L17 11 L17 8 L22 8 L22 16 L17 16 L17 13 L7 13 L7 16 L2 16 Z',
  },
  grinder_25: {
    viewBox: '0 0 24 24',
    d: 'M5 9 L12 14 L19 9 L19 12 L12 17 L5 12 Z',
  },
  grinder_50: {
    viewBox: '0 0 24 24',
    d: 'M5 6 L12 10 L19 6 L19 8 L12 12 L5 8 Z M5 14 L12 18 L19 14 L19 16 L12 20 L5 16 Z',
  },
  grinder_100: {
    viewBox: '0 0 24 24',
    d: 'M5 4 L12 8 L19 4 L19 6 L12 10 L5 6 Z M5 10 L12 14 L19 10 L19 12 L12 16 L5 12 Z M5 16 L12 20 L19 16 L19 18 L12 22 L5 18 Z',
  },
  marathon: {
    viewBox: '0 0 24 24',
    d: 'M5 3 L6.5 3 L6.5 4 L17 4 L14.5 7.5 L17 11 L6.5 11 L6.5 21 L5 21 Z',
  },
  type_master: {
    viewBox: '0 0 24 24',
    fillRule: 'evenodd',
    d: 'M12 3 L20 6 L20 11 L18 16 L12 21 L6 16 L4 11 L4 6 Z M12 8 L14 11 L12 14 L10 11 Z',
  },
  rogue_builder: {
    viewBox: '0 0 24 24',
    d: 'M12 3 L16 5 L17 9 L15 13 L14 13 L14 19 L10 19 L10 13 L9 13 L7 9 L8 5 Z',
  },
  // Podium (stepped standings)
  format_sweep: {
    viewBox: '0 0 24 24',
    d: 'M4 20 L4 14 L9 14 L9 8 L15 8 L15 11 L20 11 L20 20 Z',
  },
  // Medal (ribbons + disc)
  season_finalist: {
    viewBox: '0 0 24 24',
    d: 'M8 3 L10.5 3 L11.5 9 L9 9 Z M13.5 3 L16 3 L15 9 L12.5 9 Z M12 9 L15.5 10.5 L17 14 L15.5 17.5 L12 19 L8.5 17.5 L7 14 L8.5 10.5 Z',
  },
  champions_cape: {
    viewBox: '0 0 24 24',
    d: 'M4 8 L8 12 L12 5 L16 12 L20 8 L18 18 L18 21 L6 21 L6 18 Z',
  },
  cup_champion: {
    viewBox: '0 0 24 24',
    d: 'M6 4 L18 4 L18 6 L20.5 6 L20.5 9 L17.5 10.5 L16 13 L13 15 L13 17 L16 17 L16 19.5 L8 19.5 L8 17 L11 17 L11 15 L8 13 L6.5 10.5 L3.5 9 L3.5 6 L6 6 Z',
  },
}

export const ACHIEVEMENT_ICON_FALLBACK: AchievementIconPath = {
  viewBox: '0 0 24 24',
  d: 'M12 2 L14.6 9.2 L22 9.2 L16 13.8 L18.2 21 L12 16.6 L5.8 21 L8 13.8 L2 9.2 L9.4 9.2 Z',
}
