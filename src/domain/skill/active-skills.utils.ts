import type { Character } from '@/domain/hero/types'
import type { EquippedSetInfo } from '@/domain/item/types'
import type { DevotionData } from '@/domain/devotion/types'
import type { Mastery, MasterySkill } from '@/domain/skill/types'
import {
  getCharacterAttributeTotals,
  getDamageTypeModifierPercent,
  applyArmorPiercingConversion,
  getWeaponArmorPiercingPercent,
} from '@/domain/skill/damage.utils'
import { formatSkillEffect, formatSkillValue, isChanceTriggeredSkill } from '@/domain/skill/skill.utils'
import { parseDamageValue } from '@/domain/skill/damage.utils'

export type SkillDamageRow = {
  type: string
  label: string
  min: number
  max: number
  percent: number
  totalMin: number
  totalMax: number
}

export type SkillEntry = {
  name: string
  level: number
  allocatedLevel?: number
  bonusLevel?: number
  source: string
  stats: string[]
  damageRows?: SkillDamageRow[]
  icon?: string
  isPassive?: boolean
  isProc?: boolean
  isToggleable?: boolean
  toggleSkillId?: string
  enabled?: boolean
  children?: SkillEntry[]
}

type ActiveSkillsInput = {
  character: Character
  itemSkillBonuses: Record<string, number>
  skillsets: Record<string, MasterySkill[]>
  devotions?: DevotionData | null
  selectedDevotions: string[]
  equippedSetInfo: EquippedSetInfo[]
  masteries: Mastery[]
}

export const getActiveSkills = ({
  character,
  itemSkillBonuses,
  skillsets,
  devotions,
  selectedDevotions,
  equippedSetInfo,
  masteries,
}: ActiveSkillsInput): SkillEntry[] => {
  const entries = new Map<
    string,
    {
      level: number
      allocatedLevel?: number
      bonusLevel?: number
      sources: Set<string>
      stats: Set<string>
      damageRows: Map<string, SkillDamageRow>
      icon?: string
      isPassive?: boolean
      isProc?: boolean
      isToggleable?: boolean
      toggleSkillId?: string
      enabled?: boolean
      parentSkillName?: string
    }
  >()
  const masteryLevels = new Map<string, number>()
  const masteryIcons = new Map<string, string>()
  const excludedSkillNames = new Set<string>()
  const disabledToggleNames = new Set(
    Object.values(skillsets)
      .flat()
      .filter((skill) =>
        isChanceTriggeredSkill(skill)
          ? !character.enabledProcSkills?.includes(skill.id)
          : skill.isPassive && character.disabledPassiveSkills?.includes(skill.id),
      )
      .map((skill) => skill.name),
  )
  const weaponDamage = new Map<string, { min: number; max: number }>()
  for (const attribute of character.equipment.Weapon?.attributes ?? []) {
    const match = /^(Physical|Fire|Cold|Lightning|Poison|Piercing|Bleeding|Aether|Chaos|Vitality) Damage$/i.exec(
      attribute.label,
    )
    if (!match || /%$/.test(String(attribute.value))) continue
    const values = String(attribute.value).match(/^([+-]?\d+(?:\.\d+)?)(?:-([+-]?\d+(?:\.\d+)?))?$/)
    if (!values) continue
    const type = `${match[1][0].toUpperCase()}${match[1].slice(1)}`
    weaponDamage.set(type, { min: Number(values[1]), max: Number(values[2] ?? values[1]) })
  }
  // Apply the same item, devotion, set, and attribute damage bonuses used by DamagePanel.
  const { cunning, spirit } = getCharacterAttributeTotals(character, masteries)
  const sourceAttributes: Array<{ label: string; value: string }> = []
  for (const item of Object.values(character.equipment))
    for (const attribute of item?.attributes ?? [])
      sourceAttributes.push({ label: attribute.label, value: String(attribute.value) })
  for (const constellation of devotions?.constellations ?? [])
    for (const skill of constellation.skills) {
      if (!selectedDevotions.includes(skill.id)) continue
      for (const attribute of skill.attributes) sourceAttributes.push(attribute)
    }
  for (const { activeTier } of equippedSetInfo)
    for (const attribute of activeTier?.attributes ?? []) sourceAttributes.push(attribute)
  const damageModifierPercent = new Map<string, number>()
  const getDamageModifierPercent = (type: string) => {
    if (!damageModifierPercent.has(type))
      damageModifierPercent.set(type, getDamageTypeModifierPercent(type, false, sourceAttributes, cunning, spirit))
    return damageModifierPercent.get(type) ?? 0
  }
  const armorPiercingPercent = getWeaponArmorPiercingPercent(character.equipment.Weapon?.attributes)
  for (const skills of Object.values(skillsets))
    for (const skill of skills) {
      masteryLevels.set(skill.name, character.skillLevels[skill.id] ?? 0)
      if (skill.icon) masteryIcons.set(skill.name, skill.icon)
      if (skill.isModifier || skill.isTransmuter) excludedSkillNames.add(skill.name)
    }
  const addSkill = (
    name: string,
    level: number,
    source: string,
    stats: string[] = [],
    icon?: string,
    includeModifier = false,
  ) => {
    if (!name || !level || (excludedSkillNames.has(name) && !includeModifier)) return
    const entry = entries.get(name) ?? {
      level: 0,
      sources: new Set<string>(),
      stats: new Set<string>(),
      damageRows: new Map<string, SkillDamageRow>(),
    }
    entry.level = Math.max(entry.level, level)
    entry.icon ??= icon ?? masteryIcons.get(name)
    entry.sources.add(source)
    for (const stat of stats) entry.stats.add(stat)
    entries.set(name, entry)
  }
  for (const item of Object.values(character.equipment)) {
    if (!item) continue
    if (
      item.grantedSkill &&
      !disabledToggleNames.has(item.grantedSkill.name) &&
      (!masteryLevels.has(item.grantedSkill.name) || (masteryLevels.get(item.grantedSkill.name) ?? 0) > 0)
    ) {
      addSkill(
        item.grantedSkill.name,
        item.grantedSkill.level,
        item.name,
        item.grantedSkill.attributes.map((attribute) => `${attribute.value} ${attribute.label}`),
        item.grantedSkill.icon,
      )
      for (const subSkill of item.grantedSkill.subSkills ?? []) {
        const subSkillStats = subSkill.attributes.map((attribute) => `${attribute.value} ${attribute.label}`)
        const subSkillName = subSkill.name
        addSkill(subSkillName, subSkill.level, `Spawned by ${item.grantedSkill.name}`, subSkillStats, subSkill.icon)
        const subSkillEntry = entries.get(subSkillName)
        if (!subSkillEntry) continue
        for (const attribute of subSkill.attributes) {
          const match = /^(Physical|Fire|Cold|Lightning|Poison|Piercing|Bleeding|Aether|Chaos|Vitality) Damage$/i.exec(
            attribute.label,
          )
          if (!match) continue
          const parsed = parseDamageValue(String(attribute.value))
          if (!parsed.min && !parsed.max) continue
          const type = `${match[1][0].toUpperCase()}${match[1].slice(1)}`
          const modifierPercent = getDamageModifierPercent(type)
          subSkillEntry.damageRows.set(`${type}-${attribute.label}`, {
            type,
            label: type === 'Poison' ? 'Poison Damage' : `${type} Damage`,
            min: parsed.min,
            max: parsed.max,
            percent: modifierPercent,
            totalMin: parsed.min * (1 + modifierPercent / 100),
            totalMax: parsed.max * (1 + modifierPercent / 100),
          })
        }
      }
    }
  }
  for (const masteryId of [character.mastery1, character.mastery2])
    for (const skill of skillsets[masteryId ?? ''] ?? []) {
      if (skill.isModifier || skill.isTransmuter) continue
      const isProc = isChanceTriggeredSkill(skill)
      const skillEnabled = isProc
        ? character.enabledProcSkills?.includes(skill.id) ?? false
        : !character.disabledPassiveSkills?.includes(skill.id)
      const allocatedLevel = character.skillLevels[skill.id] ?? 0
      if (allocatedLevel <= 0) continue
      const bonusLevel = itemSkillBonuses[skill.name] ?? 0
      const effectiveLevel = allocatedLevel + bonusLevel
      const activeModifiers = (skillsets[masteryId ?? ''] ?? []).filter(
        (modifier) =>
          modifier.groupId === skill.groupId &&
          (modifier.isModifier || modifier.isTransmuter) &&
          ((character.skillLevels[modifier.id] ?? 0) > 0 || (itemSkillBonuses[modifier.name] ?? 0) > 0),
      )
      const convertsAllLightningToAether = activeModifiers.some((modifier) =>
        modifier.effects.some(
          (effect) =>
            effect.key === 'conversionPercentage' &&
            effect.label === 'Lightning Damage converted to Aether Damage' &&
            effect.values.includes(100),
        ),
      )
      const totalDamageMultiplier =
        1 +
        activeModifiers.reduce(
          (total, modifier) =>
            total +
            modifier.effects
              .filter((effect) => effect.key === 'offensiveDamageMultModifier')
              .reduce((sum, effect) => {
                const modifierLevel =
                  (character.skillLevels[modifier.id] ?? 0) + (itemSkillBonuses[modifier.name] ?? 0)
                return sum + (effect.values[Math.min(modifierLevel, effect.values.length) - 1] ?? 0)
              }, 0) /
              100,
          0,
        )
      const damageRows: SkillDamageRow[] = []
      let weaponDamagePercent = 0
      const stats = skill.effects
        .filter(
          (effect) =>
            effect.key !== 'offensiveDamageMultModifier' &&
            !(convertsAllLightningToAether && /electrocute|slowLightning/i.test(`${effect.key} ${effect.label}`)),
        )
        .map((effect) => {
          const rawValue = effect.values[Math.min(effectiveLevel, effect.values.length) - 1]
          const isDamage =
            /^(offensive|weaponDamagePct|retaliation)/i.test(effect.key) &&
            effect.key !== 'offensiveTotalDamageModifier' &&
            effect.key !== 'offensiveDamageMultModifier'
          const isWeaponDamage = effect.key === 'weaponDamagePct'
          if (isDamage) {
            const typeMatch = `${effect.key} ${effect.label}`.match(
              /(?:offensive(?:Base)?|retaliation|weaponDamagePct)?(Physical|Fire|Cold|Lightning|Poison|Piercing|Bleeding|Aether|Chaos|Vitality)\s*Damage?/i,
            )
            const type = typeMatch
              ? `${typeMatch[1][0].toUpperCase()}${typeMatch[1].slice(1)}`
              : isWeaponDamage
                ? 'Physical'
                : undefined
            const damageType = convertsAllLightningToAether && type === 'Lightning' ? 'Aether' : type
            if (isWeaponDamage) weaponDamagePercent += rawValue
            const min =
              effect.minValues?.[Math.min(effectiveLevel, effect.minValues.length) - 1] ??
              (isWeaponDamage ? 0 : rawValue)
            const hasRangeMaxValues =
              (effect.maxValues?.length ?? 0) >= (effect.minValues?.length ?? effect.values.length)
            const max = hasRangeMaxValues
              ? effect.maxValues![Math.min(effectiveLevel, effect.maxValues!.length) - 1]
              : isWeaponDamage
                ? 0
                : min
            if (!isWeaponDamage && damageType) {
              const modifierPercent = getDamageModifierPercent(damageType)
              const flatMultiplier = (1 + modifierPercent / 100) * totalDamageMultiplier
              damageRows.push({
                type: damageType,
                label: damageType === 'Poison' ? 'Poison Damage' : `${damageType} Damage`,
                min,
                max,
                percent: modifierPercent,
                totalMin: min * flatMultiplier,
                totalMax: max * flatMultiplier,
              })
            }
          }
          if (isWeaponDamage) return rawValue ? `${formatSkillValue(rawValue)}% Weapon Damage` : ''
          const label = convertsAllLightningToAether && /lightning/i.test(effect.key)
            ? effect.label.replace(/Lightning/gi, 'Aether')
            : effect.label
          const value = isDamage ? rawValue * totalDamageMultiplier : rawValue
          if (!Number.isFinite(value) || value === 0) return ''
          const formatted = formatSkillEffect(
            { ...effect, value: rawValue },
            effectiveLevel,
            isDamage ? totalDamageMultiplier : 1,
            label,
          )
          return (effect.key.startsWith('character') || effect.key === 'offensiveTotalDamageModifier') && rawValue > 0
            ? `+${formatted}`
            : formatted
        })
        .filter(Boolean)
      for (const summon of skill.summonEffects) {
        const summonStats: string[] = []
        const summonDamageRows: SkillDamageRow[] = []
        for (const effect of summon.effects) {
          const value = effect.values[Math.min(effectiveLevel, effect.values.length) - 1]
          if (!Number.isFinite(value) || value === 0) continue
          const isDamage = /^(offensive|weaponDamagePct|retaliation)/i.test(effect.key)
          const typeMatch = `${effect.key} ${effect.label}`.match(
            /(?:offensive(?:Base)?|retaliation|weaponDamagePct)?(Physical|Fire|Cold|Lightning|Poison|Piercing|Bleeding|Aether|Chaos|Vitality)\s*Damage?/i,
          )
          const type = typeMatch ? `${typeMatch[1][0].toUpperCase()}${typeMatch[1].slice(1)}` : undefined
          const damageType = convertsAllLightningToAether && type === 'Lightning' ? 'Aether' : type
          if (isDamage && damageType) {
            const min = effect.minValues?.[Math.min(effectiveLevel, effect.minValues.length) - 1] ?? value
            const max = effect.maxValues?.[Math.min(effectiveLevel, effect.maxValues.length) - 1] ?? min
            const modifierPercent = getDamageModifierPercent(damageType)
            const flatMultiplier = (1 + modifierPercent / 100) * totalDamageMultiplier
            summonDamageRows.push({
              type: damageType,
              label: damageType === 'Poison' ? 'Poison Damage' : `${damageType} Damage`,
              min,
              max,
              percent: modifierPercent,
              totalMin: min * flatMultiplier,
              totalMax: max * flatMultiplier,
            })
          }
          const label = convertsAllLightningToAether && /lightning/i.test(effect.label)
            ? effect.label.replace(/Lightning/gi, 'Aether')
            : effect.label
          summonStats.push(`${formatSkillValue(value)}${effect.suffix ?? ''} ${label}`)
        }
        const summonEntryName = summon.name
        addSkill(summonEntryName, effectiveLevel, `Spawned by ${skill.name}`, summonStats, skill.icon)
        const summonEntry = entries.get(summonEntryName)
        if (summonEntry) {
          summonEntry.allocatedLevel = Math.max(summonEntry.allocatedLevel ?? 0, allocatedLevel)
          summonEntry.bonusLevel = Math.max(summonEntry.bonusLevel ?? 0, bonusLevel)
          for (const row of applyArmorPiercingConversion(summonDamageRows, armorPiercingPercent))
            summonEntry.damageRows.set(`${row.type}-${row.label}`, row)
        }
      }
      for (const modifier of activeModifiers) {
        if (modifier.isTransmuter) continue
        const modifierLevel = (character.skillLevels[modifier.id] ?? 0) + (itemSkillBonuses[modifier.name] ?? 0)
        const modifierStats: string[] = []
        const modifierDamageRows: SkillDamageRow[] = []
        for (const effect of modifier.effects) {
          const rawValue = effect.values[Math.min(modifierLevel, effect.values.length) - 1]
          if (!Number.isFinite(rawValue) || rawValue === 0) continue
          const isDamage =
            /^(offensive|weaponDamagePct|retaliation)/i.test(effect.key) &&
            effect.key !== 'offensiveTotalDamageModifier' &&
            effect.key !== 'offensiveDamageMultModifier'
          const typeMatch = `${effect.key} ${effect.label}`.match(
            /(?:offensive(?:Base)?|retaliation|weaponDamagePct)?(Physical|Fire|Cold|Lightning|Poison|Piercing|Bleeding|Aether|Chaos|Vitality)\s*Damage?/i,
          )
          const type = typeMatch ? `${typeMatch[1][0].toUpperCase()}${typeMatch[1].slice(1)}` : undefined
          const damageType = convertsAllLightningToAether && type === 'Lightning' ? 'Aether' : type
          if (isDamage && damageType) {
            const min = effect.minValues?.[Math.min(modifierLevel, effect.minValues.length) - 1] ?? rawValue
            const max = effect.maxValues?.[Math.min(modifierLevel, effect.maxValues.length) - 1] ?? min
            const modifierPercent = getDamageModifierPercent(damageType)
            const flatMultiplier = (1 + modifierPercent / 100) * totalDamageMultiplier
            modifierDamageRows.push({
              type: damageType,
              label: damageType === 'Poison' ? 'Poison Damage' : `${damageType} Damage`,
              min,
              max,
              percent: modifierPercent,
              totalMin: min * flatMultiplier,
              totalMax: max * flatMultiplier,
            })
          }
          const label = convertsAllLightningToAether && /lightning/i.test(effect.label)
            ? effect.label.replace(/Lightning/gi, 'Aether')
            : effect.label
          modifierStats.push(formatSkillEffect({ ...effect, value: rawValue }, modifierLevel, isDamage ? totalDamageMultiplier : 1, label))
        }
        addSkill(modifier.name, modifierLevel, `Modifier of ${skill.name}`, modifierStats, modifier.icon, true)
        const modifierEntry = entries.get(modifier.name)
        if (modifierEntry) {
          modifierEntry.parentSkillName = skill.name
          modifierEntry.allocatedLevel = Math.max(modifierEntry.allocatedLevel ?? 0, character.skillLevels[modifier.id] ?? 0)
          modifierEntry.bonusLevel = Math.max(modifierEntry.bonusLevel ?? 0, itemSkillBonuses[modifier.name] ?? 0)
          for (const row of applyArmorPiercingConversion(modifierDamageRows, armorPiercingPercent))
            modifierEntry.damageRows.set(`${row.type}-${row.label}`, row)
        }
      }
      for (const modifier of activeModifiers)
        for (const effect of modifier.effects.filter((candidate) => candidate.key === 'offensiveDamageMultModifier')) {
          const modifierLevel = (character.skillLevels[modifier.id] ?? 0) + (itemSkillBonuses[modifier.name] ?? 0)
          const value = effect.values[Math.min(modifierLevel, effect.values.length) - 1]
          if (Number.isFinite(value) && value !== 0)
            stats.push(`Total Damage Modified by ${formatSkillValue(value)}% (${modifier.name})`)
        }
      if (weaponDamagePercent > 0) {
        for (const [type, weapon] of weaponDamage) {
          const existing = damageRows.find((row) => row.type === type)
          const modifierPercent = getDamageModifierPercent(type)
          const flatMultiplier = (1 + modifierPercent / 100) * totalDamageMultiplier
          const weaponMin = weapon.min * flatMultiplier * (weaponDamagePercent / 100)
          const weaponMax = weapon.max * flatMultiplier * (weaponDamagePercent / 100)
          if (existing) {
            existing.min += weapon.min
            existing.max += weapon.max
            existing.totalMin += weaponMin
            existing.totalMax += weaponMax
          } else {
            damageRows.push({
              type,
              label: `${type} Damage`,
              min: weapon.min,
              max: weapon.max,
              percent: modifierPercent,
              totalMin: weaponMin,
              totalMax: weaponMax,
            })
          }
        }
      }
      addSkill(skill.name, effectiveLevel, 'Mastery', stats, skill.icon)
      const entry = entries.get(skill.name)
      if (entry) {
        entry.allocatedLevel = Math.max(entry.allocatedLevel ?? 0, allocatedLevel)
        entry.bonusLevel = Math.max(entry.bonusLevel ?? 0, bonusLevel)
      }
      if (entry && (skill.isPassive || isProc)) {
        entry.isPassive = skill.isPassive
        entry.isProc = isProc
        entry.isToggleable = true
        entry.toggleSkillId = skill.id
        entry.enabled = skillEnabled
      }
      const convertedDamageRows = applyArmorPiercingConversion(damageRows, armorPiercingPercent).map((row) => ({
        ...row,
        label: row.type === 'Piercing' ? 'Piercing Damage' : row.label,
      }))
      if (entry) for (const row of convertedDamageRows) entry.damageRows.set(`${row.type}-${row.label}`, row)
    }
  const flatEntries = [...entries.entries()].map(([name, entry]) => ({
      name,
      level: entry.level,
      allocatedLevel: entry.allocatedLevel,
      bonusLevel: entry.bonusLevel,
      source: [...entry.sources].join(' + '),
      stats: [...entry.stats],
      damageRows: [...entry.damageRows.values()],
      icon: entry.icon,
      isPassive: entry.isPassive,
      isProc: entry.isProc,
      isToggleable: entry.isToggleable,
      toggleSkillId: entry.toggleSkillId,
      enabled: entry.enabled,
      parentSkillName: entry.parentSkillName,
    }))
  return flatEntries
    .filter((entry) => !entry.parentSkillName)
    .map((entry) => ({
      ...entry,
      children: flatEntries
        .filter((child) => child.parentSkillName === entry.name)
        .map((child) => child),
    }))
    .sort((left, right) => left.name.localeCompare(right.name))
}
