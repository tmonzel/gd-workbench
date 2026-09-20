import type { Character } from '@/domain/hero/types'

export type AttributeTotals = { physique: number; cunning: number; spirit: number }
export type MasteryProgression = { id: string; progression?: Record<string, number[]> }

// values are either a flat number, a "min-max" range, or a "+X%" modifier
export const parseDamageValue = (raw: string) => {
  const text = raw.trim()
  const percentMatch = /^([+-]?\d+(\.\d+)?)%$/.exec(text)
  if (percentMatch) return { min: 0, max: 0, percent: Number(percentMatch[1]) }
  const rangeMatch = /^([+-]?\d+(\.\d+)?)-(\d+(\.\d+)?)$/.exec(text)
  if (rangeMatch) return { min: Number(rangeMatch[1]), max: Number(rangeMatch[3]), percent: 0 }
  const flatMatch = /^([+-]?\d+(\.\d+)?)$/.exec(text)
  if (flatMatch) {
    const value = Number(flatMatch[1])
    return { min: value, max: value, percent: 0 }
  }
  return { min: 0, max: 0, percent: 0 }
}

export const getCharacterAttributeTotals = (character: Character, masteries: MasteryProgression[]): AttributeTotals => {
  const totals: Record<string, number> = {}
  for (const masteryId of [character.mastery1, character.mastery2]) {
    const rank = character.masteryLevels[masteryId ?? ''] ?? 0
    const progression = masteries.find((mastery) => mastery.id === masteryId)?.progression
    if (!progression || rank < 1) continue
    for (const [label, values] of Object.entries(progression))
      totals[label] = (totals[label] ?? 0) + (values[Math.min(rank, values.length) - 1] ?? 0)
  }
  return {
    physique: character.physique + (totals.Physique ?? 0),
    cunning: character.cunning + (totals.Cunning ?? 0),
    spirit: character.spirit + (totals.Spirit ?? 0),
  }
}

// matches physicalDamageEquation/pierceDamageEquation/physicalDurationDamageEquation/
// magicalDamageEquation/magicalDurationDamageEquation in data/game/records/game/combatformulas.dbr
export const getAttributeDamageMultiplier = (
  damageType: string,
  damageOverTime: boolean,
  cunning: number,
  spirit: number,
): number => {
  switch (damageType) {
    case 'Physical':
    case 'Piercing':
      return cunning / 245
    case 'Bleeding':
      return cunning / 215
    case 'Fire':
    case 'Cold':
    case 'Lightning':
    case 'Poison':
    case 'Aether':
    case 'Chaos':
    case 'Vitality':
      return spirit / (damageOverTime ? 200 : 215)
    default:
      return 0
  }
}

// Sums "+X% <Type> Damage" bonuses from equipped items/devotions/sets, plus the attribute-derived
// percentage, into a single modifier percent for the given damage type.
export const getDamageTypeModifierPercent = (
  type: string,
  damageOverTime: boolean,
  sourceAttributes: Array<{ label: string; value: string }>,
  cunning: number,
  spirit: number,
) => {
  const label = `${type} Damage`
  let percent = 0
  for (const attribute of sourceAttributes) {
    if (attribute.label !== label) continue
    percent += parseDamageValue(String(attribute.value)).percent
  }
  return percent + getAttributeDamageMultiplier(type, damageOverTime, cunning, spirit) * 100
}

// weapons with an Armor Piercing stat convert that percentage of their flat Physical Damage into
// Piercing Damage (e.g. 100% Armor Piercing turns all Physical Damage into Piercing Damage)
export const getWeaponArmorPiercingPercent = (
  attributes: Array<{ label: string; value: string | number }> = [],
): number => {
  const attribute = attributes.find((candidate) => candidate.label === 'Armor Piercing')
  return attribute ? Number(String(attribute.value).replace(/[^0-9.-]/g, '')) : 0
}

export type ConvertibleDamageStat = { type: string; min: number; max: number; totalMin: number; totalMax: number }

// applies to ALL Physical attack damage (weapon base, skill flat bonuses, item bonuses combined),
// not just the weapon's own line - merges into an existing Piercing entry if one is present
export const applyArmorPiercingConversion = <T extends ConvertibleDamageStat>(
  stats: T[],
  armorPiercingPercent: number,
): T[] => {
  if (!armorPiercingPercent) return stats
  const physicalIndex = stats.findIndex((stat) => stat.type === 'Physical')
  if (physicalIndex === -1) return stats
  const physical = stats[physicalIndex]
  const factor = armorPiercingPercent / 100
  const convertedMin = physical.min * factor
  const convertedMax = physical.max * factor
  const convertedTotalMin = physical.totalMin * factor
  const convertedTotalMax = physical.totalMax * factor
  const remainingPhysical: T = {
    ...physical,
    min: physical.min - convertedMin,
    max: physical.max - convertedMax,
    totalMin: physical.totalMin - convertedTotalMin,
    totalMax: physical.totalMax - convertedTotalMax,
  }
  const result = [...stats]
  const keepsPhysical =
    remainingPhysical.min !== 0 ||
    remainingPhysical.max !== 0 ||
    remainingPhysical.totalMin !== 0 ||
    remainingPhysical.totalMax !== 0
  if (keepsPhysical) result[physicalIndex] = remainingPhysical
  else result.splice(physicalIndex, 1)
  const pierceIndex = result.findIndex((stat) => stat.type === 'Piercing')
  if (pierceIndex !== -1) {
    const pierce = result[pierceIndex]
    result[pierceIndex] = {
      ...pierce,
      min: pierce.min + convertedMin,
      max: pierce.max + convertedMax,
      totalMin: pierce.totalMin + convertedTotalMin,
      totalMax: pierce.totalMax + convertedTotalMax,
    }
  } else {
    result.push({
      ...physical,
      type: 'Piercing',
      min: convertedMin,
      max: convertedMax,
      totalMin: convertedTotalMin,
      totalMax: convertedTotalMax,
    })
  }
  return result
}
