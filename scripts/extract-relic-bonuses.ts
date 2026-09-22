import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises'
import { basename, join, relative, resolve } from 'node:path'

type RawRecord = Record<string, string | number>
type Bonus = {
  id: string
  name: string
  description?: string
  attributes: Array<{ label: string; value: string | number }>
}
const root = resolve('data/game/records/items')
const output = resolve('public/data/relic-bonuses.json')
const parse = (contents: string): RawRecord => {
  const result: RawRecord = {}
  for (const line of contents.split(/\r?\n/)) {
    const separator = line.indexOf(',')
    if (separator < 1) continue
    const key = line.slice(0, separator).trim()
    const raw = line
      .slice(separator + 1)
      .replace(/,\s*$/, '')
      .trim()
      .replace(/^"|"$/g, '')
    const numeric = Number(raw)
    result[key] = raw !== '' && Number.isFinite(numeric) ? numeric : raw
  }
  return result
}
const filesUnder = async (directory: string): Promise<string[]> => {
  const entries = await readdir(directory, { withFileTypes: true }).catch(() => [])
  const files: string[] = []
  for (const entry of entries) {
    const path = join(directory, entry.name)
    if (entry.isDirectory()) files.push(...(await filesUnder(path)))
    else if (entry.isFile() && path.endsWith('.dbr')) files.push(path)
  }
  return files
}
const localization = new Map<string, string>()
for (const file of await filesUnder(resolve('data/lang/text_en'))) {
  if (!file.endsWith('.txt')) continue
  const contents = await readFile(file, 'utf8').catch(() => '')
  for (const line of contents.split(/\r?\n/)) {
    const separator = line.indexOf('=')
    if (separator > 0)
      localization.set(
        line.slice(0, separator).trim(),
        line
          .slice(separator + 1)
          .trim()
          .replace(/\^[a-z]/gi, ''),
      )
  }
}
const records = new Map<string, RawRecord>()
for (const file of await filesUnder(root))
  records.set(relative(resolve('data/game/records'), file).replaceAll('\\', '/'), parse(await readFile(file, 'utf8')))
const labels: Record<string, string> = {
  characterStrength: 'Physique',
  characterDexterity: 'Cunning',
  characterIntelligence: 'Spirit',
  characterLife: 'Health',
  characterMana: 'Energy',
  characterOffensiveAbility: 'Offensive Ability',
  characterDefensiveAbility: 'Defensive Ability',
  offensiveTotalDamageModifier: 'Total Damage',
  characterStrengthModifier: 'Physique',
  characterDexterityModifier: 'Cunning',
  characterIntelligenceModifier: 'Spirit',
  characterOffensiveAbilityModifier: 'Offensive Ability',
  characterDefensiveAbilityModifier: 'Defensive Ability',
  offensiveCritDamageModifier: 'Critical Damage',
  offensivePhysicalModifier: 'Physical Damage',
  offensivePierceModifier: 'Piercing Damage',
  offensiveFireModifier: 'Fire Damage',
  offensiveColdModifier: 'Cold Damage',
  offensiveLightningModifier: 'Lightning Damage',
  offensivePoisonModifier: 'Acid Damage',
  defensivePhysical: 'Physical Resistance',
  defensivePierce: 'Piercing Resistance',
  defensiveFire: 'Fire Resistance',
  defensiveCold: 'Cold Resistance',
  defensiveLightning: 'Lightning Resistance',
  defensivePoison: 'Acid Resistance',
}
const attributes = (record: RawRecord) =>
  Object.entries(labels).flatMap(([key, label]) => {
    const value = Number(record[key] ?? 0)
    return value
      ? [{ label, value: `${value > 0 ? '+' : ''}${value}${/^(offensive|defensive)/.test(key) ? '%' : ''}` }]
      : []
  })
const bonuses: Bonus[] = []
for (const [id, record] of records) {
  if (!id.includes('items/lootaffixes/completionrelics/') || id.includes('completionbonus_')) continue
  const name = typeof record.FileDescription === 'string' ? record.FileDescription : basename(id, '.dbr')
  bonuses.push({ id, name, attributes: attributes(record) })
}
const tables: Record<string, string[]> = {}
for (const [id, record] of records) {
  if (!id.includes('items/lootaffixes/completionrelics/completionbonus_')) continue
  const values = Object.entries(record)
    .filter(([key, value]) => key.startsWith('randomizerName') && typeof value === 'string')
    .map(([, value]) => String(value).replace(/^records\//, ''))
  tables[id] = values
}
await mkdir(resolve('public/data'), { recursive: true })
await writeFile(output, JSON.stringify({ bonuses, tables }, null, 2) + '\n', 'utf8')
console.log(`Extracted ${bonuses.length} relic bonuses and ${Object.keys(tables).length} tables`)
