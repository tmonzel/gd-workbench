export type Item = {
  id: string
  name: string
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

export type Mastery = {
  id: string
  name: string
  combinations: Array<{ id: string; first: string; second: string; name: string }>
}

export type MasterySkill = {
  id: string
  name: string
  description: string
  maxLevel: number
  groupId: string
  isModifier: boolean
  isTransmuter: boolean
  icon?: string
  effects: Array<{
    key: string
    label: string
    values: number[]
    suffix?: string
    minValues?: number[]
    maxValues?: number[]
  }>
  summonEffects: Array<{
    name: string
    effects: Array<{
      key: string
      label: string
      values: number[]
      suffix?: string
      minValues?: number[]
      maxValues?: number[]
    }>
  }>
}

export type Character = {
  level: number
  physique: number
  cunning: number
  spirit: number
  mastery1?: string
  mastery2?: string
  skillLevels: Record<string, number>
  equipment: Partial<Record<string, Item>>
}
