import { useState, type Dispatch, type SetStateAction } from 'react'
import type { Item } from '@/domain/item/types'
import { isEquippableItem } from '@/domain/item/item.utils'
import type { MasterySkill } from '@/domain/skill/types'
import { trimAllocationsForLevel } from '@/domain/skill/skill.utils'
import { BASE_ATTRIBUTE_VALUE, ATTRIBUTE_POINT_VALUE, clampAttributes } from '@/domain/hero/hero.utils'
import type { Character } from '@/domain/hero/types'

const initialCharacter: Character = {
  level: 1,
  physique: BASE_ATTRIBUTE_VALUE,
  cunning: BASE_ATTRIBUTE_VALUE,
  spirit: BASE_ATTRIBUTE_VALUE,
  masteryLevels: {},
  skillLevels: {},
  equipment: {},
}

export function useHero(skillsets: Record<string, MasterySkill[]>) {
  const [character, setCharacter] = useState<Character>(initialCharacter)

  const changeLevel = (delta: number) => {
    setCharacter((current) => {
      const level = Math.max(1, Math.min(100, current.level + delta))
      return {
        ...trimAllocationsForLevel(current, level, skillsets),
        ...clampAttributes(level, current.physique, current.cunning, current.spirit),
      }
    })
  }

  const adjustAttribute = (field: 'physique' | 'cunning' | 'spirit', delta: number) => {
    setCharacter((current) => {
      const next = current[field] + delta * ATTRIBUTE_POINT_VALUE
      if (next < BASE_ATTRIBUTE_VALUE) return current
      const pointsSpent =
        (current.physique + current.cunning + current.spirit - BASE_ATTRIBUTE_VALUE * 3) / ATTRIBUTE_POINT_VALUE
      if (pointsSpent + delta > current.level) return current
      return { ...current, [field]: next }
    })
  }

  const equipItem = (item: Item) => {
    setCharacter((current) => {
      if (!item.isInstance || !isEquippableItem(item)) return current
      if (item.category === 'Off-Hand' && current.equipment.Weapon?.twoHanded) return current
      const equipment = { ...current.equipment }
      equipment[item.category === 'Ring' ? (equipment['Ring 1'] ? 'Ring 2' : 'Ring 1') : item.category] = item
      if (item.category === 'Weapon' && item.twoHanded) delete equipment['Off-Hand']
      return { ...current, equipment }
    })
  }

  const unequipItem = (item: Item) => {
    setCharacter((current) => {
      const equipment = { ...current.equipment }
      for (const slot of Object.keys(equipment)) {
        if (equipment[slot]?.id === item.id) delete equipment[slot]
      }
      return { ...current, equipment }
    })
  }

  const changeMastery = (slot: 'mastery1' | 'mastery2', value: string) =>
    setCharacter((current) => {
      if (slot === 'mastery2' && !current.mastery1) return current
      const replacedMasteries = slot === 'mastery1' ? [current.mastery1, ...(value ? [] : [current.mastery2])] : [current.mastery2]
      const masteryLevels = { ...current.masteryLevels }
      const skillLevels = { ...current.skillLevels }
      for (const mastery of replacedMasteries) {
        if (!mastery) continue
        delete masteryLevels[mastery]
        for (const skill of skillsets[mastery] ?? []) delete skillLevels[skill.id]
      }
      return {
        ...current,
        mastery1: slot === 'mastery1' ? value || undefined : current.mastery1,
        mastery2: slot === 'mastery1' ? (value ? current.mastery2 : undefined) : value || undefined,
        masteryLevels,
        skillLevels,
      }
    })

  return {
    character,
    setCharacter: setCharacter as Dispatch<SetStateAction<Character>>,
    changeLevel,
    adjustAttribute,
    equipItem,
    unequipItem,
    changeMastery,
  }
}
