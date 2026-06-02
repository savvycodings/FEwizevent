import type { BadgeId } from '@/data/badgesCatalog'
import type { BadgeVectorName } from './badgeVectorPaths'
import { BADGE_VECTOR_BY_ID, BADGE_VECTOR_ALIGN } from './badgeVectorPaths'

/**
 * Per-badge optical tweaks (viewBox units). Use when a glyph reads off-center
 * under centered labels despite a balanced path bbox.
 */
export const BADGE_ID_ICON_ALIGN: Partial<Record<BadgeId, { x: number; y: number }>> = {}

export function badgeIconAlign(
  badgeId?: BadgeId,
  vector?: BadgeVectorName | null
): { x: number; y: number } {
  if (badgeId && BADGE_ID_ICON_ALIGN[badgeId]) {
    return BADGE_ID_ICON_ALIGN[badgeId]!
  }
  if (vector && BADGE_VECTOR_ALIGN[vector]) {
    return BADGE_VECTOR_ALIGN[vector]
  }
  const name = vector ?? (badgeId ? BADGE_VECTOR_BY_ID[badgeId] : null)
  if (name && BADGE_VECTOR_ALIGN[name]) {
    return BADGE_VECTOR_ALIGN[name]
  }
  return { x: 0, y: 0 }
}
