import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'

type Item = {
  id: string
  name: string
  category: string
  rarity: string
  level: number
  attributes?: Array<{ label: string; value: string | number }>
  stats?: Record<string, string | number>
  [key: string]: unknown
}

const query = process.argv[2]?.trim()
const outputPath = resolve(process.argv[3] ?? 'data/debug/item.json')

if (!query) {
  console.error('Usage: npm run debug:item -- "item name or id" [output path]')
  process.exit(1)
}

const items = JSON.parse(await readFile(resolve('public/data/items.json'), 'utf8')) as Item[]
const normalizedQuery = query.toLowerCase()
const matches = items.filter((item) =>
  `${item.name} ${item.id}`.toLowerCase().includes(normalizedQuery),
)

await mkdir(dirname(outputPath), { recursive: true })
await writeFile(outputPath, `${JSON.stringify(matches, null, 2)}\n`, 'utf8')
console.log(`Found ${matches.length} matching item(s)`)
console.log(`Wrote ${outputPath}`)
