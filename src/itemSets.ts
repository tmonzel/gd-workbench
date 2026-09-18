import type { Item } from './types'

export type ItemSetBonusTier = {
  count: number
  attributes: Array<{ label: string; value: string }>
  skill?: { name: string; description: string; level: number }
}
export type ItemSet = { id: string; name: string; description: string; members: string[]; bonuses: ItemSetBonusTier[] }

export type EquippedSetInfo = { set: ItemSet; equippedCount: number; activeTier?: ItemSetBonusTier }

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
