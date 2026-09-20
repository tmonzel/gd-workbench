import type { Item } from '@/domain/item/types'

export type { EquippedSetInfo, ItemSet, ItemSetBonusTier } from '@/domain/item/types'
import type { EquippedSetInfo, ItemSet } from '@/domain/item/types'

export const RARITIES = ['Common', 'Magic', 'Rare', 'Epic', 'Legendary']

export const rarityTextClasses: Record<string, string> = {
  common: 'text-white',
  magic: 'text-yellow-300',
  rare: 'text-green-400',
  epic: 'text-blue-400',
  legendary: 'text-purple-400',
}

export const rarityBackgroundClasses: Record<string, string> = {
  common: 'bg-white/5',
  magic: 'bg-yellow-300/5',
  rare: 'bg-green-400/5',
  epic: 'bg-blue-400/5',
  legendary: 'bg-purple-400/5',
}

export const rarityBorderClasses: Record<string, string> = {
  common: 'border-white/70',
  magic: 'border-yellow-300/70',
  rare: 'border-green-400/70',
  epic: 'border-blue-400/70',
  legendary: 'border-purple-400/70',
}

export const EQUIPPABLE_CATEGORIES = new Set([
  'Weapon',
  'Off-Hand',
  'Chest Armor',
  'Gloves',
  'Pants',
  'Boots',
  'Helm',
  'Shoulders',
  'Belt',
  'Amulet',
  'Ring',
  'Medal',
  'Relic',
])

export const isEquippableItem = (item: Item) => EQUIPPABLE_CATEGORIES.has(item.category)

export const getEquippedSetInfo = (
  equipment: Partial<Record<string, Item>>,
  itemSets: ItemSet[],
): EquippedSetInfo[] => {
  const equippedIds = new Set(Object.values(equipment).flatMap((item) => (item ? [item.id] : [])))
  return itemSets
    .map((set) => {
      const equippedCount = set.members.filter((id) => equippedIds.has(id)).length
      const activeTier = [...set.bonuses].reverse().find((tier) => tier.count <= equippedCount)
      return { set, equippedCount, activeTier }
    })
    .filter(({ equippedCount }) => equippedCount > 0)
}

export const getSetForItem = (itemId: string, itemSets: ItemSet[]) =>
  itemSets.find((set) => set.members.includes(itemId))

export type SkillBonus = { name: string; amount: number }

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
