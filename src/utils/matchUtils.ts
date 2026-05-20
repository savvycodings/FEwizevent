export type EventMatch = {
  id: number
  roundNumber: number
  playerAId: number
  playerBId: number
  outcome: 'a_wins' | 'b_wins' | 'draw'
  playerAName?: string
  playerBName?: string
}

export function matchForFocalRound(
  matches: EventMatch[],
  focalId: number,
  round: number
): EventMatch | undefined {
  return matches.find(
    (m) => m.roundNumber === round && (m.playerAId === focalId || m.playerBId === focalId)
  )
}

export function opponentIdFromMatch(m: EventMatch, focalId: number): number {
  return m.playerAId === focalId ? m.playerBId : m.playerAId
}

export function opponentNameFromMatch(m: EventMatch, focalId: number): string {
  return m.playerAId === focalId ? (m.playerBName ?? '') : (m.playerAName ?? '')
}

export function focalOutcome(m: EventMatch, focalId: number): 'win' | 'loss' | 'draw' | null {
  if (!m) return null
  if (m.outcome === 'draw') return 'draw'
  if (m.playerAId === focalId) return m.outcome === 'a_wins' ? 'win' : 'loss'
  return m.outcome === 'b_wins' ? 'win' : 'loss'
}

/** Opponent from previous round if still attended (for hints / prefill). */
export function suggestOpponentFromPreviousRound(
  matches: EventMatch[],
  focalId: number,
  currentRound: number,
  attendedUserIds: Set<number>
): { userId: number; name: string } | null {
  if (currentRound <= 1) return null
  const m = matchForFocalRound(matches, focalId, currentRound - 1)
  if (!m) return null
  const opp = opponentIdFromMatch(m, focalId)
  if (!attendedUserIds.has(opp)) return null
  const name = opponentNameFromMatch(m, focalId)
  return { userId: opp, name: name || `Player #${opp}` }
}

/** Build a temporary match row for optimistic UI after save (before refetch). */
export function optimisticMatchFromResult(
  round: number,
  focal: number,
  opponent: number,
  result: 'win' | 'loss' | 'draw',
  nameByUserId: Map<number, string>
): EventMatch {
  const low = Math.min(focal, opponent)
  const high = Math.max(focal, opponent)
  let outcome: 'a_wins' | 'b_wins' | 'draw'
  if (result === 'draw') {
    outcome = 'draw'
  } else if (focal === low) {
    outcome = result === 'win' ? 'a_wins' : 'b_wins'
  } else {
    outcome = result === 'win' ? 'b_wins' : 'a_wins'
  }
  return {
    id: -Date.now(),
    roundNumber: round,
    playerAId: low,
    playerBId: high,
    outcome,
    playerAName: nameByUserId.get(low) ?? '',
    playerBName: nameByUserId.get(high) ?? '',
  }
}

/** Replace any match in `round` involving `focal`, and insert `next` (server mirrors one row per pair). */
export function replaceFocalRoundMatches(matches: EventMatch[], focal: number, round: number, next: EventMatch) {
  const filtered = matches.filter(
    (m) => !(m.roundNumber === round && (m.playerAId === focal || m.playerBId === focal))
  )
  return [...filtered, next]
}

export function removeFocalRoundMatch(matches: EventMatch[], focal: number, round: number) {
  return matches.filter(
    (m) => !(m.roundNumber === round && (m.playerAId === focal || m.playerBId === focal))
  )
}
