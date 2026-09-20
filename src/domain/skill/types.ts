export type Mastery = {
  id: string
  name: string
  progression?: Record<string, number[]>
  combinations: Array<{ id: string; first: string; second: string; name: string }>
}

export type MasterySkill = {
  id: string
  name: string
  description: string
  maxLevel: number
  groupId: string
  masteryLevelRequired: number
  isModifier: boolean
  isTransmuter: boolean
  isWeaponDefaultAttack: boolean
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
