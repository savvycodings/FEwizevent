/** Matches server `PLACEMENT_XP` for places 4–5 (minimum top-5 event). */
export const TOP5_MIN_XP_PER_EVENT = 30

/** Average XP if every top-5 finish were 3rd place (50). */
export const TOP5_TYPICAL_XP_PER_EVENT = 50

export function xpRemainingToRank(currentXp: number, nextRankMinXp: number): number {
  return Math.max(0, nextRankMinXp - currentXp)
}

/** Conservative: assumes 4th/5th-place (30 XP) finishes until next rank. */
export function estimateTop5FinishesToNextRank(xpRemaining: number): number {
  if (xpRemaining <= 0) return 0
  return Math.max(1, Math.ceil(xpRemaining / TOP5_MIN_XP_PER_EVENT))
}

export function formatRankProgressFooter(
  nextRank: string | null,
  xpRemaining: number
): string {
  if (!nextRank) {
    return 'Champion — max rank'
  }
  if (xpRemaining <= 0) {
    return `Ready for ${nextRank}`
  }
  const finishes = estimateTop5FinishesToNextRank(xpRemaining)
  const finishWord = finishes === 1 ? 'finish' : 'finishes'
  return `~${finishes} top-5 ${finishWord} · ${xpRemaining} XP to ${nextRank}`
}
