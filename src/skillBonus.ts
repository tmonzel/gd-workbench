import type { Item } from './types'

export type SkillBonus = { name: string; amount: number }

// items describe granted skill points as an attribute like "+2 to Fire Strike"
export const parseSkillBonus = (value: string | number): SkillBonus | null => {
  const match = /^\+?(-?\d+(?:\.\d+)?)\s+to\s+(.+)$/i.exec(String(value).trim())
  if (!match) return null
  const amount = Number(match[1])
  if (!Number.isFinite(amount)) return null
  return { name: match[2].trim(), amount }
}

export const getEquippedSkillBonuses = (equipment: Partial<Record<string, Item>>): Record<string, number> => {
  const bonuses: Record<string, number> = {}
  for (const item of Object.values(equipment)) {
    for (const attribute of item?.attributes ?? []) {
      if (attribute.label !== 'Skill Bonus') continue
      const parsed = parseSkillBonus(attribute.value)
      if (parsed) bonuses[parsed.name] = (bonuses[parsed.name] ?? 0) + parsed.amount
    }
  }
  return bonuses
}
