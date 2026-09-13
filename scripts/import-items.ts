import { mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import { basename, extname, join, relative, resolve } from 'node:path'

type Item = {
  id: string
  name: string
  description: string
  category: string
  rarity: string
  level: number
  image?: string
  attributes: Array<{ label: string; value: string | number }>
  stats: Record<string, string | number>
}

type RawRecord = Record<string, unknown>

const inputPath = resolve(process.argv[2] ?? 'data/source/items.json')
const outputPath = resolve(process.argv[3] ?? 'public/data/items.json')
const localizationPath = process.argv[4] ? resolve(process.argv[4]) : undefined

const textValue = (record: RawRecord, keys: string[], fallback: string) => {
  const key = keys.find((candidate) => {
    const value = record[candidate]
    return value !== undefined && value !== null && String(value).trim() !== ''
  })
  return key ? String(record[key]) : fallback
}

const numberValue = (record: RawRecord, keys: string[], fallback = 0) => {
  const value = Number(textValue(record, keys, String(fallback)))
  return Number.isFinite(value) ? value : fallback
}

const damageTypes: Record<string, string> = {
  physical: 'Physical',
  fire: 'Fire',
  cold: 'Cold',
  lightning: 'Lightning',
  poison: 'Poison',
  pierce: 'Piercing',
  bleeding: 'Bleeding',
  aether: 'Aether',
  chaos: 'Chaos',
  vitality: 'Vitality',
  vitalityDecay: 'Vitality Decay',
}

const formatNumber = (value: number) =>
  Number.isInteger(value) ? String(value) : value.toFixed(2).replace(/0+$/, '').replace(/\.$/, '')

const gameAttributes = (
  stats: Record<string, string | number>,
  skillNames: Map<string, string>,
): Array<{ label: string; value: string | number }> => {
  const attributes: Array<{ label: string; value: string | number }> = []
  const numeric = (key: string) => Number(stats[key] ?? 0)
  const add = (label: string, value: string | number) => attributes.push({ label, value })

  for (const [key, label] of Object.entries(damageTypes)) {
    const minimum = numeric(`offensive${key[0].toUpperCase()}${key.slice(1)}Min`)
    const maximum = numeric(`offensive${key[0].toUpperCase()}${key.slice(1)}Max`)
    if (minimum || maximum) add(`${label} Damage`, `${formatNumber(minimum)} - ${formatNumber(maximum)}`)
  }

  for (const [key, label] of Object.entries(damageTypes)) {
    const resistance = numeric(`defensive${key[0].toUpperCase()}${key.slice(1)}`)
    const maximum = numeric(`defensive${key[0].toUpperCase()}${key.slice(1)}MaxResist`)
    if (resistance) add(`${label} Resistance`, `${formatNumber(resistance)}%`)
    if (maximum) add(`Maximum ${label} Resistance`, `+${formatNumber(maximum)}%`)
  }

  const knownAttributes: Array<[string, string, string]> = [
    ['characterStrength', 'Strength', 'number'],
    ['characterDexterity', 'Physique', 'number'],
    ['characterIntelligence', 'Spirit', 'number'],
    ['characterLife', 'Health', 'number'],
    ['characterMana', 'Energy', 'number'],
    ['characterOffensiveAbility', 'Offensive Ability', 'number'],
    ['characterDefensiveAbility', 'Defensive Ability', 'number'],
    ['characterAttackSpeedModifier', 'Attack Speed', 'percent'],
    ['characterCastSpeedModifier', 'Cast Speed', 'percent'],
    ['characterMovementSpeedModifier', 'Movement Speed', 'percent'],
  ]
  for (const [key, label, format] of knownAttributes) {
    const value = numeric(key)
    if (value)
      add(
        label,
        format === 'percent'
          ? `${value > 0 ? '+' : ''}${formatNumber(value)}%`
          : `${value > 0 ? '+' : ''}${formatNumber(value)}`,
      )
  }

  for (let index = 1; index <= 4; index += 1) {
    const skillPath = String(stats[`augmentSkillName${index}`] ?? '')
    const skillLevel = numeric(`augmentSkillLevel${index}`)
    if (!skillPath || !skillLevel) continue
    const skillName =
      skillNames.get(skillPath.replaceAll('\\', '/')) ??
      skillPath
        .split(/[\\/]/)
        .pop()
        ?.replace(/\.dbr$/i, '') ??
      'Skill'
    add('Skill Bonus', `+${formatNumber(skillLevel)} to ${skillName}`)
  }

  return attributes
}

const imagePath = (record: RawRecord): string | undefined => {
  const value = textValue(
    record,
    ['image', 'imagePath', 'itemBitmap', 'bitmap', 'artifactBitmap', 'artifactFormulaBitmapName'],
    '',
  )
  if (!value) return undefined
  const normalized = value.replaceAll('\\', '/').replace(/^\/+/, '')
  if (normalized.startsWith('items/') && /\.tex$/i.test(normalized))
    return `/assets/${normalized.replace(/\.tex$/i, '.webp')}`
  return undefined
}

const normalize = (
  record: RawRecord,
  fallbackId: string,
  localization: Map<string, string>,
  skillNames: Map<string, string>,
): Item => {
  const stats = (record.stats && typeof record.stats === 'object' ? record.stats : {}) as Record<
    string,
    string | number
  >
  const reserved = new Set(['id', 'name', 'description', 'category', 'rarity', 'level', 'image', 'stats'])
  for (const [key, value] of Object.entries(record)) {
    if (!reserved.has(key) && ['string', 'number'].includes(typeof value)) stats[key] = value as string | number
  }
  const fallbackName = basename(fallbackId, extname(fallbackId))
  const rawName = textValue(
    record,
    ['name', 'displayName', 'itemName', 'itemNameTag', 'description', 'FileDescription'],
    fallbackName,
  )
  const rawDescription = textValue(
    record,
    ['itemText', 'flavorText', 'itemDescription'],
    textValue(record, ['description'], ''),
  )
  return {
    id: textValue(record, ['id', 'record', 'path'], fallbackId),
    name: localization.get(rawName) ?? rawName,
    description: localization.get(rawDescription) ?? rawDescription,
    category: textValue(record, ['category', 'itemType', 'equipmentType', 'itemClassification'], 'Item'),
    rarity: textValue(record, ['rarity', 'quality', 'itemClassification'], 'Common'),
    level: numberValue(record, ['level', 'itemLevel', 'requiredLevel', 'levelRequirement']),
    image: imagePath(record),
    attributes: gameAttributes(stats, skillNames),
    stats,
  }
}

const parseDbr = (contents: string, filePath: string): RawRecord => {
  const record: RawRecord = { id: filePath }
  for (const line of contents.split(/\r?\n/)) {
    const separator = line.indexOf(',')
    if (separator < 1) continue
    const key = line.slice(0, separator).trim()
    const rawValue = line
      .slice(separator + 1)
      .replace(/,\s*$/, '')
      .trim()
    const value = rawValue.replace(/^"|"$/g, '')
    const numeric = Number(value)
    record[key] = value !== '' && Number.isFinite(numeric) ? numeric : value
  }
  return record
}

const readLocalization = async (path?: string): Promise<Map<string, string>> => {
  if (!path) return new Map()
  const localization = new Map<string, string>()
  const collectFiles = async (directory: string): Promise<string[]> => {
    const entries = await readdir(directory, { withFileTypes: true }).catch(() => [])
    const files: string[] = []
    for (const entry of entries) {
      const filePath = join(directory, entry.name)
      if (entry.isDirectory()) files.push(...(await collectFiles(filePath)))
      else if (entry.isFile() && extname(entry.name) === '.txt') files.push(filePath)
    }
    return files
  }
  const collectedFiles = await collectFiles(path)
  const files = collectedFiles.length ? collectedFiles : [path]
  for (const file of files) {
    const contents = await readFile(file, 'utf8')
    for (const line of contents.split(/\r?\n/)) {
      const separator = line.indexOf('=')
      if (separator < 1 || line.trimStart().startsWith('#')) continue
      const key = line.slice(0, separator).trim()
      const value = line
        .slice(separator + 1)
        .trim()
        .replace(/^"|"$/g, '')
      if (key && value) localization.set(key, value)
    }
  }
  return localization
}

const readRecords = async (path: string): Promise<RawRecord[]> => {
  const entries = await readdir(path, { withFileTypes: true }).catch(() => [])
  if (entries.length) {
    const records: RawRecord[] = []
    for (const entry of entries) {
      const child = join(path, entry.name)
      if (entry.isDirectory()) records.push(...(await readRecords(child)))
      else if (['.json', '.dbr'].includes(extname(entry.name).toLowerCase()))
        records.push(...(await readRecords(child)))
    }
    return records
  }
  const contents = await readFile(path, 'utf8')
  if (extname(path).toLowerCase() === '.dbr') return [parseDbr(contents, path)]
  const parsed = JSON.parse(contents) as RawRecord | RawRecord[]
  if (Array.isArray(parsed)) return parsed
  if (Array.isArray(parsed.items)) return parsed.items as RawRecord[]
  return [parsed]
}

const readSkillNames = async (path: string, localization: Map<string, string>): Promise<Map<string, string>> => {
  const names = new Map<string, string>()
  for (const record of await readRecords(path).catch(() => [])) {
    const id = typeof record.id === 'string' ? record.id.replaceAll('\\', '/') : ''
    const tag = typeof record.skillDisplayName === 'string' ? record.skillDisplayName : ''
    if (!id || !tag) continue
    const name = localization.get(tag) ?? tag
    names.set(id, name)
    const relativeId = id.indexOf('records/skills/')
    if (relativeId >= 0) names.set(id.slice(relativeId), name)
  }
  return names
}

const records = await readRecords(inputPath)
const localization = await readLocalization(localizationPath)
const skillNames = await readSkillNames(resolve('data/game/records/skills'), localization)
const items = records.map((record, index) => {
  const recordId =
    typeof record.id === 'string'
      ? relative(process.cwd(), record.id).replaceAll('\\', '/')
      : `${inputPath}#${index + 1}`
  return normalize({ ...record, id: recordId }, recordId, localization, skillNames)
})
await mkdir(join(outputPath, '..'), { recursive: true })
const outputDirectory = join(outputPath, '..')
await rm(join(outputDirectory, 'item-pages'), { recursive: true, force: true })
await writeFile(outputPath, `${JSON.stringify(items)}\n`, 'utf8')
console.log(`Imported ${items.length} items from ${inputPath}`)
console.log(`Wrote one item database to ${outputPath}`)
if (localizationPath) console.log(`Resolved ${localization.size} localization tags from ${localizationPath}`)
console.log(`Wrote ${outputPath}`)
