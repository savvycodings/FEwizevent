export type RadarAxis = { id: string; label: string; value: number }

export function radarVertex(
  index: number,
  count: number,
  radius: number,
  cx: number,
  cy: number,
  value01: number
): { x: number; y: number } {
  const angle = -Math.PI / 2 + (2 * Math.PI * index) / count
  const r = Math.max(0, Math.min(1, value01)) * radius
  return {
    x: cx + r * Math.cos(angle),
    y: cy + r * Math.sin(angle),
  }
}

export function radarPolygonPath(
  values: number[],
  maxValue: number,
  radius: number,
  cx: number,
  cy: number
): string {
  if (values.length < 3) return ''
  const max = Math.max(maxValue, 1)
  const pts = values.map((v, i) =>
    radarVertex(i, values.length, radius, cx, cy, v / max)
  )
  return `${pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')} Z`
}

export function shortenDeckLabel(label: string, max = 14): string {
  if (label.length <= max) return label
  return `${label.slice(0, max - 1)}…`
}
