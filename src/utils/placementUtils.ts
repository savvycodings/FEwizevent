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

/** Next rank when pressing + (skips ranks another player already has). */
export function nextPlacementUp(
  current: number | null,
  taken: Set<number>
): number | null {
  const start = current == null ? 1 : current + 1
  for (let p = start; p <= PLACEMENT_MAX; p++) {
    if (!taken.has(p)) return p
  }
  return null
}

/** Next rank when pressing − (skips taken ranks; clears if none below). */
export function nextPlacementDown(
  current: number | null,
  taken: Set<number>
): number | null {
  if (current == null) return null
  for (let p = current - 1; p >= 1; p--) {
    if (!taken.has(p)) return p
  }
  return null
}

export function canPlacementUp(current: number | null, taken: Set<number>): boolean {
  return nextPlacementUp(current, taken) != null
}

export function canPlacementDown(current: number | null, _taken: Set<number>): boolean {
  return current != null
}
