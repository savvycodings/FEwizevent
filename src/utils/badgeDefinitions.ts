import {
  BADGE_AWARD_TEXT,
  BADGE_CATALOG_ORDER,
  BADGE_DISPLAY_TITLE,
  badgeAwardText,
  badgeDisplayTitle,
  isBadgeId,
  type BadgeId,
} from '../data/badgesCatalog'

export type BadgeDefinitionRow = {
  id: string
  title: string
  description: string
  xpReward: number
  sortOrder?: number
}

export function defaultBadgeDefinitions(): BadgeDefinitionRow[] {
  return BADGE_CATALOG_ORDER.map((id, index) => ({
    id,
    title: BADGE_DISPLAY_TITLE[id],
    description: BADGE_AWARD_TEXT[id],
    xpReward: 0,
    sortOrder: index + 1,
  }))
}

export function normalizeBadgeDefinitions(list: BadgeDefinitionRow[]): BadgeDefinitionRow[] {
  if (!list.length) return defaultBadgeDefinitions()

  const orderIndex = new Map(BADGE_CATALOG_ORDER.map((id, index) => [id, index]))

  return [...list]
    .map((def) => ({
      id: def.id,
      title: badgeDisplayTitle(def.id, def.title),
      description: badgeAwardText(def.id, def.description),
      xpReward: def.xpReward ?? 0,
      sortOrder: def.sortOrder,
    }))
    .sort((a, b) => {
      const ao = a.sortOrder ?? orderIndex.get(a.id as BadgeId) ?? 999
      const bo = b.sortOrder ?? orderIndex.get(b.id as BadgeId) ?? 999
      if (ao !== bo) return ao - bo
      return a.title.localeCompare(b.title)
    })
}

export function parseActiveSeasonBadges(
  badges: Array<{ id: string; title: string; description?: string; xpReward?: number; sortOrder?: number }> | undefined
): BadgeDefinitionRow[] {
  if (!Array.isArray(badges) || badges.length === 0) {
    return defaultBadgeDefinitions()
  }
  return normalizeBadgeDefinitions(
    badges.map((def) => ({
      id: def.id,
      title: def.title,
      description: def.description ?? (isBadgeId(def.id) ? BADGE_AWARD_TEXT[def.id] : ''),
      xpReward: def.xpReward ?? 0,
      sortOrder: def.sortOrder,
    }))
  )
}
