import type { Character } from '@/domain/hero/types'
import type { MasterySkill } from '@/domain/skill/types'

export const DAMAGE_COLORS: Record<string, string> = {
  Physical: '#9ca3af',
  Fire: '#dc2626',
  Cold: '#3b82f6',
  Lightning: '#bfdbfe',
  Poison: '#22c55e',
  Piercing: '#d4d4d8',
  Bleeding: '#ef4444',
  Aether: '#2dd4bf',
  Chaos: '#a855f7',
  Vitality: '#db2777',
}
export const DAMAGE_TYPES = Object.keys(DAMAGE_COLORS)
export const damageLabel = (type: string) => `${type} Damage`
export const resistanceLabel = (type: string) => `${type} Resistance`
export const formatSkillValue = (value: number) => (Number.isInteger(value) ? String(value) : value.toFixed(1))

export const formatSkillEffectValue = (
  effect: { value: number; minValues?: number[]; maxValues?: number[] },
  level: number,
  multiplier = 1,
) => {
  const min = effect.minValues?.[Math.min(level, effect.minValues.length) - 1]
  const max = effect.maxValues?.[Math.min(level, effect.maxValues.length) - 1]
  if (Number.isFinite(min) && Number.isFinite(max) && min !== 0 && max !== 0)
    return `${formatSkillValue(min! * multiplier)}-${formatSkillValue(max! * multiplier)}`
  if (Number.isFinite(min) && min !== 0) return formatSkillValue(min! * multiplier)
  if (Number.isFinite(max) && max !== 0) return formatSkillValue(max! * multiplier)
  return formatSkillValue(effect.value * multiplier)
}
export const formatSkillEffect = (
  effect: { value: number; label: string; suffix?: string; minValues?: number[]; maxValues?: number[] },
  level: number,
  multiplier = 1,
  label = effect.label,
) => `${formatSkillEffectValue(effect, level, multiplier)}${effect.suffix ?? ''} ${label}`
export const formatSkillEffectParts = (
  effect: { value: number; label: string; suffix?: string; minValues?: number[]; maxValues?: number[] },
  level: number,
  multiplier = 1,
  label = effect.label,
) => ({ value: `${formatSkillEffectValue(effect, level, multiplier)}${effect.suffix ?? ''}`, label })

export const skillPointsForLevel = (level: number) =>
  Math.max(0, Math.min(level, 50) - 1) * 3 +
  Math.max(0, Math.min(level, 90) - 50) * 2 +
  Math.max(0, Math.min(level, 100) - 90)
export const spentSkillPoints = (character: Character) =>
  Object.values(character.masteryLevels).reduce((total, value) => total + value, 0) +
  Object.values(character.skillLevels).reduce((total, value) => total + value, 0)
export const trimAllocationsForLevel = (
  character: Character,
  level: number,
  skillsets: Record<string, MasterySkill[]>,
) => {
  const masteryLevels = { ...character.masteryLevels },
    skillLevels = { ...character.skillLevels }
  const requirements = new Map(
    Object.values(skillsets)
      .flat()
      .map((skill) => [skill.id, skill.masteryLevelRequired]),
  )
  const budget = skillPointsForLevel(level)
  const skillMasteryLevel = (skillId: string) => masteryLevels[skillId.split('/')[0].replace('playerclass', '')] ?? 0
  const removeInvalidSkills = () => {
    for (const [skillId, points] of Object.entries(skillLevels))
      if (points > 0 && (requirements.get(skillId) ?? 0) > skillMasteryLevel(skillId)) skillLevels[skillId] = 0
  }
  removeInvalidSkills()
  while (
    Object.values(masteryLevels).reduce((total, value) => total + value, 0) +
      Object.values(skillLevels).reduce((total, value) => total + value, 0) >
    budget
  ) {
    const skillToRefund = Object.entries(skillLevels)
      .filter(([, points]) => points > 0)
      .sort((left, right) => (requirements.get(right[0]) ?? 0) - (requirements.get(left[0]) ?? 0))[0]?.[0]
    if (skillToRefund) {
      skillLevels[skillToRefund] -= 1
      continue
    }
    const masteryToRefund = Object.entries(masteryLevels).sort((left, right) => right[1] - left[1])[0]?.[0]
    if (!masteryToRefund || masteryLevels[masteryToRefund] <= 0) break
    masteryLevels[masteryToRefund] -= 1
    removeInvalidSkills()
  }
  return { ...character, level, masteryLevels, skillLevels }
}
