import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises'
import { basename, join, resolve } from 'node:path'
import { DAMAGE_TYPES, fieldName } from './damage-utils.js'

type RecordMap = Map<string, string>
const root = resolve('data/game/records')
const langRoot = resolve('data/lang/text_en')

const tags = new Map<string, string>()
for (const file of await readdir(langRoot)) {
  if (!/^tags.*_(items|skills)\.txt$/i.test(file)) continue
  for (const line of (await readFile(join(langRoot, file), 'utf8')).split(/\r?\n/)) {
    const split = line.indexOf('=')
    if (split > 0)
      tags.set(
        line.slice(0, split).trim(),
        line
          .slice(split + 1)
          .trim()
          .replace(/^"|"$/g, ''),
      )
  }
}
const parse = async (file: string): Promise<RecordMap> => {
  const result = new Map<string, string>()
  for (const line of (await readFile(file, 'utf8')).split(/\r?\n/)) {
    const split = line.indexOf(',')
    if (split > 0)
      result.set(
        line.slice(0, split).trim(),
        line
          .slice(split + 1)
          .replace(/,\s*$/, '')
          .trim()
          .replace(/^"|"$/g, ''),
      )
  }
  return result
}

const formatNumber = (value: number) =>
  Number.isInteger(value) ? String(value) : value.toFixed(2).replace(/0+$/, '').replace(/\.$/, '')
const humanizeSkillIdentifier = (path: string) => {
  const normalizedPath = path
    .replaceAll('\\', '/')
    .replace(/^records\//, '')
    .replace(/\.dbr$/i, '')
    .toLowerCase()
  const rawIdentifier =
    path
      .split(/[\\/]/)
      .pop()
      ?.replace(/\.dbr$/i, '')
      .toLowerCase() ?? ''
  const exactNames: Record<string, string> = {
    soulscythe3: 'Soul Harvest',
    natureblessing1: "Mogdrogen's Pact",
    arcaneseal1: 'Inquisitor Seal',
    pox1: 'Bloody Pox',
    thermitemines1: 'Thermite Mine',
    thermitemines2_petmod: 'Thermite Mine',
    thermitemines2_petmodifier: 'Thermite Mine',
    summon_raven1: 'Summon Familiar',
    summon_skeleton1: 'Raise Skeletons',
    bloodofdreeg1: 'Blood of Dreeg',
    squall1: 'Wind Devil',
    amatokpact1: "Amatok's Pact",
    soulsiphon1: 'Siphon Souls',
    spectralarmor1: 'Spectral Binding',
    spectralarmor2: 'Spectral Wrath',
    auracensure1: 'Aura of Censure',
    eviscerate2: 'Lethal Assault',
    presenceofvirtue1: 'Presence of Virtue',
    auraconviction1: 'Aura of Conviction',
    curse1: 'Curse of Frailty',
    lightningnet1b: "Allagast's Arcane Net",
    chillingsurge2: 'Absolute Zero',
    passive01: 'Inner Focus',
    totem2_petmodifier: 'Storm Totem',
    arcaneseal2_petmodifier: 'Inquisitor Seal',
    summon_celestialguardian1: 'Summon Guardian of Empyrion',
    summon_celestialguardian2_petmodifier: 'Summon Guardian of Empyrion',
    summon_blightbeast1: 'Summon Blight Fiend',
    summon_blightbeast2_petmodifier: 'Summon Blight Fiend',
    squall2: 'Wind Devil',
    chillingsurge: "Olexra's Flash Freeze",
    'skills/playerclass07/passive03': 'Relic Training',
    'skills/playerclass07/lightningnet1': 'Storm Box of Elgoloth',
    'skills/playerclass05/passive01': 'Inner Focus',
    'skills/playerclass06/passive01': 'Brute Force',
    'skills/playerclass07/passive01': 'Ranged Expertise',
    'skills/playerclass10/passive01': 'Implements of War',
  }
  if (exactNames[normalizedPath]) return exactNames[normalizedPath]
  if (exactNames[rawIdentifier]) return exactNames[rawIdentifier]
  const identifier =
    path
      .split(/[\\/]/)
      .pop()
      ?.replace(/\.dbr$/i, '')
      .replace(/_(?:petmodifier|petmod|buff|modifier)$/i, '')
      .replace(/\d+[a-z]?$/i, '')
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .replace(/[_-]+/g, ' ')
      .trim() ?? 'skill'
  const knownNames: Record<string, string> = {
    bonechillingcry: 'Bone Chilling Cry',
    spectralarmor: 'Spectral Armor',
    totem: 'Totem',
    lightningnet: 'Lightning Net',
    eviscerate: 'Eviscerate',
    devouringswarm: 'Devouring Swarm',
    thermitemines: 'Thermite Mines',
    veilofshadows: 'Veil of Shadows',
    icerune: 'Ice Rune',
    mortartrap: 'Mortar Trap',
    elementalinfusion: 'Elemental Infusion',
    illomen: 'Ill Omen',
    soulscythe: 'Soul Scythe',
    bloodborne: 'Bloodborne',
    blastshield: 'Blast Shield',
  }
  return (
    knownNames[identifier.replace(/\s+/g, '').toLowerCase()] ??
    identifier.replace(/\b\w/g, (character) => character.toUpperCase())
  )
}
const knownAttributes: Array<[string, string, 'number' | 'percent']> = [
  ['characterStrength', 'Physique', 'number'],
  ['characterDexterity', 'Cunning', 'number'],
  ['characterIntelligence', 'Spirit', 'number'],
  ['characterLife', 'Health', 'number'],
  ['characterLifeModifier', 'Health', 'percent'],
  ['characterLifeRegen', 'Health Regenerated per second', 'number'],
  ['characterLifeRegenModifier', 'Health Regeneration', 'percent'],
  ['characterMana', 'Energy', 'number'],
  ['characterManaModifier', 'Energy', 'percent'],
  ['characterManaRegen', 'Energy Regenerated per second', 'number'],
  ['characterManaRegenModifier', 'Energy Regeneration', 'percent'],
  ['characterOffensiveAbility', 'Offensive Ability', 'number'],
  ['characterOffensiveAbilityModifier', 'Offensive Ability', 'percent'],
  ['characterDefensiveAbility', 'Defensive Ability', 'number'],
  ['characterDefensiveAbilityModifier', 'Defensive Ability', 'percent'],
  ['characterAttackSpeedModifier', 'Attack Speed', 'percent'],
  ['characterSpellCastSpeedModifier', 'Cast Speed', 'percent'],
  ['characterRunSpeedModifier', 'Movement Speed', 'percent'],
  ['offensiveTotalDamageModifier', 'Total Damage', 'percent'],
  ['retaliationTotalDamageModifier', 'Retaliation Damage', 'percent'],
]
// item set fields hold up to 5 values, semicolon separated, one per equipped-piece-count threshold
const valueAt = (record: RecordMap, key: string, count: number): number => {
  const raw = record.get(key)
  if (!raw) return 0
  if (!raw.includes(';')) return count === 1 ? Number(raw) || 0 : 0
  const parts = raw.split(';')
  return Number(parts[Math.min(count, parts.length) - 1]) || 0
}
const attributesAt = (record: RecordMap, count: number): Array<{ label: string; value: string }> => {
  const attributes: Array<{ label: string; value: string }> = []
  const add = (label: string, value: string) => attributes.push({ label, value })
  for (const [key, label] of Object.entries(DAMAGE_TYPES)) {
    const minimum = valueAt(record, `${fieldName('offensive', key)}Min`, count)
    const maximum = valueAt(record, `${fieldName('offensive', key)}Max`, count)
    const modifier = valueAt(record, `${fieldName('offensive', key)}Modifier`, count)
    if (minimum || maximum)
      add(
        `${label} Damage`,
        minimum && maximum ? `${formatNumber(minimum)}-${formatNumber(maximum)}` : formatNumber(minimum || maximum),
      )
    if (modifier) add(`${label} Damage`, `${modifier > 0 ? '+' : ''}${formatNumber(modifier)}%`)
    const resistance = valueAt(record, fieldName('defensive', key), count)
    if (resistance) add(`${label} Resistance`, `${formatNumber(resistance)}%`)
  }
  const protection = valueAt(record, 'defensiveProtection', count)
  const bonusProtection = valueAt(record, 'defensiveBonusProtection', count)
  const absorption = valueAt(record, 'defensiveAbsorption', count)
  if (protection) add('Armor', formatNumber(protection))
  if (bonusProtection) add('Armor Bonus', `${bonusProtection > 0 ? '+' : ''}${formatNumber(bonusProtection)}`)
  if (absorption) add('Damage Absorption', `${formatNumber(absorption)}%`)
  for (const [key, label, format] of knownAttributes) {
    const value = valueAt(record, key, count)
    if (value)
      add(
        label,
        format === 'percent'
          ? `${value > 0 ? '+' : ''}${formatNumber(value)}%`
          : `${value > 0 ? '+' : ''}${formatNumber(value)}`,
      )
  }
  return attributes
}
const resolveSkillName = async (path: string): Promise<string> => {
  const record = await parse(resolve(root, path.replace(/^records\//, '')))
  const tag = record.get('skillDisplayName')
  return tag ? (tags.get(tag) ?? tag) : humanizeSkillIdentifier(path)
}

const sets = []
const directories = [resolve(root, 'items/lootsets'), resolve(root, 'items/awakened/lootsets')]
for (const directory of directories)
  for (const file of (await readdir(directory)).filter((name) => /^itemset_[a-z0-9]+\.dbr$/i.test(name))) {
    const record = await parse(join(directory, file))
    const members = (record.get('setMembers') ?? '')
      .split(';')
      .filter(Boolean)
      .map((path) => path.replace(/^records\//, 'data/game/records/'))
    if (!members.length) continue

    // granted mastery-skill points, e.g. augmentSkillName1/augmentSkillLevel1 for up to 4 skills, plus the class-training augment
    const skillBonusSources: Array<{ path: string; levels: string }> = []
    for (let index = 1; index <= 4; index += 1) {
      const path = record.get(`augmentSkillName${index}`)
      const levels = record.get(`augmentSkillLevel${index}`)
      if (path && levels) skillBonusSources.push({ path, levels })
    }
    const masteryPath = record.get('augmentMasteryName1')
    const masteryLevels = record.get('augmentMasteryLevel1')
    if (masteryPath && masteryLevels) skillBonusSources.push({ path: masteryPath, levels: masteryLevels })
    const skillBonusNames = await Promise.all(skillBonusSources.map((source) => resolveSkillName(source.path)))

    // a fully granted skill unlocked once enough pieces are equipped
    const itemSkillPath = record.get('itemSkillName')
    const itemSkillLevels = record.get('itemSkillLevel')
    let grantedSkill: { name: string; description: string } | undefined
    if (itemSkillPath && itemSkillLevels) {
      const skillRecord = await parse(resolve(root, itemSkillPath.replace(/^records\//, '')))
      const nameTag = skillRecord.get('skillDisplayName')
      const descriptionTag = skillRecord.get('skillBaseDescription')
      grantedSkill = {
        name: nameTag ? (tags.get(nameTag) ?? nameTag) : basename(itemSkillPath, '.dbr'),
        description: descriptionTag ? (tags.get(descriptionTag) ?? '') : '',
      }
    }

    const bonuses = []
    for (let count = 1; count <= Math.min(members.length, 5); count += 1) {
      const attributes = attributesAt(record, count)
      for (const [index, source] of skillBonusSources.entries()) {
        const levels = source.levels.split(';')
        const level = Number(levels[Math.min(count, levels.length) - 1]) || 0
        if (level)
          attributes.push({ label: 'Skill Bonus', value: `+${formatNumber(level)} to ${skillBonusNames[index]}` })
      }
      const itemSkillLevelParts = itemSkillLevels?.split(';') ?? []
      const skillLevel = Number(itemSkillLevelParts[Math.min(count, itemSkillLevelParts.length) - 1]) || 0
      if (!attributes.length && !(grantedSkill && skillLevel)) continue
      bonuses.push({
        count,
        attributes,
        skill: grantedSkill && skillLevel ? { ...grantedSkill, level: skillLevel } : undefined,
      })
    }
    if (!bonuses.length) continue

    const nameTag = record.get('setName')
    const descriptionTag = record.get('setDescription')
    sets.push({
      id: directory.replaceAll('\\', '/').includes('/awakened/')
        ? `awakened-${basename(file, '.dbr')}`
        : basename(file, '.dbr'),
      name: nameTag
        ? (tags.get(nameTag) ?? record.get('FileDescription') ?? basename(file, '.dbr'))
        : (record.get('FileDescription') ?? basename(file, '.dbr')),
      description: descriptionTag ? (tags.get(descriptionTag) ?? '') : '',
      members,
      bonuses,
    })
  }
await mkdir(resolve('public/data'), { recursive: true })
await writeFile(resolve('public/data/item-sets.json'), `${JSON.stringify(sets, null, 2)}\n`, 'utf8')
console.log(`Extracted ${sets.length} item sets`)
