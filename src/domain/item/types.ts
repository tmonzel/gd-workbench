export type Item = {
  id: string
  isInstance?: boolean
  name: string
  qualityTag?: string
  prefix?: string
  suffix?: string
  prefixId?: string
  suffixId?: string
  componentId?: string
  augmentId?: string
  relicBonusId?: string
  baseAttributes?: Array<{ label: string; value: string | number }>
  description: string
  category: string
  rarity: string
  originRarity?: string
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
