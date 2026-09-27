import type { Dispatch, SetStateAction } from 'react'
import type { Character } from '@/domain/hero/types'
import type { MasterySkill } from '@/domain/skill/types'
import { skillPointsForLevel, spentSkillPoints } from '@/domain/skill/skill.utils'
import SkillItem from '@/domain/skill/components/SkillItem'

type SkillListProps = {
  skills: MasterySkill[]
  character: Character
  setCharacter: Dispatch<SetStateAction<Character>>
  masteryId: string
  masteryLevel: number
}

function SkillList({ skills, character, setCharacter, masteryId, masteryLevel }: SkillListProps) {
  const skillGroups = [...new Set(skills.map((skill) => skill.groupId))]
    .map((groupId) => ({
      base:
        skills.find((skill) => skill.groupId === groupId && !skill.isModifier) ??
        skills.find((skill) => skill.groupId === groupId),
      modifiers: skills.filter((skill) => skill.groupId === groupId && skill.isModifier),
    }))
    .sort((left, right) => (left.base?.masteryLevelRequired ?? 0) - (right.base?.masteryLevelRequired ?? 0))

  const changeSkillLevel = (skill: MasterySkill, delta: number, baseSkillId = skill.id) => {
    setCharacter((current) => {
      if (skill.isModifier && (current.skillLevels[baseSkillId] ?? 0) < 1) return current
      if (delta > 0 && (current.masteryLevels[masteryId] ?? masteryLevel) < skill.masteryLevelRequired) return current
      if (delta > 0 && spentSkillPoints(current) >= skillPointsForLevel(current.level)) return current
      const currentLevel = current.skillLevels[skill.id] ?? 0
      const level = Math.max(0, Math.min(skill.maxLevel, currentLevel + delta))
      const skillLevels = { ...current.skillLevels, [skill.id]: level }
      if (!skill.isModifier && level === 0) {
        for (const child of skills.filter((entry) => entry.groupId === skill.groupId && entry.isModifier))
          delete skillLevels[child.id]
      }
      return { ...current, skillLevels }
    })
  }

  if (!skillGroups.length) return null
  return (
    <div className="mt-6 grid gap-2 columns-1 sm:columns-2">
      {skillGroups.map(({ base, modifiers }) => {
        if (!base) return null
        return (
          <SkillItem
            key={base.id}
            skill={base}
            character={character}
            masteryLevel={masteryLevel}
            baseSkillId={base.id}
            modifiers={modifiers}
            onChangeLevel={changeSkillLevel}
          />
        )
      })}
    </div>
  )
}

export default SkillList
