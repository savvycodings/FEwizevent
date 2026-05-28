export const PLACEMENT_MAX = 99

/** Placement ranks held by other players at this event (excludes current user). */
export function getTakenPlacements(
  rows: { userId: number; placement?: number | null }[],
  currentUserId: number
): Set<number> {
  const taken = new Set<number>()
  for (const row of rows) {
    if (row.userId === currentUserId) continue
    const p = row.placement
    if (p != null && p >= 1) taken.add(Number(p))
  }
  return taken
}

/** − button: better rank (1st is best). Shifts others on the server when the slot is taken. */
export function nextPlacementDown(current: number | null): number | null {
  if (current == null) return null
  if (current <= 1) return null
  return current - 1
}

/** + button: worse rank (higher number). Shifts others on the server when the slot is taken. */
export function nextPlacementUp(current: number | null): number | null {
  if (current == null) return 1
  if (current >= PLACEMENT_MAX) return null
  return current + 1
}

export function canPlacementDown(current: number | null): boolean {
  return current != null
}

export function canPlacementUp(current: number | null): boolean {
  if (current == null) return true
  return current < PLACEMENT_MAX
}
