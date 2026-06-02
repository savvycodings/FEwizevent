import { DECK_CATALOG } from '@/constants/deckCatalog'

export type DeckRadarStat = {
  deckId: string
  label: string
  wins: number
  events: number
}

type BuildDeckRadarAxesOptions = {
  /** When false, only decks with recorded stats (for community meta). */
  fillCatalog?: boolean
  maxAxes?: number
}

/** Build 3–8 radar axes: active deck, decks with stats, then catalog fill-in. */
export function buildDeckRadarAxes(
  stats: DeckRadarStat[],
  activeDeckId?: string | null,
  options?: BuildDeckRadarAxesOptions
): DeckRadarStat[] {
  const fillCatalog = options?.fillCatalog !== false
  const maxAxes = options?.maxAxes ?? 8
  const byId = new Map(stats.map((s) => [s.deckId, s]))
  const result: DeckRadarStat[] = []

  const add = (deckId: string) => {
    if (result.some((r) => r.deckId === deckId)) return
    const fromStat = byId.get(deckId)
    const fromCat = DECK_CATALOG.find((d) => d.id === deckId)
    if (!fromStat && !fromCat) return
    result.push(
      fromStat ?? {
        deckId,
        label: fromCat!.label,
        wins: 0,
        events: 0,
      }
    )
  }

  if (activeDeckId) add(activeDeckId)

  const withData = [...stats]
    .filter((s) => s.events > 0)
    .sort((a, b) => b.wins - a.wins || b.events - a.events)
  for (const s of withData) add(s.deckId)

  if (fillCatalog) {
    for (const d of DECK_CATALOG) {
      if (result.length >= maxAxes) break
      add(d.id)
    }
  }

  return result.slice(0, maxAxes)
}

/** Top community decks by event volume (no catalog padding). */
export function buildCommunityDeckAxes(stats: DeckRadarStat[], maxAxes = 8): DeckRadarStat[] {
  return [...stats]
    .filter((s) => s.events > 0)
    .sort((a, b) => b.events - a.events || b.wins - a.wins)
    .slice(0, maxAxes)
}
