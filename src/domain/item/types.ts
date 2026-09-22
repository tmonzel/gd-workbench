export type Item = {
  id: string
  name: string
  qualityTag?: string
  prefix?: string
  suffix?: string
  description: string
  category: string
  rarity: string
  level: number
  image?: string
  twoHanded?: boolean
  attributes?: Array<{ label: string; value: string | number }>
  stats?: Record<string, string | number>
  grantedSkill?: {
    name: string
    description: string
    level: number
    attributes: Array<{ label: string; value: string | number }>
  }
}

export type ItemSetBonusTier = {
  count: number
  attributes: Array<{ label: string; value: string }>
  skill?: { name: string; description: string; level: number }
}

export type ItemSet = {
  id: string
  name: string
  description: string
  members: string[]
  bonuses: ItemSetBonusTier[]
}

export type EquippedSetInfo = { set: ItemSet; equippedCount: number; activeTier?: ItemSetBonusTier }
