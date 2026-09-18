import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises'
import { basename, join, resolve } from 'node:path'
import { DAMAGE_OVER_TIME_TYPES, conversionLabel, damageLabel, damageOverTimeLabel } from './damage-utils.js'

type Skill = {
  id: string
  name: string
  description: string
  maxLevel: number
  groupId: string
  isModifier: boolean
  isTransmuter: boolean
  icon?: string
  effects: Array<{ key: string; label: string; values: number[]; suffix?: string }>
  summonEffects: Array<{
    name: string
    effects: Array<{ key: string; label: string; values: number[]; suffix?: string }>
  }>
}
type Skillsets = Record<string, Skill[]>

const languagePath = resolve('data/lang/text_en')
const tags = new Map<string, string>()
for (const file of (await readdir(languagePath)).filter((name) => /^tags.*_skills\.txt$/i.test(name))) {
  const contents = await readFile(join(languagePath, file), 'utf8')
  for (const line of contents.split(/\r?\n/)) {
    const separator = line.indexOf('=')
    if (separator < 1) continue
    const value = line
      .slice(separator + 1)
      .trim()
      .replace(/^"|"$/g, '')
    if (value && value !== '?') tags.set(line.slice(0, separator).trim(), value)
  }
}

const parseRecord = async (filePath: string) => {
  const record = new Map<string, string>()
  const contents = await readFile(filePath, 'utf8')
  for (const line of contents.split(/\r?\n/)) {
    const separator = line.indexOf(',')
    if (separator < 1) continue
    record.set(
      line.slice(0, separator).trim(),
      line
        .slice(separator + 1)
        .replace(/,\s*$/, '')
        .trim()
        .replace(/^"|"$/g, ''),
    )
  }
  return record
}

const labelFor = (key: string) => key.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/^./, (value) => value.toUpperCase())
const effectLabel = (key: string) =>
  ({
    skillLifeBonus: 'Health Restoration',
    skillLifePercent: 'Health Restoration',
    defensiveChaos: 'Chaos Resistance',
    defensiveAether: 'Aether Resistance',
    characterDefensiveAbility: 'Defensive Ability',
    offensiveDamageMultModifier: 'Total Damage',
  })[key] ?? labelFor(key)
const effectKeys =
  /^(offensive|defensive|retaliation|character|projectile|block|skillManaCost|skillCooldownTime|skillLife|weaponDamagePct|healing)/i
const extractEffects = (record: Map<string, string>) => {
  const effects: Array<{
    key: string
    label: string
    values: number[]
    suffix?: string
    minValues?: number[]
    maxValues?: number[]
  }> = [...record.entries()]
    .filter(
      ([key, value]) =>
        effectKeys.test(key) &&
        (value.includes(';') || key === 'offensiveDamageMultModifier') &&
        !/^offensive(Slow)?(?:Fire|Lightning|Cold|Poison|Bleeding)(?:Min|Max|Duration)/i.test(key),
    )
    .map(([key, value]) => ({
      key,
      label: effectLabel(key),
      values: value.split(';').map(Number),
      suffix: /pct|percent|modifier|chance/i.test(key) ? '%' : undefined,
    }))
    .filter((effect) => effect.values.some((value) => Number.isFinite(value) && value !== 0))
  for (const [type, dotType] of DAMAGE_OVER_TIME_TYPES) {
    const minKey = `offensive${type}Min`
    const maxKey = `offensive${type}Max`
    const minValues = record.get(minKey)?.split(';').map(Number).filter(Number.isFinite) ?? []
    const maxValues = record.get(maxKey)?.split(';').map(Number).filter(Number.isFinite) ?? []
    if (minValues.some((value) => value !== 0) || maxValues.some((value) => value !== 0)) {
      effects.push({
        key: minKey,
        label: damageLabel(type),
        values: minValues.length ? minValues : maxValues,
        minValues,
        maxValues,
      })
    }
    const dotMinKey = `offensiveSlow${type}Min`
    const dotMaxKey = `offensiveSlow${type}Max`
    const dotMinValues = record.get(dotMinKey)?.split(';').map(Number).filter(Number.isFinite) ?? []
    const dotMaxValues = record.get(dotMaxKey)?.split(';').map(Number).filter(Number.isFinite) ?? []
    const duration = Number(record.get(`offensiveSlow${type}DurationMin`) ?? 0)
    if (dotMinValues.some((value) => value !== 0) || dotMaxValues.some((value) => value !== 0)) {
      effects.push({
        key: dotMinKey,
        label: damageOverTimeLabel(dotType, duration),
        values: dotMinValues.length ? dotMinValues : dotMaxValues,
        minValues: dotMinValues,
        maxValues: dotMaxValues,
      })
    }
  }
  const conversionPercentage = Number(record.get('conversionPercentage') ?? 0)
  const conversionInType = record.get('conversionInType')
  const conversionOutType = record.get('conversionOutType')
  if (conversionPercentage && conversionInType && conversionOutType)
    effects.push({
      key: 'conversionPercentage',
      label: conversionLabel(conversionInType, conversionOutType),
      values: [conversionPercentage],
      suffix: '%',
    })
  return effects
}
const collectSummonEffects = async (record: Map<string, string>, depth = 0): Promise<Skill['summonEffects']> => {
  if (depth > 2) return []
  const effects: Skill['summonEffects'] = []
  for (let index = 1; index <= 30; index += 1) {
    const childPath = record.get(`skillName${index}`)
    if (!childPath) continue
    const childRecord = await parseRecord(resolve('data/game', childPath))
    const childNameTag = childRecord.get('skillDisplayName')
    const name = childNameTag ? (tags.get(childNameTag) ?? childNameTag) : basename(childPath, '.dbr')
    const childEffects = extractEffects(childRecord)
    effects.push({ name, effects: childEffects })
    if (!childEffects.length) effects.push(...(await collectSummonEffects(childRecord, depth + 1)))
  }
  return effects
}

const skillsets: Skillsets = {}
for (let classNumber = 1; classNumber <= 10; classNumber += 1) {
  const classId = String(classNumber).padStart(2, '0')
  const directory = resolve(`data/game/records/skills/playerclass${classId}`)
  const files = (await readdir(directory).catch(() => [])).filter((file) => file.endsWith('.dbr'))
  const skills: Skill[] = []
  for (const file of files) {
    const record = await parseRecord(join(directory, file))
    const nameTag = record.get('skillDisplayName')
    const name = nameTag ? tags.get(nameTag) : undefined
    if (!name) continue
    const tagMatch = nameTag?.match(/^tag(?:GDX\d+)?Class(\d+)SkillName(\d+)([A-Z])?$/)
    const groupId = tagMatch ? `${classId}:${tagMatch[2]}` : `${classId}:${basename(file, '.dbr')}`
    const suffix = tagMatch?.[3]
    const descriptionTag = record.get('skillBaseDescription')
    const effects = extractEffects(record)
    const summonEffects: Skill['summonEffects'] = []
    const summonPath = (record.get('spawnObjects') ?? '').split(';').filter(Boolean)[0]
    if (summonPath) {
      const summonRecord = await parseRecord(resolve('data/game', summonPath))
      summonEffects.push(...(await collectSummonEffects(summonRecord)))
    }
    skills.push({
      id: `playerclass${classId}/${basename(file, '.dbr')}`,
      name,
      description: descriptionTag ? (tags.get(descriptionTag) ?? '') : '',
      maxLevel: Number(record.get('skillMaxLevel') ?? 0),
      groupId,
      isModifier: Boolean(suffix && suffix !== 'A'),
      isTransmuter: record.get('templateName')?.toLowerCase().endsWith('/skill_transmuter.tpl') ?? false,
      effects,
      summonEffects,
      icon: record.get('skillUpBitmapName')
        ? `/assets/${record.get('skillUpBitmapName')!.replace(/\.tex$/i, '.webp')}`
        : undefined,
    })
  }
  skillsets[classId] = skills
}

await mkdir(resolve('public/data'), { recursive: true })
await writeFile(resolve('public/data/mastery-skills.json'), `${JSON.stringify(skillsets, null, 2)}\n`, 'utf8')
console.log(`Extracted mastery skills to public/data/mastery-skills.json`)
