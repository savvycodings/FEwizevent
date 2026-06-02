/**
 * Pulls path data from @aliimam/vectors (*Shapes) for React Native badge icons.
 * Run: node scripts/generate-badge-vectors.mjs
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

/**
 * BadgeId → @aliimam/vectors Shapes (prefer ~square viewBoxes for consistent tile fit).
 */
const BADGE_VECTOR_MAP = {
  placed1st: 'Star1Shapes',
  placed2nd: 'Star4Shapes',
  placed3rd: 'Star6Shapes',
  champion: 'Star12Shapes',
  flawless: 'Abstract16Shapes',
  magician: 'Abstract20Shapes',
  quick: 'Abstract5Shapes',
  scholar: 'Abstract7Shapes',
  scientist: 'Abstract9Shapes',
  sweat: 'Abstract12Shapes',
}

const mjs = fs.readFileSync(
  path.join(__dirname, '../node_modules/@aliimam/vectors/dist/index.mjs'),
  'utf8'
)

function extract(name) {
  const metaRe = new RegExp(`var ${name}Metadata = \\{[\\s\\S]*?viewBox: "([^"]+)"`)
  const pathRe = new RegExp(
    `var ${name} = React[0-9]*\\.forwardRef\\([\\s\\S]*?path", \\{ d: "([^"]+)"`
  )
  const vb = mjs.match(metaRe)
  const d = mjs.match(pathRe)
  if (!vb || !d) throw new Error(`Could not extract ${name}`)
  return { viewBox: vb[1], d: d[1] }
}

const uniqueNames = [...new Set(Object.values(BADGE_VECTOR_MAP))]
const paths = {}
for (const name of uniqueNames) {
  paths[name] = extract(name)
  const parts = paths[name].viewBox.split(/\s+/).map(Number)
  if (parts.length === 4) {
    const w = parts[2]
    const h = parts[3]
    const ratio = Math.max(w, h) / Math.min(w, h)
    if (ratio > 1.35) {
      console.warn(
        `Warning: ${name} viewBox=${paths[name].viewBox} may render small in square tiles`
      )
    }
  }
}

const outPath = path.join(__dirname, '../src/components/badges/badgeVectorPaths.ts')
const lines = [
  '/**',
  ' * Auto-generated from @aliimam/vectors (Shapes). Do not edit by hand.',
  ' * Regenerate: node scripts/generate-badge-vectors.mjs',
  ' */',
  '',
  "import type { BadgeId } from '@/data/badgesCatalog'",
  '',
  'export type BadgeVectorName =',
  `  ${uniqueNames.map((n) => `'${n}'`).join(' |\n  ')}`,
  '',
  'export const BADGE_VECTOR_BY_ID: Record<BadgeId, BadgeVectorName> = {',
  ...Object.entries(BADGE_VECTOR_MAP).map(
    ([id, name]) => `  ${id}: '${name}',`
  ),
  '} as const',
  '',
  'export const BADGE_VECTOR_PATHS: Record<',
  '  BadgeVectorName,',
  '  { viewBox: string; d: string }',
  '> = {',
  ...uniqueNames.map(
    (name) =>
      `  ${name}: { viewBox: '${paths[name].viewBox}', d: ${JSON.stringify(paths[name].d)} },`
  ),
  '} as const',
  '',
]

fs.writeFileSync(outPath, lines.join('\n'))
console.log('Wrote', outPath)
