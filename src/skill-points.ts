import type { Character } from './types'
import type { MasterySkill } from './types'

export const skillPointsForLevel = (level: number) =>
  Math.max(0, Math.min(level, 50) - 1) * 3 +
  Math.max(0, Math.min(level, 90) - 50) * 2 +
  Math.max(0, Math.min(level, 100) - 90)

export const spentSkillPoints = (character: Character) =>
  Object.values(character.masteryLevels).reduce((total, value) => total + value, 0) +
  Object.values(character.skillLevels).reduce((total, value) => total + value, 0)

export const trimAllocationsForLevel = (
  character: Character,
  level: number,
  skillsets: Record<string, MasterySkill[]>,
) => {
  const masteryLevels = { ...character.masteryLevels }
  const skillLevels = { ...character.skillLevels }
  const skills = Object.values(skillsets).flat()
  const requirements = new Map(skills.map((skill) => [skill.id, skill.masteryLevelRequired]))
  const budget = skillPointsForLevel(level)
  const skillMasteryLevel = (skillId: string) => {
    const masteryId = skillId.split('/')[0].replace('playerclass', '')
    return masteryLevels[masteryId] ?? 0
  }

  const removeInvalidSkills = () => {
    for (const [skillId, points] of Object.entries(skillLevels)) {
      if (points > 0 && (requirements.get(skillId) ?? 0) > skillMasteryLevel(skillId)) skillLevels[skillId] = 0
    }
  }

  removeInvalidSkills()
  while (
    Object.values(masteryLevels).reduce((total, value) => total + value, 0) +
      Object.values(skillLevels).reduce((total, value) => total + value, 0) >
    budget
  ) {
    const skillToRefund = Object.entries(skillLevels)
      .filter(([, points]) => points > 0)
      .sort((left, right) => (requirements.get(right[0]) ?? 0) - (requirements.get(left[0]) ?? 0))[0]?.[0]
    if (skillToRefund) {
      skillLevels[skillToRefund] -= 1
      continue
    }
    const masteryToRefund = Object.entries(masteryLevels).sort((left, right) => right[1] - left[1])[0]?.[0]
    if (!masteryToRefund || masteryLevels[masteryToRefund] <= 0) break
    masteryLevels[masteryToRefund] -= 1
    removeInvalidSkills()
  }

  return { ...character, level, masteryLevels, skillLevels }
}
