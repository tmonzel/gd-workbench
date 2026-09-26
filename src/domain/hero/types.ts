import type { Item } from '@/domain/item/types'

export type Character = {
  level: number
  physique: number
  cunning: number
  spirit: number
  mastery1?: string
  mastery2?: string
  masteryLevels: Record<string, number>
  skillLevels: Record<string, number>
  disabledPassiveSkills?: string[]
  equipment: Partial<Record<string, Item>>
}
