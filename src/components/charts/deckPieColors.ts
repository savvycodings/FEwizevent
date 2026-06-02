/** Slice palette aligned with Wizards chart tokens */
export const DECK_PIE_COLORS = [
  '#8FD3FF',
  '#4DA8E8',
  '#A78BFA',
  '#F59E0B',
  '#34D399',
  '#F472B6',
  '#94A3B8',
  '#FB923C',
  '#22D3EE',
  '#E879F9',
] as const

export function deckPieColor(index: number): string {
  return DECK_PIE_COLORS[index % DECK_PIE_COLORS.length]
}
