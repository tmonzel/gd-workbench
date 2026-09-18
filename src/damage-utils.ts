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
) => ({
  value: `${formatSkillEffectValue(effect, level, multiplier)}${effect.suffix ?? ''}`,
  label,
})
