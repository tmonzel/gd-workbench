import { mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import { basename, extname, join, relative, resolve } from 'node:path'
import { DAMAGE_OVER_TIME_TYPES, DAMAGE_TYPES, fieldName } from './damage-utils.js'

type Item = {
  id: string
  isMonsterInfrequent?: boolean
  name: string
  qualityTag?: string
  description: string
  category: string
  rarity: string
  level: number
  tier?: 'Mythical' | 'Awakened'
  image?: string
  twoHanded?: boolean
  attributes: Array<{ label: string; value: string | number }>
  stats: Record<string, string | number>
  grantedSkill?: {
    name: string
    description: string
    level: number
    attributes: Array<{ label: string; value: string | number }>
  }
}

type RawRecord = Record<string, unknown>

const inputPath = resolve(process.argv[2])
const outputPath = resolve(process.argv[3] ?? 'public/data/items.json')
const localizationPath = process.argv[4] ? resolve(process.argv[4]) : undefined

const textValue = (record: RawRecord, keys: string[], fallback: string) => {
  const key = keys.find((candidate) => {
    const value = record[candidate]
    return value !== undefined && value !== null && String(value).trim() !== ''
  })
  return key ? String(record[key]) : fallback
}

const stripTextFormatting = (value: string) => value.replace(/\^[a-z]/gi, '')

const numberValue = (record: RawRecord, keys: string[], fallback = 0) => {
  const value = Number(textValue(record, keys, String(fallback)))
  return Number.isFinite(value) ? value : fallback
}

const derivedRequirements = (record: RawRecord, fallbackId: string) => {
  const itemLevel = numberValue(record, ['itemLevel', 'levelRequirement', 'level'], 0)
  if (itemLevel <= 0) return {}
  const path = fallbackId.replaceAll('\\', '/').toLowerCase()
  const heavy = textValue(record, ['armorClassification'], '').toLowerCase() === 'heavy'
  const heavyBase = (multiplier: number, offset: number) =>
    (2.22 * (itemLevel * 6.55) ** 1.246 - 1.8 * (itemLevel * 5.84) ** 1.2785 + (itemLevel ** 1.5 * 0.0125 - 1) * -5) *
      multiplier +
    offset
  const lightBase = (multiplier: number, offset: number) =>
    (2.1 * (itemLevel * 6.55) ** 1.25 - 1.8 * (itemLevel * 5.84) ** 1.2785 + (itemLevel ** 1.5 * 0.0125 - 1) * -5) *
      multiplier +
    offset
  const casterDaggerBase =
    2.44 * (itemLevel * 6.55) ** 1.233 - 1.95 * (itemLevel * 5.84) ** 1.2785 + (itemLevel ** 1.5 * 0.0125 - 1) * -2 + 8
  const requirements: Record<string, number> = {}
  const setRequirement = (key: string, value: number) => {
    if (numberValue(record, [key], 0) <= 0) requirements[key] = Math.round(value)
  }

  if (/gear(head|torso|legs|hands|feet|shoulders)/.test(path)) {
    const multiplier = heavy ? 1.17 : path.includes('/gearhead/') || path.includes('/gearshoulders/') ? 0.8 : path.includes('/gearhands/') || path.includes('/gearfeet/') ? 0.56 : 0.98
    const offset = heavy ? 30 : path.includes('/gearhead/') || path.includes('/gearshoulders/') ? 7 : path.includes('/gearhands/') || path.includes('/gearfeet/') ? 10 : 12
    setRequirement('strengthRequirement', heavy ? heavyBase(multiplier, offset) : lightBase(multiplier, offset))
  } else if (path.includes('/gearweapons/caster/') || textValue(record, ['itemCostName'], '').includes('itemcostformulas_caster')) {
    if (path.includes('/dagger') || textValue(record, ['Class'], '').toLowerCase().includes('dagger')) {
      setRequirement('dexterityRequirement', casterDaggerBase * 0.8)
      setRequirement('intelligenceRequirement', casterDaggerBase)
    } else if (path.includes('/scepter') || textValue(record, ['Class'], '').toLowerCase().includes('scepter')) {
      setRequirement('intelligenceRequirement', casterDaggerBase)
      setRequirement('strengthRequirement', casterDaggerBase)
    }
  } else if (path.includes('/gearweapons/')) {
    if (path.includes('/swords1h/') || path.includes('/ranged1h/'))
      setRequirement('dexterityRequirement', 2.488 * (itemLevel * 6.55) ** 1.22 - 1.8 * (itemLevel * 5.84) ** 1.2785 + (itemLevel ** 1.5 * 0.0125 - 1) * -5 + 13)
    else if (path.includes('/guns2h/') || path.includes('/bows/'))
      setRequirement('dexterityRequirement', 2.5 * (itemLevel * 6.55) ** 1.22 - 1.8 * (itemLevel * 5.84) ** 1.2785 + (itemLevel ** 1.5 * 0.0125 - 1) * -5 + 25)
    else if (path.includes('/melee2h/'))
      setRequirement('strengthRequirement', 2.79 * (itemLevel * 6.55) ** 1.205 - 1.8 * (itemLevel * 5.84) ** 1.2785 + (itemLevel ** 1.5 * 0.0125 - 1) * -5 + 18)
    else if (path.includes('/axe1h/') || path.includes('/mace1h/'))
      setRequirement('strengthRequirement', 2.57 * (itemLevel * 6.55) ** 1.216 - 1.8 * (itemLevel * 5.84) ** 1.2785 + (itemLevel ** 1.5 * 0.0125 - 1) * -5 + 13)
  } else if (path.includes('/gearaccessories/rings/') || path.includes('/gearaccessories/necklaces/')) {
    setRequirement('intelligenceRequirement', 0.9 * (2 * (itemLevel * 6.5) ** 1.223 - 1.52 * (itemLevel * 5.8) ** 1.2785 + (itemLevel ** 1.5 / 150 - 1) * 15 + 11))
  }
  return requirements
}

const itemTypeFromPath = (filePath: string) => {
  const normalizedPath = filePath.replaceAll('\\', '/').toLowerCase()
  if (normalizedPath.includes('/gearrelic/')) return 'Relic'
  if (normalizedPath.includes('/materia/')) return 'Component'
  if (normalizedPath.includes('/enchants/')) return normalizedPath.includes('/runes/') ? 'Potion Modifier' : 'Augment'
  if (normalizedPath.includes('/crafting/consumables/')) return 'Consumable'
  if (normalizedPath.includes('/crafting/blueprints/')) return 'Blueprint'
  if (normalizedPath.includes('/questitems/')) return 'Quest Item'
  if (normalizedPath.includes('/loreobjects/')) return 'Lore Note'
  if (normalizedPath.includes('/misc/potions/')) return 'Potion Container'
  if (normalizedPath.includes('/gearweapons/shields/') || normalizedPath.includes('/gearweapons/focus/'))
    return 'Off-Hand'
  if (normalizedPath.includes('/gearweapons/')) return 'Weapon'
  if (normalizedPath.includes('/gearaccessories/medals/')) return 'Medal'
  if (normalizedPath.includes('/gearaccessories/necklaces/')) return 'Amulet'
  if (normalizedPath.includes('/gearaccessories/rings/')) return 'Ring'
  if (normalizedPath.includes('/gearaccessories/waist/')) return 'Belt'
  if (normalizedPath.includes('/gearhands/')) return 'Gloves'
  if (normalizedPath.includes('/geartorso/')) return 'Chest Armor'
  if (normalizedPath.includes('/gearlegs/')) return 'Pants'
  if (normalizedPath.includes('/gearhead/')) return 'Helm'
  if (normalizedPath.includes('/gearfeet/')) return 'Boots'
  if (normalizedPath.includes('/gearshoulders/')) return 'Shoulders'
  return 'Item'
}

const normalizeRarity = (value: string) => (value === 'Magical' ? 'Magic' : value)

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

// Skill records store one value per rank as "v1;v2;v3;..."; pick the rank we need.
const skillValueAt = (record: RawRecord, key: string, level: number): number => {
  const raw = record[key]
  if (typeof raw === 'number') return raw
  if (typeof raw !== 'string' || !raw) return 0
  if (!raw.includes(';')) return Number(raw) || 0
  const parts = raw.split(';')
  const index = Math.min(Math.max(level, 1), parts.length) - 1
  return Number(parts[index]) || 0
}

// itemSkillLevelEq is either a literal level or a small arithmetic expression using itemLevel.
const resolveSkillLevel = (equation: unknown, itemLevel: number): number => {
  if (typeof equation === 'number') return Math.max(1, Math.round(equation))
  if (typeof equation !== 'string' || !equation.trim()) return 1
  const expression = equation.replace(/itemlevel/gi, String(itemLevel))
  if (!/^[\d+\-*/.() ]+$/.test(expression)) return 1
  try {
    const value = new Function(`"use strict"; return (${expression});`)() as number
    return Number.isFinite(value) ? Math.max(1, Math.floor(value)) : 1
  } catch {
    return 1
  }
}

const grantedSkillAttributes = (
  skillRecord: RawRecord,
  level: number,
): Array<{ label: string; value: string | number }> => {
  const attributes: Array<{ label: string; value: string | number }> = []
  const add = (label: string, value: string | number) => attributes.push({ label, value })
  const at = (key: string) => skillValueAt(skillRecord, key, level)
  const atMax = (key: string) => skillValueAt(skillRecord, key.replace(/Min$/, 'Max'), level)
  const range = (minimum: number, maximum: number) =>
    minimum && maximum && minimum !== maximum
      ? `${formatNumber(minimum)}-${formatNumber(maximum)}`
      : formatNumber(minimum || maximum)
  for (const [key, label] of Object.entries(DAMAGE_TYPES)) {
    const minimum = at(`${fieldName('offensive', key)}Min`)
    const maximum = at(`${fieldName('offensive', key)}Max`)
    const modifier = at(`${fieldName('offensive', key)}Modifier`)
    if (minimum || maximum) {
      const damage =
        minimum && maximum ? `${formatNumber(minimum)}-${formatNumber(maximum)}` : formatNumber(minimum || maximum)
      add(`${label} Damage`, damage)
    }
    if (modifier) add(`${label} Damage`, `${modifier > 0 ? '+' : ''}${formatNumber(modifier)}%`)
    const retaliationMinimum = at(`${fieldName('retaliation', key)}Min`)
    const retaliationMaximum = at(`${fieldName('retaliation', key)}Max`)
    const retaliationModifier = at(`${fieldName('retaliation', key)}Modifier`)
    if (retaliationMinimum || retaliationMaximum)
      add(
        `${key === 'poison' ? 'Acid' : label} Retaliation Damage`,
        retaliationMinimum && retaliationMaximum
          ? `${formatNumber(retaliationMinimum)}-${formatNumber(retaliationMaximum)}`
          : formatNumber(retaliationMinimum || retaliationMaximum),
      )
    if (retaliationModifier)
      add(
        `${key === 'poison' ? 'Acid' : label} Retaliation Damage`,
        `${retaliationModifier > 0 ? '+' : ''}${formatNumber(retaliationModifier)}%`,
      )
  }

  for (const [key, label] of DAMAGE_OVER_TIME_TYPES) {
    const minimum = at(`offensiveSlow${key}Min`)
    const maximum = atMax(`offensiveSlow${key}Min`)
    const duration = at(`offensiveSlow${key}DurationMin`)
    if (minimum || maximum)
      add(`${label} Damage${duration ? ` over ${formatNumber(duration)} seconds` : ''}`, range(minimum, maximum))
  }

  const elementalMinimum = at('offensiveElementalMin')
  const elementalMaximum = at('offensiveElementalMax')
  if (elementalMinimum || elementalMaximum) add('Elemental Damage', range(elementalMinimum, elementalMaximum))

  const criticalDamageModifier = at('offensiveCritDamageModifier')
  if (criticalDamageModifier)
    add('Critical Damage', `${criticalDamageModifier > 0 ? '+' : ''}${formatNumber(criticalDamageModifier)}%`)

  const weaponDamagePct = at('weaponDamagePct')
  if (weaponDamagePct) add('Weapon Damage', `${formatNumber(weaponDamagePct)}%`)

  const targetRadius = at('projectileExplosionRadius') || at('skillTargetRadius')
  if (targetRadius) add('Meter Target Area', formatNumber(targetRadius))

  const stunChance = at('offensiveStunChance')
  const stunDuration = at('offensiveStunMin')
  if (stunChance) add('Stun Chance', `${formatNumber(stunChance)}%`)
  if (stunDuration) add('Stun Duration', `${formatNumber(stunDuration)} seconds`)

  const activeDuration = at('skillActiveDuration')
  if (activeDuration) add('Skill Duration', `${formatNumber(activeDuration)} seconds`)

  const lifeBonus = at('skillLifeBonus')
  const lifePercent = at('skillLifePercent')
  const manaPercent = at('skillManaPercent')
  const lifeRegen = at('characterLifeRegen')
  const manaRegenModifier = at('characterManaRegenModifier')
  const lifeMonitor = at('lifeMonitorPercent')
  if (lifeBonus) add('Health Restored', formatNumber(lifeBonus))
  if (lifePercent) add('Health Restored', `${formatNumber(lifePercent)}%`)
  if (manaPercent) add('Energy Restored', `${formatNumber(manaPercent)}%`)
  if (lifeRegen) add('Health Regeneration', formatNumber(lifeRegen))
  if (manaRegenModifier) add('Energy Regeneration', `${formatNumber(manaRegenModifier)}%`)
  if (lifeMonitor) add('Health Threshold', `${formatNumber(lifeMonitor)}%`)

  const resistanceReduction = at('offensiveTotalResistanceReductionPercentMin')
  const resistanceDuration = at('offensiveTotalResistanceReductionPercentDurationMin')
  if (resistanceReduction)
    add(
      `Reduced Target Resistances${resistanceDuration ? ` for ${formatNumber(resistanceDuration)} seconds` : ''}`,
      `${formatNumber(resistanceReduction)}%`,
    )

  for (const [key, label] of Object.entries(DAMAGE_TYPES)) {
    const resistance = at(`defensive${key[0].toUpperCase()}${key.slice(1)}`)
    if (resistance) add(`${label} Resistance`, `${resistance > 0 ? '+' : ''}${formatNumber(resistance)}%`)
  }
  const elementalResistance = at('defensiveElementalResistance')
  if (elementalResistance)
    add('Elemental Resistance', `${elementalResistance > 0 ? '+' : ''}${formatNumber(elementalResistance)}%`)

  const projectileCount = at('projectileLaunchNumber')
  if (projectileCount) add('Projectile(s)', formatNumber(projectileCount))

  const piercingChance = at('projectilePiercingChance')
  if (piercingChance) add('Chance to pass through Enemies', `${formatNumber(piercingChance)}%`)

  return attributes
}

const resolveGrantedSkill = async (
  stats: Record<string, string | number>,
  skillRecords: Map<string, RawRecord>,
  localization: Map<string, string>,
): Promise<Item['grantedSkill']> => {
  const skillPath = String(stats.itemSkillName ?? '').replaceAll('\\', '/')
  if (!skillPath) return undefined
  const skillRecord = skillRecords.get(skillPath)
  if (!skillRecord) return undefined
  const nameTag = typeof skillRecord.skillDisplayName === 'string' ? skillRecord.skillDisplayName : ''
  const name = nameTag ? (localization.get(nameTag) ?? nameTag) : ''
  if (!name) return undefined
  const descriptionTag = typeof skillRecord.skillBaseDescription === 'string' ? skillRecord.skillBaseDescription : ''
  const description = descriptionTag ? (localization.get(descriptionTag) ?? '') : ''
  const itemLevel = Number(stats.itemLevel ?? 1)
  const maxLevel = Number(skillRecord.skillMaxLevel ?? 0)
  const level = resolveSkillLevel(stats.itemSkillLevelEq, itemLevel)
  const clampedLevel = maxLevel > 0 ? Math.min(level, maxLevel) : level
  const attributes = grantedSkillAttributes(skillRecord, clampedLevel)
  const add = (label: string, value: string | number) => attributes.push({ label, value })
  if (nameTag === 'tagItemSkillC042Name') add('Chance on Default Attack', '20%')
  const manaCost = skillValueAt(skillRecord, 'skillManaCost', clampedLevel)
  const cooldown = skillValueAt(skillRecord, 'skillCooldownTime', clampedLevel)
  const petLimit = skillValueAt(skillRecord, 'petLimit', clampedLevel)
  if (manaCost) add('Energy Cost', formatNumber(manaCost))
  if (cooldown) add('Second Skill Recharge', formatNumber(cooldown))
  if (petLimit) add('Summon Limit', formatNumber(petLimit))
  const controllerPath = String(stats.itemSkillAutoController ?? '').replaceAll('\\', '/')
  if (controllerPath) {
    const controllerFile = resolve('data/game', controllerPath)
    const controller = parseDbr(await readFile(controllerFile, 'utf8'), controllerFile)
    const chance = Number(controller.chanceToRun ?? 0)
    if (chance) add('Chance on Attack', `${formatNumber(chance)}%`)
  }
  const targetRadius = skillValueAt(skillRecord, 'skillTargetRadius', clampedLevel)
  if (targetRadius) add('Meter Target Area', formatNumber(targetRadius))
  const poisonDamage = skillValueAt(skillRecord, 'offensiveSlowPoisonMin', clampedLevel)
  const poisonDuration = skillValueAt(skillRecord, 'offensiveSlowPoisonDurationMin', clampedLevel)
  if (poisonDamage) add(`Poison Damage over ${formatNumber(poisonDuration)} seconds`, formatNumber(poisonDamage))
  const resistanceReduction = skillValueAt(skillRecord, 'offensiveTotalResistanceReductionPercentMin', clampedLevel)
  const resistanceDuration = skillValueAt(
    skillRecord,
    'offensiveTotalResistanceReductionPercentDurationMin',
    clampedLevel,
  )
  if (resistanceReduction)
    add(
      `Reduced Target Resistances for ${formatNumber(resistanceDuration)} seconds`,
      `${formatNumber(resistanceReduction)}%`,
    )

  const spawnPath = String(skillRecord.spawnObjects ?? '')
    .split(';')
    .filter(Boolean)[0]
  const petRecord = spawnPath ? skillRecords.get(spawnPath) : undefined
  const equationPath = String(petRecord?.characterAttributeEquations ?? '').replaceAll('\\', '/')
  const equationRecord = equationPath ? skillRecords.get(equationPath) : undefined
  if (equationRecord) {
    const evaluate = (key: string) => {
      const expression = equationRecord[key]
      if (typeof expression !== 'string') return 0
      const normalized = expression
        .replaceAll('charLevel', '100')
        .replaceAll('elapsedTime', '1')
        .replaceAll('lifeRegen', '0')
        .replaceAll('manaRegen', '0')
        .replaceAll('manaRegenMod', '0')
        .replaceAll('^', '**')
      if (!/^[\d+*/().\s*-]+$/.test(normalized)) return 0
      try {
        const value = new Function(`"use strict"; return (${normalized});`)() as number
        return Number.isFinite(value) ? value : 0
      } catch {
        return 0
      }
    }
    const health = evaluate('characterLife')
    const energy = evaluate('characterMana')
    if (health) add(`${name} Health`, formatNumber(health))
    if (energy) add(`${name} Energy`, formatNumber(energy))
  }
  const petSkillPaths = petRecord?.skillName2 ? [String(petRecord.skillName2)] : []
  for (const petSkillPath of petSkillPaths) {
    const petSkill = skillRecords.get(petSkillPath)
    if (!petSkill) continue
    const petAttributes = grantedSkillAttributes(petSkill, 1)
    for (const attribute of petAttributes)
      if (/damage$/i.test(attribute.label)) add(`${name} ${attribute.label}`, attribute.value)
  }
  return { name, description, level: clampedLevel, attributes }
}

const gameAttributes = (
  stats: Record<string, string | number>,
  skillNames: Map<string, string>,
  localization: Map<string, string>,
): Array<{ label: string; value: string | number }> => {
  const attributes: Array<{ label: string; value: string | number }> = []
  const numeric = (key: string) => Number(stats[key] ?? 0)
  const add = (label: string, value: string | number) => attributes.push({ label, value })

  const speedTag = String(stats.characterBaseAttackSpeedTag ?? '')
  if (speedTag && !/notset$/i.test(speedTag)) {
    const speedLabel = (localization.get(speedTag) ?? '').replace(/^speed:\s*/i, '').trim()
    if (speedLabel) add('Weapon Speed', speedLabel)
  }

  for (const [key, label] of Object.entries(DAMAGE_TYPES)) {
    // weapons store their base damage range under an "offensiveBase..." prefix instead of "offensive..."
    const minimum = numeric(`${fieldName('offensive', key)}Min`) || numeric(`${fieldName('offensiveBase', key)}Min`)
    const maximum = numeric(`${fieldName('offensive', key)}Max`) || numeric(`${fieldName('offensiveBase', key)}Max`)
    const modifier = numeric(`${fieldName('offensive', key)}Modifier`)
    if (minimum || maximum) {
      const damage =
        minimum && maximum ? `${formatNumber(minimum)}-${formatNumber(maximum)}` : formatNumber(minimum || maximum)
      add(`${label} Damage`, damage)
    }
    if (modifier) add(`${label} Damage`, `${modifier > 0 ? '+' : ''}${formatNumber(modifier)}%`)
    const retaliationMinimum = numeric(`${fieldName('retaliation', key)}Min`)
    const retaliationMaximum = numeric(`${fieldName('retaliation', key)}Max`)
    const retaliationModifier = numeric(`${fieldName('retaliation', key)}Modifier`)
    const retaliationLabel = `${key === 'poison' ? 'Acid' : label} Retaliation Damage`
    if (retaliationMinimum || retaliationMaximum)
      add(
        retaliationLabel,
        retaliationMinimum && retaliationMaximum
          ? `${formatNumber(retaliationMinimum)}-${formatNumber(retaliationMaximum)}`
          : formatNumber(retaliationMinimum || retaliationMaximum),
      )
    if (retaliationModifier)
      add(retaliationLabel, `${retaliationModifier > 0 ? '+' : ''}${formatNumber(retaliationModifier)}%`)
  }

  const pierceRatio = numeric('offensivePierceRatioMin') || numeric('offensivePierceRatioMax')
  if (pierceRatio) add('Armor Piercing', `${formatNumber(pierceRatio)}%`)

  for (const [key, label] of DAMAGE_OVER_TIME_TYPES) {
    const modifier = numeric(`offensiveSlow${key}Modifier`)
    const duration = numeric(`offensiveSlow${key}DurationModifier`)
    if (!modifier) continue
    const value = `${modifier > 0 ? '+' : ''}${formatNumber(modifier)}%${duration ? ` with +${formatNumber(duration)}% Increased Duration` : ''}`
    add(`${key === 'Poison' ? 'Acid' : label} Damage`, value)
  }

  for (const suffix of ['', '2']) {
    const percentage = numeric(`conversionPercentage${suffix}`)
    const inType = String(stats[`conversionInType${suffix}`] ?? '')
    const outType = String(stats[`conversionOutType${suffix}`] ?? '')
    if (percentage && inType && outType)
      add('Damage Conversion', `${formatNumber(percentage)}% ${inType} Damage converted to ${outType} Damage`)
  }

  for (const [key, label] of Object.entries(DAMAGE_TYPES)) {
    const resistance = numeric(fieldName('defensive', key))
    const maximum = numeric(`${fieldName('defensive', key)}MaxResist`)
    if (resistance) add(`${label} Resistance`, `${formatNumber(resistance)}%`)
    if (maximum) add(`Maximum ${label} Resistance`, `+${formatNumber(maximum)}%`)
  }

  const allResistance = numeric('defensiveAllResistance')
  const elementalResistance = numeric('defensiveElementalResistance')
  if (allResistance) add('All Resistances', `${formatNumber(allResistance)}%`)
  if (elementalResistance) add('Elemental Resistance', `${formatNumber(elementalResistance)}%`)

  const protection = numeric('defensiveProtection')
  const bonusProtection = numeric('defensiveBonusProtection')
  const absorption = numeric('defensiveAbsorption')
  if (protection) add('Armor', formatNumber(protection))
  if (bonusProtection) add('Armor Bonus', `${bonusProtection > 0 ? '+' : ''}${formatNumber(bonusProtection)}`)
  if (absorption) add('Damage Absorption', `${formatNumber(absorption)}%`)

  const block = numeric('defensiveBlock')
  const blockChance = numeric('defensiveBlockChance')
  const blockAmountModifier = numeric('defensiveBlockAmountModifier')
  const blockAbsorption = numeric('blockAbsorption')
  const blockRecovery = numeric('blockRecoveryTime')
  if (block) add('Shield Block', formatNumber(block))
  if (blockChance) add('Block Chance', `${formatNumber(blockChance)}%`)
  if (blockAmountModifier)
    add('Block Amount Bonus', `${blockAmountModifier > 0 ? '+' : ''}${formatNumber(blockAmountModifier)}`)
  if (blockAbsorption) add('Block Damage Absorption', `${formatNumber(blockAbsorption)}%`)
  if (blockRecovery) add('Block Recovery', `${formatNumber(blockRecovery)}s`)

  const knownAttributes: Array<[string, string, string]> = [
    ['characterStrength', 'Physique', 'number'],
    ['characterDexterity', 'Cunning', 'number'],
    ['characterIntelligence', 'Spirit', 'number'],
    ['characterLife', 'Health', 'number'],
    ['characterLifeRegen', 'Health Regeneration', 'number'],
    ['characterMana', 'Energy', 'number'],
    ['characterManaRegen', 'Energy Regeneration', 'number'],
    ['characterOffensiveAbility', 'Offensive Ability', 'number'],
    ['characterDefensiveAbility', 'Defensive Ability', 'number'],
    ['characterAttackSpeedModifier', 'Attack Speed', 'percent'],
    ['characterAttackSpeedMaxModifier', 'Attack Speed', 'percent'],
    ['characterCastSpeedModifier', 'Cast Speed', 'percent'],
    ['characterSpellCastSpeedMaxModifier', 'Cast Speed', 'percent'],
    ['characterMovementSpeedModifier', 'Movement Speed', 'percent'],
    ['characterTotalSpeedModifier', 'Total Speed', 'percent'],
    ['characterOffensiveAbilityModifier', 'Offensive Ability', 'percent'],
    ['offensiveLifeLeechMin', 'Attack Damage Converted to Health', 'percent'],
    ['offensiveTotalDamageModifier', 'Total Damage', 'percent'],
    ['retaliationTotalDamageModifier', 'Retaliation Damage', 'percent'],
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
    const skillName = skillNames.get(skillPath.replaceAll('\\', '/')) ?? humanizeSkillIdentifier(skillPath)
    add('Skill Bonus', `+${formatNumber(skillLevel)} to ${skillName}`)
  }

  return attributes
}

const imagePath = (record: RawRecord): string | undefined => {
  const value = textValue(
    record,
    [
      'image',
      'imagePath',
      'itemBitmap',
      'bitmap',
      'relicBitmap',
      'shardBitmap',
      'artifactBitmap',
      'artifactFormulaBitmapName',
    ],
    '',
  )
  if (!value) return undefined
  const normalized = value.replaceAll('\\', '/').replace(/^\/+/, '')
  if (normalized.startsWith('items/') && /\.tex$/i.test(normalized))
    return `/assets/${normalized.replace(/\.tex$/i, '.webp')}`
  return undefined
}

const normalize = async (
  record: RawRecord,
  fallbackId: string,
  localization: Map<string, string>,
  skillNames: Map<string, string>,
  skillRecords: Map<string, RawRecord>,
): Promise<Item> => {
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
  const tier: Item['tier'] = /(^|\/)awakened(\/|$)/.test(fallbackId)
    ? 'Awakened'
    : /(^|\/)upgraded(\/|$)/.test(fallbackId)
      ? 'Mythical'
      : undefined
  const isMonsterInfrequent =
    /(^|\/)items\/gear[^/]*\/(?:.*\/)?b\d{3,}[^/]*\.dbr$/i.test(fallbackId) && !/^b000/i.test(basename(fallbackId))
  const twoHanded = /\/gearweapons\/(melee2h|guns2h)\//i.test(fallbackId) || undefined
  // The game combines style and quality/material tags with the base item name unless the item opts out.
  const qualityTag = textValue(record, ['itemQualityTag'], '')
  const styleTag = textValue(record, ['itemStyleTag'], '')
  const hidesPrefix = numberValue(record, ['hidePrefixName'], 0) === 1
  const resolvedQualityTag = !hidesPrefix
    ? [styleTag, qualityTag]
        .map((tag) => (tag ? localization.get(tag) ?? '' : ''))
        .filter(Boolean)
        .join(' ') || undefined
    : undefined
  const resolvedName = stripTextFormatting(localization.get(rawName) ?? rawName)
  Object.assign(stats, derivedRequirements(record, fallbackId))
  // Drop zero/blank fields from the output; gameAttributes already read the full stats above.
  const trimmedStats = Object.fromEntries(
    Object.entries(stats).filter(([, value]) => (typeof value === 'number' ? value !== 0 : value.trim() !== '')),
  )
  return {
    id: textValue(record, ['id', 'record', 'path'], fallbackId),
    name: resolvedName,
    qualityTag: resolvedQualityTag,
    tier,
    isMonsterInfrequent,
    twoHanded,
    description: stripTextFormatting(localization.get(rawDescription) ?? rawDescription),
    category: itemTypeFromPath(fallbackId),
    rarity: normalizeRarity(textValue(record, ['rarity', 'quality', 'itemClassification'], 'Common')),
    level: numberValue(record, ['level', 'itemLevel', 'requiredLevel', 'levelRequirement']),
    image: imagePath(record),
    attributes: gameAttributes(stats, skillNames, localization),
    stats: trimmedStats,
    grantedSkill: await resolveGrantedSkill(stats, skillRecords, localization),
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

const readSkillData = async (
  path: string,
  localization: Map<string, string>,
): Promise<{ names: Map<string, string>; records: Map<string, RawRecord> }> => {
  const names = new Map<string, string>()
  const records = new Map<string, RawRecord>()
  for (const record of await readRecords(path).catch(() => [])) {
    const id = typeof record.id === 'string' ? record.id.replaceAll('\\', '/') : ''
    if (!id) continue
    const relativeIndex = id.indexOf('records/skills/')
    const relativeId = relativeIndex >= 0 ? id.slice(relativeIndex) : id
    records.set(id, record)
    records.set(relativeId, record)
    const tag = typeof record.skillDisplayName === 'string' ? record.skillDisplayName : ''
    if (!tag) continue
    const name = localization.get(tag) ?? tag
    names.set(id, name)
    names.set(relativeId, name)
  }
  return { names, records }
}

const records = await readRecords(inputPath)
const playerRecords = records.filter((record) => {
  const id = typeof record.id === 'string' ? record.id.replaceAll('\\', '/') : ''
  const description = typeof record.FileDescription === 'string' ? record.FileDescription : ''
  return !/(^|\/)items\/enemygear\//i.test(id) && !/^BASE BLANK MI\b/i.test(description)
})
const localization = await readLocalization(localizationPath)
const { names: skillNames, records: skillRecords } = await readSkillData(
  resolve('data/game/records/skills'),
  localization,
)
const items = await Promise.all(
  playerRecords.map(async (record, index) => {
    const recordId =
      typeof record.id === 'string'
        ? relative(process.cwd(), record.id).replaceAll('\\', '/')
        : `${inputPath}#${index + 1}`
    return normalize({ ...record, id: recordId }, recordId, localization, skillNames, skillRecords)
  }),
)
await mkdir(join(outputPath, '..'), { recursive: true })
const outputDirectory = join(outputPath, '..')
await rm(join(outputDirectory, 'item-pages'), { recursive: true, force: true })
await writeFile(outputPath, `${JSON.stringify(items)}\n`, 'utf8')
console.log(`Imported ${items.length} player items from ${inputPath}`)
console.log(`Wrote one item database to ${outputPath}`)
if (localizationPath) console.log(`Resolved ${localization.size} localization tags from ${localizationPath}`)
console.log(`Wrote ${outputPath}`)
