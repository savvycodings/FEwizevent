import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const mjs = fs.readFileSync(
  path.join(__dirname, '../node_modules/@aliimam/vectors/dist/index.mjs'),
  'utf8'
)

const names = [
  'Star1Shapes',
  'Star2Shapes',
  'Star3Shapes',
  'Star13Shapes',
  'Geometric10Shapes',
  'Abstract20Shapes',
  'Star4Shapes',
  'Geometric15Shapes',
  'Organic8Shapes',
  'Geometric22Shapes',
  'Organic15Shapes',
]

const out = {}
for (const n of names) {
  const metaRe = new RegExp(`var ${n}Metadata = \\{[\\s\\S]*?viewBox: "([^"]+)"`)
  const pathRe = new RegExp(
    `var ${n} = React[0-9]*\\.forwardRef\\([\\s\\S]*?path", \\{ d: "([^"]+)"`
  )
  const vb = mjs.match(metaRe)
  const d = mjs.match(pathRe)
  if (!vb || !d) {
    console.error('MISSING', n)
    process.exit(1)
  }
  out[n] = { viewBox: vb[1], d: d[1] }
}

fs.writeFileSync(
  path.join(__dirname, '../src/components/badges/_extracted.json'),
  JSON.stringify(out, null, 2)
)
console.log('wrote', Object.keys(out).length, 'vectors')
