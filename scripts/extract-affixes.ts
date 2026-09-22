import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises'
import { basename, extname, join, relative, resolve } from 'node:path'

type RawRecord = Record<string, string | number>
type Affix = {
  id: string
  kind: 'Prefix' | 'Suffix'
  name: string
  description?: string
  rarity: 'Magical' | 'Rare' | 'Epic' | 'Legendary'
  attributes: Array<{ label: string; value: string | number }>
  validCategories: string[]
  levelRanges: Array<{ min: number; max: number }>
  requiredLevel: number
}

const root = resolve('data/game/records/items/lootaffixes')
const output = resolve('public/data/affixes.json')
const langRoot = resolve('data/lang/text_en')

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

const filesUnder = async (directory: string, extension = '.dbr'): Promise<string[]> => {
  const entries = await readdir(directory, { withFileTypes: true }).catch(() => [])
  const files: string[] = []
  for (const entry of entries) {
    const path = join(directory, entry.name)
    if (entry.isDirectory()) files.push(...(await filesUnder(path, extension)))
    else if (entry.isFile() && extname(entry.name).toLowerCase() === extension) files.push(path)
  }
  return files
}

const localization = new Map<string, string>()
for (const file of await filesUnder(langRoot, '.txt')) {
  const contents = await readFile(file, 'utf8')
  for (const line of contents.split(/\r?\n/)) {
    const separator = line.indexOf('=')
    if (separator > 0) localization.set(line.slice(0, separator).trim(), line.slice(separator + 1).trim())
  }
}

const records = new Map<string, RawRecord>()
for (const file of await filesUnder(root))
  records.set(relative(resolve('data/game/records'), file).replaceAll('\\', '/'), parse(await readFile(file, 'utf8')))

const categoryFromTable = (file: string): string[] => {
  const name = basename(file).toLowerCase()
  if (name.includes('ring')) return ['Ring']
  if (name.includes('necklace') || name.includes('amulet')) return ['Amulet']
  if (name.includes('accessory')) return ['Amulet', 'Ring', 'Medal', 'Relic', 'Belt']
  if (name.includes('shield')) return ['Off-Hand']
  if (name.includes('feet') || name.includes('boots')) return ['Boots']
  if (name.includes('hands') || name.includes('gloves')) return ['Gloves']
  if (name.includes('legs') || name.includes('pants')) return ['Pants']
  if (name.includes('head') || name.includes('helm')) return ['Helm']
  if (name.includes('torso') || name.includes('chest')) return ['Chest Armor']
  if (name.includes('shoulder')) return ['Shoulders']
  if (name.includes('armor')) return ['Chest Armor', 'Gloves', 'Pants', 'Boots', 'Helm', 'Shoulders']
  if (name.includes('weaponcaster')) return ['Weapon Caster']
  if (name.includes('focus')) return ['Off-Hand Focus']
  if (name.includes('weapon1h')) return ['Weapon']
  if (name.includes('weapon2h')) return ['Weapon']
  if (name.includes('weapon')) return ['Weapon']
  return []
}

const pools = new Map<string, { categories: Set<string>; levelRanges: Array<{ min: number; max: number }> }>()
for (const file of await filesUnder(root)) {
  if (!file.includes(`${join('prefix', 'prefixtables')}`) && !file.includes(`${join('suffix', 'suffixtables')}`))
    continue
  const categories = categoryFromTable(file)
  const table = parse(await readFile(file, 'utf8'))
  for (const [key, value] of Object.entries(table)) {
    if (!key.startsWith('randomizerName') || typeof value !== 'string') continue
    const path = value.replace(/^records\//, '').replaceAll('\\', '/')
    const pool = pools.get(path) ?? { categories: new Set<string>(), levelRanges: [] }
    const index = key.replace('randomizerName', '')
    const min = Number(table[`randomizerLevelMin${index}`] ?? 1)
    const max = Number(table[`randomizerLevelMax${index}`] ?? 500)
    for (const category of categories) pool.categories.add(category)
    if (Number.isFinite(min) && Number.isFinite(max)) pool.levelRanges.push({ min, max })
    pools.set(path, pool)
  }
}

const labelMap: Record<string, string> = {
  characterStrength: 'Physique',
  characterDexterity: 'Cunning',
  characterIntelligence: 'Spirit',
  characterLife: 'Health',
  characterMana: 'Energy',
  offensivePhysicalModifier: 'Physical Damage',
  offensivePierceModifier: 'Piercing Damage',
  offensiveFireModifier: 'Fire Damage',
  offensiveColdModifier: 'Cold Damage',
  offensiveLightningModifier: 'Lightning Damage',
  offensivePoisonModifier: 'Acid Damage',
  offensiveBleedingModifier: 'Bleeding Damage',
  defensivePhysical: 'Physical Resistance',
  defensivePierce: 'Piercing Resistance',
  defensiveFire: 'Fire Resistance',
  defensiveCold: 'Cold Resistance',
  defensiveLightning: 'Lightning Resistance',
  defensivePoison: 'Acid Resistance',
  characterStrengthModifier: 'Physique',
  characterDexterityModifier: 'Cunning',
  characterIntelligenceModifier: 'Spirit',
  characterLifeModifier: 'Health',
  characterManaModifier: 'Energy',
  characterOffensiveAbilityModifier: 'Offensive Ability',
  characterDefensiveAbilityModifier: 'Defensive Ability',
  characterAttackSpeedModifier: 'Attack Speed',
  characterTotalSpeedModifier: 'Total Speed',
  characterLifeRegenModifier: 'Health Regeneration',
  characterManaRegenModifier: 'Energy Regeneration',
  offensiveTotalDamageModifier: 'Total Damage',
  offensiveSlowBleedingModifier: 'Bleeding Damage',
}
const attributesFor = (record: RawRecord) =>
  Object.entries(labelMap).flatMap(([key, label]) => {
    const value = Number(record[key] ?? 0)
    return value
      ? [{ label, value: `${value > 0 ? '+' : ''}${value}${/^(offensive|defensive)/.test(key) ? '%' : ''}` }]
      : []
  })

const affixes: Affix[] = []
for (const kind of ['prefix', 'suffix'] as const) {
  for (const file of await filesUnder(join(root, kind))) {
    if (file.includes('tables')) continue
    const record = records.get(relative(resolve('data/game/records'), file).replaceAll('\\', '/')) ?? {}
    const tag = typeof record.lootRandomizerName === 'string' ? record.lootRandomizerName : ''
    const name = localization.get(tag) ?? tag
    if (!name || name === 'Blank') continue
    const id = relative(resolve('data/game/records'), file).replaceAll('\\', '/')
    affixes.push({
      id,
      kind: kind === 'prefix' ? 'Prefix' : 'Suffix',
      name,
      description: typeof record.FileDescription === 'string' ? record.FileDescription : undefined,
      rarity:
        record.itemClassification === 'Rare'
          ? 'Rare'
          : record.itemClassification === 'Epic'
            ? 'Epic'
            : record.itemClassification === 'Legendary'
              ? 'Legendary'
              : 'Magical',
      attributes: attributesFor(record),
      validCategories: [...(pools.get(id)?.categories ?? new Set<string>())],
      levelRanges: pools.get(id)?.levelRanges ?? [],
      requiredLevel: Math.min(...(pools.get(id)?.levelRanges.map((range) => range.min) ?? [1])),
    })
  }
}
await mkdir(resolve('public/data'), { recursive: true })
await writeFile(
  output,
  `${JSON.stringify(
    affixes.filter((affix) => affix.validCategories.length),
    null,
    2,
  )}\n`,
  'utf8',
)
console.log(`Extracted ${affixes.length} affixes to ${output}`)
